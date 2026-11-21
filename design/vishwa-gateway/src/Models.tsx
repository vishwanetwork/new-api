import Anthropic from "@lobehub/icons/es/Anthropic/components/Mono";
import DeepSeek from "@lobehub/icons/es/DeepSeek/components/Color";
import Gemini from "@lobehub/icons/es/Gemini/components/Color";
import Mistral from "@lobehub/icons/es/Mistral/components/Color";
import OpenAI from "@lobehub/icons/es/OpenAI/components/Mono";
import Qwen from "@lobehub/icons/es/Qwen/components/Color";
import { SeedanceMark, MiniMaxMark, KimiMark } from "./NewProviderMarks";
import { modelPopularityRank, providerPopularityRank } from "./model-order";
import { Activity, ArrowUpRight, Braces, FileText, LayoutGrid, Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import "./models.css";
import { useCommerce, currentCustomer } from "./commerce";

export type Offer = {
  id: string;
  provider: string;
  name: string;
  price: number;
};

const providers = [
  { name: "OpenAI", Icon: OpenAI, color: "123, 245, 209" },
  { name: "Anthropic", Icon: Anthropic, color: "241, 164, 129" },
  { name: "Google", Icon: Gemini, color: "128, 174, 255" },
  { name: "DeepSeek", Icon: DeepSeek, color: "140, 146, 255" },
  { name: "Qwen", Icon: Qwen, color: "191, 141, 255" },
  { name: "Mistral", Icon: Mistral, color: "255, 178, 77" },
  { name: "ByteDance Seed", Icon: SeedanceMark, color: "142, 176, 248" },
  { name: "MiniMax", Icon: MiniMaxMark, color: "242, 128, 176" },
  { name: "Kimi", Icon: KimiMark, color: "138, 169, 255" },
] as const;

type Model = {
  id: string;
  name: string;
  provider: (typeof providers)[number];
  type: string;
  description: string;
  inputs: readonly string[];
  output?: string;
  modality?: "text" | "video";
  endpoints: readonly EndpointId[];
  documentation?: string;
};
const models: readonly Model[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: providers[0],
    type: "Multimodal",
    description: "A versatile model for text and image inputs.",
    inputs: ["Text", "Image"],
    endpoints: ["chat", "responses"],
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: providers[1],
    type: "Reasoning",
    description: "Detailed reasoning for code and long documents.",
    inputs: ["Text"],
    endpoints: ["messages", "chat"],
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: providers[2],
    type: "Multimodal",
    description: "Reason across long contexts, text, and images.",
    inputs: ["Text", "Image"],
    endpoints: ["generate", "chat"],
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: providers[3],
    type: "General",
    description: "General chat, writing, and code assistance.",
    inputs: ["Text"],
    endpoints: ["chat"],
  },
  {
    id: "qwen3-coder",
    name: "Qwen3 Coder",
    provider: providers[4],
    type: "Code",
    description: "Code generation, debugging, and editing.",
    inputs: ["Text"],
    endpoints: ["chat"],
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    provider: providers[5],
    type: "General",
    description: "Multilingual work and complex instructions.",
    inputs: ["Text"],
    endpoints: ["chat"],
  },
  {
    id: "dreamina-seedance-2-0-260128",
    name: "Seedance 2.0",
    provider: providers[6],
    type: "Video",
    description: "Generate video with synchronized audio from text and visual references.",
    inputs: ["Text", "Image", "Video", "Audio"],
    output: "Video with audio",
    modality: "video",
    endpoints: ["seedance"],
    documentation: "https://docs.byteplus.com/en/docs/ModelArk/seedance-2-0",
  },
  {
    id: "MiniMax-M2.7",
    name: "MiniMax M2.7",
    provider: providers[7],
    type: "Reasoning",
    description: "Text reasoning, coding, and tool-driven agent workflows.",
    inputs: ["Text"],
    output: "Text",
    modality: "text",
    endpoints: ["minimax"],
    documentation: "https://platform.minimax.io/docs/api-reference/text-chat-openai",
  },
  {
    id: "kimi-k3.1-pro",
    name: "Kimi K3.1 Pro",
    provider: providers[8],
    type: "Multimodal",
    description: "Visual reasoning, coding, and agent workflows across long contexts.",
    inputs: ["Text", "Image", "Video"],
    output: "Text",
    modality: "text",
    endpoints: ["kimi"],
    documentation: "https://platform.kimi.ai/docs/guide/kimi-k3-1-pro-quickstart",
  },
];

type Sort = "popular" | "name" | "price-desc" | "price-asc" | "output-desc" | "output-asc";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function Rates({ model }: { model: Model }) {
  const state = useCommerce();
  const rate = state.pricing.find((item) => item.id === model.id);
  if (!rate || rate.ratesConfigured === false)
    return (
      <div className="mx-rates-pending">
        <strong>Pricing pending</strong>
      </div>
    );
  return (
    <dl className="mx-rates" aria-label="Rates per 1M tokens" aria-describedby="mx-pricing-notice">
      <div>
        <dt>Input</dt>
        <dd>{money.format(rate.inputRate)}</dd>
      </div>
      <div>
        <dt>Output</dt>
        <dd>{money.format(rate.outputRate)}</dd>
      </div>
    </dl>
  );
}

type RequestField = { name: string; type: string; use: string };
type Endpoint = {
  label: string;
  path: string;
  fields: RequestField[];
  makeBody: (modelId: string) => object;
  upstream?: string;
  authVariable?: string;
  note?: string;
};

const modelField = { name: "model", type: "String", use: "Gateway model ID." };
const messagesField = {
  name: "messages",
  type: "Array",
  use: "Conversation turns with role and content.",
};
const prompt = "Summarize the purpose of an AI gateway in one sentence.";
const messages = [{ role: "user", content: prompt }];
const endpointCatalog = {
  chat: {
    label: "Chat completions",
    path: "/v1/chat/completions",
    fields: [modelField, messagesField],
    makeBody: (modelId) => ({ model: modelId, messages }),
  },
  responses: {
    label: "Responses",
    path: "/v1/responses",
    fields: [modelField, { name: "input", type: "String", use: "Prompt for the model." }],
    makeBody: (modelId) => ({ model: modelId, input: prompt }),
  },
  messages: {
    label: "Anthropic Messages",
    path: "/v1/messages",
    fields: [
      modelField,
      messagesField,
      {
        name: "max_tokens",
        type: "Integer",
        use: "Maximum output tokens for this request.",
      },
    ],
    makeBody: (modelId) => ({ model: modelId, max_tokens: 256, messages }),
  },
  generate: {
    label: "Gemini Generate Content",
    path: "/v1beta/models/{model}:generateContent",
    fields: [
      {
        name: "model",
        type: "Path segment",
        use: "Model ID in the endpoint path.",
      },
      {
        name: "contents",
        type: "Array",
        use: "Input turns containing parts, such as text.",
      },
    ],
    makeBody: () => ({ contents: [{ parts: [{ text: prompt }] }] }),
  },
  seedance: {
    label: "Video generation task",
    path: "/api/v3/contents/generations/tasks",
    upstream: "https://ark.ap-southeast.bytepluses.com",
    authVariable: "ARK_API_KEY",
    note: "Official BytePlus upstream API. Submit a task, then retrieve its status and generated video using the returned task ID. Gateway video routing is not configured.",
    fields: [
      { name: "model", type: "String", use: "BytePlus model ID." },
      {
        name: "content",
        type: "Array",
        use: "Text prompt and optional image_url, video_url, or audio_url reference items.",
      },
      {
        name: "content[].type",
        type: "String",
        use: "Content type: text, image_url, video_url, or audio_url.",
      },
      {
        name: "generate_audio",
        type: "Boolean",
        use: "Generate synchronized audio with the video.",
      },
      { name: "duration", type: "Integer", use: "Requested video duration in seconds." },
      { name: "ratio", type: "String", use: "Output aspect ratio, such as 16:9." },
    ],
    makeBody: (modelId) => ({
      model: modelId,
      content: [
        {
          type: "text",
          text: "A cinematic tracking shot of a sailboat at sunrise, with gentle ocean sounds.",
        },
      ],
      generate_audio: true,
      duration: 5,
      ratio: "16:9",
    }),
  },
  minimax: {
    label: "Chat completions",
    path: "/v1/chat/completions",
    upstream: "https://api.minimax.io",
    authVariable: "MINIMAX_API_KEY",
    note: "Official MiniMax upstream interface. Model access depends on the provider account; gateway routing and pricing are pending.",
    fields: [
      { name: "model", type: "String", use: "MiniMax model ID." },
      messagesField,
      { name: "stream", type: "Boolean", use: "Stream the response as server-sent events." },
      {
        name: "max_tokens",
        type: "Integer",
        use: "Maximum generated tokens, including reasoning where applicable.",
      },
    ],
    makeBody: (modelId) => ({
      model: modelId,
      messages: [
        { role: "user", content: "Write a TypeScript function that groups records by date." },
      ],
      stream: false,
      max_tokens: 1024,
    }),
  },
  kimi: {
    label: "Chat completions",
    path: "/v1/chat/completions",
    upstream: "https://api.moonshot.ai",
    authVariable: "MOONSHOT_API_KEY",
    note: "Official Kimi upstream interface. Gateway routing and pricing are pending.",
    fields: [
      { name: "model", type: "String", use: "Kimi model ID." },
      messagesField,
      { name: "max_tokens", type: "Integer", use: "Maximum output tokens, including reasoning." },
    ],
    makeBody: (modelId) => ({
      model: modelId,
      messages: [
        { role: "user", content: "Explain this architecture and identify potential bottlenecks." },
      ],
      max_tokens: 4096,
    }),
  },
} satisfies Record<string, Endpoint>;

type EndpointId = keyof typeof endpointCatalog;

function ModelApi({ model }: { model: Model }) {
  const [endpointId, setEndpointId] = useState<EndpointId>(model.endpoints[0]);
  const [format, setFormat] = useState<"json" | "curl">("json");
  const [copyStatus, setCopyStatus] = useState("");
  const endpoint: Endpoint = endpointCatalog[endpointId];
  const endpointPath = endpoint.path.replace("{model}", encodeURIComponent(model.id));
  const requestBody = JSON.stringify(endpoint.makeBody(model.id), null, 2);
  const example =
    format === "json"
      ? requestBody
      : [
          `curl -X POST "${endpoint.upstream ?? "$GATEWAY_URL"}${endpointPath}" \\`,
          "  -H 'Content-Type: application/json' \\",
          ...(endpoint.authVariable
            ? [`  -H "Authorization: Bearer $${endpoint.authVariable}" \\`]
            : []),
          `  --data '${requestBody}'`,
        ].join("\n");

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(example);
      setCopyStatus("Request copied.");
    } catch {
      setCopyStatus("Couldn’t copy. Select the request text to copy it.");
    }
  }

  return (
    <>
      <div className="mx-api-heading">
        <h3>Endpoints</h3>
        {model.endpoints.length > 1 && (
          <label className="mx-select-label">
            Interface
            <select
              className="mx-select"
              value={endpointId}
              onChange={(event) => {
                setEndpointId(event.target.value as EndpointId);
                setCopyStatus("");
              }}
            >
              {model.endpoints.map((id) => (
                <option key={id} value={id}>
                  {endpointCatalog[id].label}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="mx-endpoint">
        <strong>POST</strong>
        <code>{endpointPath}</code>
      </div>
      <p className="mx-detail-note">
        {endpoint.note ?? "Availability depends on your gateway configuration."}
      </p>
      {endpoint.upstream && (
        <p className="mx-detail-note">
          Upstream: <code>{endpoint.upstream}</code>
        </p>
      )}
      <div className="mx-api-block">
        <h3>Request parameters</h3>
        <table className="mx-api-fields">
          <thead>
            <tr>
              <th scope="col">Parameter</th>
              <th scope="col">Type</th>
              <th scope="col">Description</th>
            </tr>
          </thead>
          <tbody>
            {endpoint.fields.map((field) => (
              <tr key={field.name}>
                <th scope="row">{field.name}</th>
                <td>{field.type}</td>
                <td>{field.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mx-api-block">
        <div className="mx-api-heading">
          <h3>Request example</h3>
          <div className="mx-example-actions">
            <select
              className="mx-select"
              aria-label="Request example format"
              value={format}
              onChange={(event) => {
                setFormat(event.target.value === "curl" ? "curl" : "json");
                setCopyStatus("");
              }}
            >
              <option value="json">JSON</option>
              <option value="curl">cURL</option>
            </select>
            <button
              type="button"
              className="mx-details-action mx-copy-json"
              onClick={() => void copyRequest()}
            >
              {format === "json" ? "Copy JSON" : "Copy cURL"}
            </button>
          </div>
        </div>
        <pre className="mx-request-code">
          <code>{example}</code>
        </pre>
        {format === "curl" && (
          <p className="mx-detail-note">
            {endpoint.upstream
              ? "Set " +
                endpoint.authVariable +
                " to a valid provider API key. This request targets the provider directly."
              : "Set GATEWAY_URL and add your gateway’s authentication headers before sending."}
          </p>
        )}
        <p className="mx-detail-note" role="status">
          {copyStatus}
        </p>
      </div>
    </>
  );
}

const detailTabs = [
  { id: "overview", label: "Overview", Icon: FileText },
  { id: "performance", label: "Performance", Icon: Activity },
  { id: "api", label: "API", Icon: Braces },
] as const;

function ModelDetailsTabs({ model }: { model: Model }) {
  const state = useCommerce();
  const ratesPending =
    state.pricing.find((rate) => rate.id === model.id)?.ratesConfigured === false;
  const tabPrefix = useId();
  const tabList = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<(typeof detailTabs)[number]["id"]>("overview");

  function handleTabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % detailTabs.length;
    else if (event.key === "ArrowLeft") next = (index + detailTabs.length - 1) % detailTabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = detailTabs.length - 1;
    else return;
    event.preventDefault();
    setActive(detailTabs[next].id);
    tabList.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  return (
    <>
      <div className="mx-detail-tabs" role="tablist" aria-label="Model details" ref={tabList}>
        {detailTabs.map(({ id, label, Icon }, index) => (
          <button
            key={id}
            id={`${tabPrefix}-${id}-tab`}
            type="button"
            role="tab"
            aria-selected={active === id}
            aria-controls={`${tabPrefix}-${id}-panel`}
            tabIndex={active === id ? 0 : -1}
            onClick={() => setActive(id)}
            onKeyDown={(event) => handleTabKey(event, index)}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
      {detailTabs.map(({ id }) => (
        <div
          key={id}
          id={`${tabPrefix}-${id}-panel`}
          role="tabpanel"
          aria-labelledby={`${tabPrefix}-${id}-tab`}
          hidden={active !== id}
          tabIndex={active === id ? 0 : -1}
          className="mx-detail-panel"
        >
          {id === "overview" && (
            <div className="mx-detail-overview">
              <section>
                <h3>Model context</h3>
                <dl className="mx-detail-fields">
                  <div>
                    <dt>Model ID</dt>
                    <dd>{model.id}</dd>
                  </div>
                  <div>
                    <dt>Category</dt>
                    <dd>{model.type}</dd>
                  </div>
                  <div>
                    <dt>Catalog inputs</dt>
                    <dd>{model.inputs.join(", ")}</dd>
                  </div>
                  <div>
                    <dt>Catalog output</dt>
                    <dd>{model.output ?? "Text"}</dd>
                  </div>
                  <div>
                    <dt>API interfaces</dt>
                    <dd>
                      {model.endpoints
                        .map((endpoint) => endpointCatalog[endpoint].label)
                        .join(", ")}
                    </dd>
                  </div>
                </dl>
              </section>
              <section>
                <h3>
                  {model.modality === "video" ? "Video generation pricing" : "Rates per 1M tokens"}
                </h3>
                <Rates model={model} />
                <p className="mx-pricing-notice">
                  {model.modality === "video"
                    ? "Video output tokens measure generated audiovisual content, not language output. Duration, resolution, and reference inputs affect usage. Gateway rates are not configured."
                    : ratesPending
                      ? "Gateway input and output rates will appear here once configured."
                      : "Charged to your available credit after each request."}
                </p>
                {model.documentation && (
                  <a
                    className="mx-provider-docs"
                    href={model.documentation}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Provider documentation <ArrowUpRight size={14} />
                  </a>
                )}
              </section>
            </div>
          )}
          {id === "performance" && (
            <>
              <div className="mx-metrics-empty">
                <Activity size={22} aria-hidden="true" />
                <h3>No performance data available</h3>
                <p>There are no measurements for this model in the catalog.</p>
              </div>
              <dl className="mx-metrics">
                {["Average latency", "Throughput", "Success rate"].map((label) => (
                  <div key={label}>
                    <dt>{label}</dt>
                    <dd aria-label="Not available">—</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
          {id === "api" && <ModelApi model={model} />}
        </div>
      ))}
    </>
  );
}

export function Models({ onPurchase }: { onPurchase: (offer: Offer) => void }) {
  const searchInput = useRef<HTMLInputElement>(null);
  const detailsDialog = useRef<HTMLDialogElement>(null);
  const detailsTrigger = useRef<HTMLButtonElement>(null);
  const [details, setDetails] = useState<Model | null>(null);
  const [query, setQuery] = useState("");
  const [provider, setProvider] = useState("All providers");
  const state = useCommerce();
  const credit = currentCustomer(state).balanceMicros / 1_000_000;
  const [sort, setSort] = useState<Sort>("popular");
  useEffect(() => {
    const dialog = detailsDialog.current;
    if (details && dialog && !dialog.open) dialog.showModal();
  }, [details]);

  const searchTerm = query.trim().toLowerCase();
  const visibleModels = models
    .filter((model) => {
      const matchesProvider = provider === "All providers" || model.provider.name === provider;
      const searchable =
        `${model.name} ${model.id} ${model.provider.name} ${model.type}`.toLowerCase();
      return matchesProvider && searchable.includes(searchTerm);
    })
    .sort((left, right) => {
      const byName = left.name.localeCompare(right.name, "en");
      if (sort === "popular")
        return modelPopularityRank(left.id) - modelPopularityRank(right.id) || byName;
      if (sort === "name") return byName;
      const field = sort.startsWith("output") ? "outputRate" : "inputRate";
      const leftRate = state.pricing.find((m) => m.id === left.id),
        rightRate = state.pricing.find((m) => m.id === right.id);
      const leftUnknown = !leftRate || leftRate.ratesConfigured === false,
        rightUnknown = !rightRate || rightRate.ratesConfigured === false;
      if (leftUnknown !== rightUnknown) return leftUnknown ? 1 : -1;
      if (leftUnknown || rightUnknown) return byName;
      const difference = leftRate![field] - rightRate![field];
      return (sort.endsWith("desc") ? -difference : difference) || byName;
    });

  return (
    <main className="mx-page">
      <div className="mx-container">
        <header className="mx-market-header">
          <div className="mx-market-intro">
            <h1>Model Market</h1>
            <p>Explore language and video models across providers.</p>
          </div>
          <div className="mx-market-purchase">
            <span className="mx-control-label">Available credit</span>
            <strong className="mx-credit-amount">{money.format(credit)}</strong>
            <p id="mx-pricing-notice" className="mx-pricing-notice">
              One balance across models
            </p>
          </div>
        </header>

        <section className="mx-catalog" aria-label="Model catalog">
          <div className="mx-providers" role="group" aria-label="Filter by provider">
            <button
              type="button"
              aria-pressed={provider === "All providers"}
              onClick={() => setProvider("All providers")}
            >
              <LayoutGrid size={16} aria-hidden="true" /> All providers
            </button>
            {[...providers]
              .sort((a, b) => providerPopularityRank(a.name) - providerPopularityRank(b.name))
              .map(({ name, Icon, color }) => (
                <button
                  key={name}
                  type="button"
                  aria-pressed={provider === name}
                  onClick={() => setProvider(name)}
                  style={{ "--mx-model-rgb": color } as CSSProperties}
                >
                  <span className="mx-provider-icon">
                    <Icon size={17} aria-hidden="true" focusable="false" />
                  </span>
                  {name}
                </button>
              ))}
          </div>
          <div className="mx-controls">
            <div className="mx-search">
              <Search size={18} aria-hidden="true" />
              <input
                ref={searchInput}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search model, provider, or ID"
                aria-label="Search models"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    searchInput.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <X size={17} aria-hidden="true" />
                </button>
              )}
            </div>
            <div className="mx-order-controls">
              <p className="mx-result-count" role="status">
                {visibleModels.length} {visibleModels.length === 1 ? "model" : "models"}
              </p>
              <label className="mx-select-label">
                Sort
                <select
                  className="mx-select"
                  aria-label="Sort models"
                  value={sort}
                  onChange={(event) => setSort(event.target.value as Sort)}
                >
                  <option value="popular">Popular</option>
                  <option value="name">Name A–Z</option>
                  <option value="price-desc">Input price: high to low</option>
                  <option value="price-asc">Input price: low to high</option>
                  <option value="output-desc">Output price: high to low</option>
                  <option value="output-asc">Output price: low to high</option>
                </select>
              </label>
            </div>
          </div>
          {visibleModels.length > 0 ? (
            <div className="mx-grid">
              {visibleModels.map((model) => {
                const rate = state.pricing.find((item) => item.id === model.id);
                const ratesPending = !rate || rate.ratesConfigured === false;
                const available =
                  !ratesPending && rate?.status === "available" && model.modality !== "video";
                const { Icon } = model.provider;
                return (
                  <article
                    className="mx-card"
                    key={model.id}
                    style={
                      {
                        "--mx-model-rgb": model.provider.color,
                      } as CSSProperties
                    }
                  >
                    <div className="mx-card-top">
                      <div className="mx-provider-name">
                        <span className="mx-provider-mark">
                          <Icon size={22} aria-hidden="true" focusable="false" />
                        </span>
                        <span>{model.provider.name}</span>
                      </div>
                      <span className="mx-type">{model.type}</span>
                    </div>
                    <div className="mx-card-copy">
                      <h3>{model.name}</h3>
                      <p className="mx-model-id">{model.id}</p>
                      <p>{model.description}</p>
                    </div>
                    <div className="mx-card-rates">
                      <p>{model.modality === "video" ? "Video generation" : "Per 1M tokens"}</p>
                      <Rates model={model} />
                    </div>
                    <div className="mx-card-bottom">
                      <div className="mx-pack-total">
                        <span>
                          {available
                            ? "Pay as you go"
                            : ratesPending
                              ? "Gateway setup pending"
                              : "Temporarily unavailable"}
                        </span>
                        {available ? (
                          <a
                            className="mx-use-model"
                            href={"#/console/playground?model=" + encodeURIComponent(model.id)}
                          >
                            Use model <ArrowUpRight size={14} />
                          </a>
                        ) : (
                          <button
                            className="mx-use-model"
                            disabled
                            aria-label={"Use " + model.name + " unavailable"}
                          >
                            Use model <ArrowUpRight size={14} />
                          </button>
                        )}
                      </div>
                      <div className="mx-card-actions">
                        <button
                          type="button"
                          className="mx-details-action"
                          aria-label={`Details for ${model.name}`}
                          onClick={(event) => {
                            detailsTrigger.current = event.currentTarget;
                            setDetails(model);
                          }}
                        >
                          Details
                        </button>
                        <button
                          type="button"
                          className="mx-buy"
                          aria-label={`Add credit for ${model.name}`}
                          disabled={!available}
                          onClick={() =>
                            onPurchase({
                              id: model.id,
                              provider: model.provider.name,
                              name: model.name,
                              price: 25,
                            })
                          }
                        >
                          Add credit <ArrowUpRight size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mx-empty">
              <Search size={27} aria-hidden="true" />
              <h3>No matching models</h3>
              <p>Try a different search or provider.</p>
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setProvider("All providers");
                }}
              >
                Reset filters
              </button>
            </div>
          )}
        </section>
      </div>
      <dialog
        className="mx-detail-dialog"
        ref={detailsDialog}
        aria-labelledby="mx-detail-title"
        aria-describedby="mx-detail-description"
        onClose={() => {
          setDetails(null);
          detailsTrigger.current?.focus();
          detailsTrigger.current = null;
        }}
        onClick={(event) => {
          if (event.currentTarget === event.target) event.currentTarget.close();
        }}
      >
        {details && (
          <div className="mx-detail-content">
            <button
              type="button"
              className="mx-detail-close"
              aria-label="Close model details"
              autoFocus
              onClick={() => detailsDialog.current?.close()}
            >
              <X size={19} aria-hidden="true" />
            </button>
            <div className="mx-detail-provider">
              <details.provider.Icon size={22} aria-hidden="true" focusable="false" />
              {details.provider.name}
            </div>
            <h2 id="mx-detail-title">{details.name}</h2>
            <p id="mx-detail-description">{details.description}</p>
            <ModelDetailsTabs key={details.id} model={details} />
          </div>
        )}
      </dialog>
    </main>
  );
}
