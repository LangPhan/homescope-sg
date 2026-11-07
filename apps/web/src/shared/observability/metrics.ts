import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

type MetricsStore = {
  registry: Registry;
  aiRequests: Counter<"classification" | "outcome">;
  aiCache: Counter<"layer" | "result">;
  aiProviderDuration: Histogram<"stage" | "outcome">;
  aiTokens: Counter<"type" | "model">;
  aiToolCalls: Counter<"tool" | "outcome">;
  aiToolDuration: Histogram<"tool" | "outcome">;
};

const globalMetrics = globalThis as typeof globalThis & { __homescopeMetrics?: MetricsStore };

function createMetrics(): MetricsStore {
  const registry = new Registry();
  registry.setDefaultLabels({ service: "web" });
  collectDefaultMetrics({ register: registry, prefix: "homescope_web_" });
  return {
    registry,
    aiRequests: new Counter({ name: "homescope_ai_requests_total", help: "AI advisor requests by classification and outcome.", labelNames: ["classification", "outcome"], registers: [registry] }),
    aiCache: new Counter({ name: "homescope_ai_cache_total", help: "AI response cache lookups.", labelNames: ["layer", "result"], registers: [registry] }),
    aiProviderDuration: new Histogram({ name: "homescope_ai_provider_duration_seconds", help: "AI provider stage duration.", labelNames: ["stage", "outcome"], buckets: [0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30], registers: [registry] }),
    aiTokens: new Counter({ name: "homescope_ai_tokens_total", help: "AI provider token usage.", labelNames: ["type", "model"], registers: [registry] }),
    aiToolCalls: new Counter({ name: "homescope_ai_tool_calls_total", help: "AI tool calls by outcome.", labelNames: ["tool", "outcome"], registers: [registry] }),
    aiToolDuration: new Histogram({ name: "homescope_ai_tool_duration_seconds", help: "AI tool execution duration.", labelNames: ["tool", "outcome"], buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5], registers: [registry] }),
  };
}

const metrics = globalMetrics.__homescopeMetrics ??= createMetrics();

export function recordAiRequest(classification: string, outcome: "allowed" | "blocked" | "error"): void {
  metrics.aiRequests.inc({ classification, outcome });
}

export function recordAiCache(layer: "fast" | "semantic", result: "hit" | "miss"): void {
  metrics.aiCache.inc({ layer, result });
}

export function recordAiProvider(stage: "classifier" | "advisor", outcome: "success" | "error", durationSeconds: number): void {
  metrics.aiProviderDuration.observe({ stage, outcome }, durationSeconds);
}

export function recordAiUsage(model: string, usage: unknown): void {
  if (!usage || typeof usage !== "object") return;
  const values = usage as Record<string, unknown>;
  const tokenTypes = [["input", values.inputTokens ?? values.promptTokens], ["output", values.outputTokens ?? values.completionTokens], ["total", values.totalTokens]] as const;
  for (const [type, value] of tokenTypes) if (typeof value === "number" && Number.isFinite(value)) metrics.aiTokens.inc({ type, model }, value);
}

export function recordAiTool(tool: string, outcome: "success" | "error", durationSeconds: number): void {
  metrics.aiToolCalls.inc({ tool, outcome });
  metrics.aiToolDuration.observe({ tool, outcome }, durationSeconds);
}

export async function metricsText(): Promise<string> {
  return metrics.registry.metrics();
}

export { metrics };
