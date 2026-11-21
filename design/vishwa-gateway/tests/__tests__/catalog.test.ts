import { afterEach, beforeEach, expect, test } from "bun:test";
import { modelPopularityRank } from "../../src/model-order";
import { createCommerceHarness } from "../setup/browser";

let harness: Awaited<ReturnType<typeof createCommerceHarness>>;
beforeEach(async () => {
  harness = await createCommerceHarness();
});
afterEach(() => {
  harness?.restore();
});

test.each(["kimi-k3.1-pro", "dreamina-seedance-2-0-260128", "MiniMax-M2.7"])(
  "requesting unconfigured %s rejects execution without charging credit",
  (modelId) => {
    const commerce = harness.commerce;
    const { key } = commerce.createApiKey({
      name: "Model check",
      expires: "",
      budgetCents: null,
      models: [],
    });

    expect(() => commerce.runLocalRequest(modelId, key.id, "Hello", 512)).toThrow(
      "This model is unavailable until gateway pricing is configured.",
    );

    expect(commerce.currentCustomer().balanceMicros).toBe(20_000_000);
    expect(commerce.getCommerce().usage).toHaveLength(0);
    expect(() => commerce.updatePricing(modelId, { status: "available" })).toThrow(
      "Configure model pricing and its gateway integration before making it available.",
    );
    expect(commerce.getCommerce().pricing.find((model) => model.id === modelId)?.status).toBe(
      "paused",
    );
  },
);

test("sorting the full catalog by popularity includes every model once and puts Mistral last", () => {
  const catalog = harness.commerce.pricingCatalog;
  const sorted = [...catalog].sort(
    (left, right) => modelPopularityRank(left.id) - modelPopularityRank(right.id),
  );
  const ids = sorted.map((model) => model.id);

  expect(ids).toEqual([
    "deepseek-chat",
    "gpt-4o",
    "claude-sonnet-4",
    "kimi-k3.1-pro",
    "MiniMax-M2.7",
    "gemini-2.5-pro",
    "qwen3-coder",
    "dreamina-seedance-2-0-260128",
    "mistral-large-latest",
  ]);
  expect(new Set(ids).size).toBe(catalog.length);
});

test("sorting a newly discovered model keeps established popular models ahead of it", () => {
  const ids = ["future-model", "mistral-large-latest", "deepseek-chat"];

  ids.sort((left, right) => modelPopularityRank(left) - modelPopularityRank(right));

  expect(ids).toEqual(["deepseek-chat", "mistral-large-latest", "future-model"]);
});
