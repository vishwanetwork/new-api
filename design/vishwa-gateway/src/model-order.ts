// Editorial snapshot, 2026-11-12. Based on recent model-family token usage on
// https://openrouter.ai/rankings, mapped to this catalog's available editions.
// Video is not comparable to language token traffic. Mistral is last by request.
// This is intentionally not presented as a live or global token leaderboard.
export const popularModelIds = [
  "deepseek-chat",
  "gpt-4o",
  "claude-sonnet-4",
  "kimi-k3.1-pro",
  "MiniMax-M2.7",
  "gemini-2.5-pro",
  "qwen3-coder",
  "dreamina-seedance-2-0-260128",
  "mistral-large-latest",
] as const;

export function modelPopularityRank(id: string) {
  const rank = popularModelIds.findIndex((model) => model === id);
  return rank < 0 ? popularModelIds.length : rank;
}

const providerOrder: Record<string, number> = {
  DeepSeek: 0,
  OpenAI: 1,
  Anthropic: 2,
  Kimi: 3,
  MiniMax: 4,
  Google: 5,
  "Google Gemini": 5,
  Qwen: 6,
  Seedance: 7,
  "ByteDance Seed": 7,
  Mistral: 8,
};
export const providerPopularityRank = (name: string) => providerOrder[name] ?? 99;
