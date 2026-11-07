import { beforeEach, describe, expect, it } from "vitest";
import { metrics, metricsText, recordAiCache, recordAiProvider, recordAiRequest, recordAiTool, recordAiUsage } from "./metrics";

describe("application metrics", () => {
  beforeEach(() => metrics.registry.resetMetrics());

  it("exports bounded AI counters and histograms", async () => {
    recordAiRequest("property_search", "allowed");
    recordAiCache("semantic", "hit");
    recordAiProvider("advisor", "success", 0.5);
    recordAiTool("search_listings", "success", 0.05);
    recordAiUsage("cx/gpt-6-luna", { inputTokens: 12, outputTokens: 5, totalTokens: 17 });
    const output = await metricsText();
    expect(output).toContain('homescope_ai_requests_total{classification="property_search",outcome="allowed",service="web"} 1');
    expect(output).toContain('homescope_ai_cache_total{layer="semantic",result="hit",service="web"} 1');
    expect(output).toContain('homescope_ai_tokens_total{type="total",model="cx/gpt-6-luna",service="web"} 17');
    expect(output).toContain("homescope_ai_tool_duration_seconds_bucket");
  });
});
