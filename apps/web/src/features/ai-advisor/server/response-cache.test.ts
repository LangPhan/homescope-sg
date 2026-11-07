import { EventType, type StreamChunk } from "@tanstack/ai";
import { describe, expect, it } from "vitest";
import {
  answerSimilarity,
  findCachedAnswer,
  findFastCachedAnswer,
  queryTokens,
  redisAiCacheStore,
  replayCachedChunks,
  storeCachedAnswer,
  type AiCacheContext,
  type AiCacheStore,
  type CachedAiAnswer,
} from "./response-cache";

class MemoryCacheStore implements AiCacheStore {
  version = "1";
  readonly scopes = new Map<string, CachedAiAnswer[]>();

  async getDataVersion() {
    return this.version;
  }

  async list(scope: string) {
    return this.scopes.get(scope) || [];
  }

  async put(scope: string, _id: string, answer: CachedAiAnswer) {
    this.scopes.set(scope, [answer, ...(this.scopes.get(scope) || [])]);
  }
}

const context: AiCacheContext = {
  category: "property_search",
  model: "test-model",
  pageContext: { pathname: "/search", filters: {} },
};

function answerChunks(): StreamChunk[] {
  return [
    { type: EventType.RUN_STARTED, threadId: "old-thread", runId: "old-run", timestamp: 1 },
    { type: EventType.TEXT_MESSAGE_START, messageId: "old-message", role: "assistant", timestamp: 2 },
    { type: EventType.TEXT_MESSAGE_CONTENT, messageId: "old-message", delta: "Two matching homes.", timestamp: 3 },
    { type: EventType.TEXT_MESSAGE_END, messageId: "old-message", timestamp: 4 },
    { type: EventType.RUN_FINISHED, threadId: "old-thread", runId: "old-run", finishReason: "stop", timestamp: 5 },
  ];
}

describe("AI response cache", () => {
  it("matches semantically similar normalized property questions", async () => {
    const store = new MemoryCacheStore();
    const original = "Find a two-bedroom condo under S$1.8M near an MRT";
    const similar = "Show condos with 2 bedrooms below $1.8 million close to an MRT";

    await storeCachedAnswer(original, answerChunks(), context, store);
    const hit = await findCachedAnswer(similar, context, store);

    expect(answerSimilarity(queryTokens(original), queryTokens(similar))).toBe(1);
    expect(hit?.answer.query).toBe(original);
  });

  it("serves an exact sample question globally before classification", async () => {
    const store = new MemoryCacheStore();
    const sourceQuery = "How does HomeScope work?";
    await storeCachedAnswer("Explain how HomeScope works", answerChunks(), { ...context, category: "product_help" }, store, sourceQuery);

    const hit = await findFastCachedAnswer(sourceQuery, {
      ...context,
      category: "global",
      pageContext: { pathname: "/engineering", filters: { district: "D15" } },
    }, store);

    expect(hit?.answer.sourceQuery).toBe(sourceQuery);
  });

  it("does not reuse an answer when a critical property constraint changes", async () => {
    const store = new MemoryCacheStore();
    await storeCachedAnswer("Find a 2-bedroom condo under $1.8M near MRT", answerChunks(), context, store);

    await expect(findCachedAnswer("Find a 2-bedroom condo under $2M near MRT", context, store)).resolves.toBeNull();
  });

  it("revalidates automatically when the shared data version changes", async () => {
    const store = new MemoryCacheStore();
    const query = "Find a 2-bedroom condo under $1.8M near MRT";
    await storeCachedAnswer(query, answerChunks(), context, store);
    await expect(findCachedAnswer(query, context, store)).resolves.not.toBeNull();

    store.version = "2";

    await expect(findCachedAnswer(query, context, store)).resolves.toBeNull();
  });

  it("replays cached streams with fresh conversation identifiers", () => {
    const replayed = replayCachedChunks(answerChunks(), "new-thread", "new-run");
    const started = replayed[0] as StreamChunk & { threadId: string; runId: string };
    const messageIds = replayed
      .filter((chunk): chunk is StreamChunk & { messageId: string } => "messageId" in chunk)
      .map((chunk) => chunk.messageId);

    expect(started.threadId).toBe("new-thread");
    expect(started.runId).toBe("new-run");
    expect(new Set(messageIds)).toHaveLength(1);
    expect(messageIds[0]).not.toBe("old-message");
  });

  it.runIf(process.env.REDIS_INTEGRATION === "1")("shares cached answers through the real Redis store", async () => {
    const sourceQuery = `How does HomeScope work cache integration ${Date.now()}`;
    await storeCachedAnswer("Explain how HomeScope works", answerChunks(), { ...context, category: "product_help" }, redisAiCacheStore, sourceQuery);

    await expect(findFastCachedAnswer(sourceQuery, { ...context, category: "global" }, redisAiCacheStore)).resolves.not.toBeNull();
  });
});
