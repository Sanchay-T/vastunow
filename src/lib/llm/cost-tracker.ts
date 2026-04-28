// Per-million-token pricing (USD)
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-20250514': { input: 3.0, output: 15.0 },
  'claude-haiku-4-5-20251001': { input: 0.8, output: 4.0 },
};

export interface TokenUsage {
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface CostSummary {
  calls: TokenUsage[];
  total_input_tokens: number;
  total_output_tokens: number;
  total_cost_usd: number;
}

export function calculateCost(model: string, inputTokens: number, outputTokens: number): TokenUsage {
  const pricing = MODEL_PRICING[model] || { input: 3.0, output: 15.0 };
  const cost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;
  return {
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    cost_usd: Math.round(cost * 1_000_000) / 1_000_000, // 6 decimal places
  };
}

export function createCostSummary(): CostSummary {
  return { calls: [], total_input_tokens: 0, total_output_tokens: 0, total_cost_usd: 0 };
}

export function addUsage(summary: CostSummary, usage: TokenUsage): void {
  summary.calls.push(usage);
  summary.total_input_tokens += usage.input_tokens;
  summary.total_output_tokens += usage.output_tokens;
  summary.total_cost_usd = Math.round((summary.total_cost_usd + usage.cost_usd) * 1_000_000) / 1_000_000;
}
