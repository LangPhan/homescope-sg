import { createHash, randomUUID } from "node:crypto";
import { EventType, type StreamChunk } from "@tanstack/ai";
import { createClient } from "@redis/client";

const CACHE_SCHEMA_VERSION = "v2";
const CACHE_TTL_SECONDS = 30 * 60;
const MAX_SCOPE_ENTRIES = 60;
const MAX_CACHED_BYTES = 256_000;
const SIMILARITY_THRESHOLD = 0.76;
const FAST_SIMILARITY_THRESHOLD = 0.92;

function createRedisClient() {
  return createClient({
    url: redisUrl(),
    socket: { connectTimeout: 500, reconnectStrategy: false },
  });
}

type RedisClient = ReturnType<typeof createRedisClient>;

export type CachedAiAnswer = {
  query: string;
  sourceQuery: string;
  tokens: string[];
  sourceTokens: string[];
  criticalTokens: string[];
  sourceCriticalTokens: string[];
  chunks: StreamChunk[];
  createdAt: number;
};

export interface AiCacheStore {
  getDataVersion(): Promise<string>;
  list(scope: string): Promise<CachedAiAnswer[]>;
  put(scope: string, id: string, answer: CachedAiAnswer, ttlSeconds: number, maxEntries: number): Promise<void>;
}

export type AiCacheContext = {
  category: string;
  model: string;
  pageContext: { pathname: string; filters: Record<string, string> };
};

const stopWords = new Set([
  "a", "an", "and", "are", "can", "could", "find", "for", "home", "homes", "i", "in", "is", "me", "of", "please", "property", "properties", "show", "that", "the", "to", "want", "with", "would",
]);

const tokenAliases: Record<string, string> = {
  apartments: "apartment",
  bed: "bedroom",
  bedrooms: "bedroom",
  beds: "bedroom",
  below: "under",
  cheaper: "under",
  close: "near",
  condos: "condo",
  condominium: "condo",
  condominiums: "condo",
  districts: "district",
  eight: "8",
  five: "5",
  flats: "hdb",
  four: "4",
  nine: "9",
  nearby: "near",
  one: "1",
  seven: "7",
  six: "6",
  station: "mrt",
  stations: "mrt",
  ten: "10",
  three: "3",
  two: "2",
  within: "under",
};

const criticalWords = new Set([
  "apartment", "bedroom", "condo", "district", "freehold", "hdb", "landed", "max", "min", "mrt", "near", "under",
]);

let redisClientPromise: Promise<RedisClient> | null = null;

function redisUrl() {
  return process.env.REDIS_URL || `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || "6379"}`;
}

async function getRedisClient(): Promise<RedisClient> {
  if (!redisClientPromise) {
    const client = createRedisClient();
    client.on("error", () => undefined);
    redisClientPromise = client.connect().then(() => client).catch((error) => {
      redisClientPromise = null;
      throw error;
    });
  }
  return await redisClientPromise;
}

function parseAnswer(value: string | null): CachedAiAnswer | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<CachedAiAnswer>;
    if (typeof parsed.query !== "string" || typeof parsed.sourceQuery !== "string" || !Array.isArray(parsed.tokens) || !Array.isArray(parsed.sourceTokens) || !Array.isArray(parsed.criticalTokens) || !Array.isArray(parsed.sourceCriticalTokens) || !Array.isArray(parsed.chunks) || typeof parsed.createdAt !== "number") return null;
    return parsed as CachedAiAnswer;
  } catch {
    return null;
  }
}

export const redisAiCacheStore: AiCacheStore = {
  async getDataVersion() {
    const client = await getRedisClient();
    return await client.get("homescope:data-version") || "0";
  },
  async list(scope) {
    const client = await getRedisClient();
    const indexKey = `ai:answers:index:${scope}`;
    const keys = await client.lRange(indexKey, 0, MAX_SCOPE_ENTRIES - 1);
    if (!keys.length) return [];
    const values = await client.mGet(keys);
    return values.map(parseAnswer).filter((answer): answer is CachedAiAnswer => answer !== null);
  },
  async put(scope, id, answer, ttlSeconds, maxEntries) {
    const client = await getRedisClient();
    const indexKey = `ai:answers:index:${scope}`;
    const answerKey = `ai:answers:item:${scope}:${id}`;
    await client.multi()
      .set(answerKey, JSON.stringify(answer), { EX: ttlSeconds })
      .lRem(indexKey, 0, answerKey)
      .lPush(indexKey, answerKey)
      .lTrim(indexKey, 0, maxEntries - 1)
      .expire(indexKey, ttlSeconds)
      .exec();
  },
};

function canonicalMoney(input: string) {
  return input.replace(/(?:s\s*\$|\$)?(\d+(?:\.\d+)?)\s*(million|thousand|m|k)\b/gi, (_match, amount: string, unit: string) => {
    const multiplier = /^(m|million)$/i.test(unit) ? 1_000_000 : 1_000;
    return String(Math.round(Number(amount) * multiplier));
  });
}

export function queryTokens(query: string): string[] {
  const normalized = canonicalMoney(query)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const tokens = normalized.split(/\s+/)
    .filter(Boolean)
    .map((token) => tokenAliases[token] || token)
    .filter((token) => !stopWords.has(token));
  return [...new Set(tokens)].sort();
}

function criticalTokens(tokens: string[]) {
  return tokens.filter((token) => /^\d+(?:\.\d+)?$/.test(token) || /^d(?:0[1-9]|1\d|2[0-8])$/.test(token) || criticalWords.has(token));
}

export function answerSimilarity(left: string[], right: string[]): number {
  if (!left.length || !right.length) return 0;
  const rightSet = new Set(right);
  const intersection = left.filter((token) => rightSet.has(token)).length;
  return (2 * intersection) / (left.length + right.length);
}

function sameTokens(left: string[], right: string[]) {
  return left.length === right.length && left.every((token, index) => token === right[index]);
}

function hash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

async function cacheScope(context: AiCacheContext, store: AiCacheStore, global = false) {
  const dataVersion = await store.getDataVersion();
  return hash(JSON.stringify({ schema: CACHE_SCHEMA_VERSION, dataVersion, category: global ? "global" : context.category, model: context.model })).slice(0, 32);
}

export function isStandaloneQuestion(query: string) {
  return !/\b(these|those|them|this one|that one|above|previous|same ones?)\b/i.test(query);
}

export async function findCachedAnswer(query: string, context: AiCacheContext, store: AiCacheStore = redisAiCacheStore) {
  if (!isStandaloneQuestion(query)) return null;
  try {
    const scope = await cacheScope(context, store);
    const tokens = queryTokens(query);
    const constraints = criticalTokens(tokens);
    const answers = await store.list(scope);
    let best: { answer: CachedAiAnswer; similarity: number } | null = null;
    for (const answer of answers) {
      if (!sameTokens(constraints, answer.criticalTokens)) continue;
      const similarity = answerSimilarity(tokens, answer.tokens);
      if (similarity >= SIMILARITY_THRESHOLD && (!best || similarity > best.similarity)) best = { answer, similarity };
    }
    return best ? { ...best, scope } : null;
  } catch {
    return null;
  }
}

export async function findFastCachedAnswer(query: string, context: AiCacheContext, store: AiCacheStore = redisAiCacheStore) {
  if (!isStandaloneQuestion(query)) return null;
  try {
    const scope = await cacheScope(context, store, true);
    const tokens = queryTokens(query);
    const constraints = criticalTokens(tokens);
    const answers = await store.list(scope);
    let best: { answer: CachedAiAnswer; similarity: number } | null = null;
    for (const answer of answers) {
      if (!sameTokens(constraints, answer.sourceCriticalTokens)) continue;
      const similarity = answerSimilarity(tokens, answer.sourceTokens);
      if (similarity >= FAST_SIMILARITY_THRESHOLD && (!best || similarity > best.similarity)) best = { answer, similarity };
    }
    return best ? { ...best, scope } : null;
  } catch {
    return null;
  }
}

export async function storeCachedAnswer(query: string, chunks: StreamChunk[], context: AiCacheContext, store: AiCacheStore = redisAiCacheStore, sourceQuery = query) {
  if (!isStandaloneQuestion(query) || !isStandaloneQuestion(sourceQuery) || !chunks.some((chunk) => chunk.type === EventType.RUN_FINISHED) || chunks.some((chunk) => chunk.type === EventType.RUN_ERROR)) return;
  try {
    const tokens = queryTokens(query);
    const sourceTokens = queryTokens(sourceQuery);
    const answer: CachedAiAnswer = {
      query,
      sourceQuery,
      tokens,
      sourceTokens,
      criticalTokens: criticalTokens(tokens),
      sourceCriticalTokens: criticalTokens(sourceTokens),
      chunks,
      createdAt: Date.now(),
    };
    if (Buffer.byteLength(JSON.stringify(answer)) > MAX_CACHED_BYTES) return;
    const scope = await cacheScope(context, store);
    const globalScope = await cacheScope(context, store, true);
    const id = hash(tokens.join(" ")).slice(0, 24);
    await Promise.all([
      store.put(scope, id, answer, CACHE_TTL_SECONDS, MAX_SCOPE_ENTRIES),
      store.put(globalScope, hash(sourceTokens.join(" ")).slice(0, 24), answer, CACHE_TTL_SECONDS, MAX_SCOPE_ENTRIES),
    ]);
  } catch {
    // AI remains available when Redis is unavailable.
  }
}

function remapId(id: string | undefined, prefix: string, ids: Map<string, string>) {
  if (!id) return id;
  const key = `${prefix}:${id}`;
  if (!ids.has(key)) ids.set(key, `${prefix}-${randomUUID()}`);
  return ids.get(key)!;
}

export function replayCachedChunks(chunks: StreamChunk[], threadId: string, runId: string): StreamChunk[] {
  const ids = new Map<string, string>();
  const startedAt = Date.now();
  return chunks.map((chunk, index) => {
    const replay = structuredClone(chunk) as StreamChunk & Record<string, unknown>;
    if ("threadId" in replay) replay.threadId = threadId;
    if ("runId" in replay) replay.runId = runId;
    if ("messageId" in replay && typeof replay.messageId === "string") replay.messageId = remapId(replay.messageId, "message", ids);
    if ("parentMessageId" in replay && typeof replay.parentMessageId === "string") replay.parentMessageId = remapId(replay.parentMessageId, "message", ids);
    if ("toolCallId" in replay && typeof replay.toolCallId === "string") replay.toolCallId = remapId(replay.toolCallId, "tool", ids);
    if ("timestamp" in replay) replay.timestamp = startedAt + index;
    return replay;
  });
}

export async function* cachedAnswerStream(chunks: StreamChunk[], threadId: string, runId: string): AsyncIterable<StreamChunk> {
  for (const chunk of replayCachedChunks(chunks, threadId, runId)) yield chunk;
}

export async function* captureAnswerStream(stream: AsyncIterable<StreamChunk>, query: string, context: AiCacheContext, sourceQuery = query, store: AiCacheStore = redisAiCacheStore): AsyncIterable<StreamChunk> {
  const chunks: StreamChunk[] = [];
  for await (const chunk of stream) {
    chunks.push(structuredClone(chunk));
    yield chunk;
  }
  await storeCachedAnswer(query, chunks, context, store, sourceQuery);
}
