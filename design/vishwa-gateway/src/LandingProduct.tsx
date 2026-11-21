import Anthropic from "@lobehub/icons/es/Anthropic/components/Mono";
import DeepSeek from "@lobehub/icons/es/DeepSeek/components/Color";
import Gemini from "@lobehub/icons/es/Gemini/components/Color";
import Mistral from "@lobehub/icons/es/Mistral/components/Color";
import OpenAI from "@lobehub/icons/es/OpenAI/components/Mono";
import Qwen from "@lobehub/icons/es/Qwen/components/Color";
import { Activity, ArrowDownLeft, ArrowUpRight, Boxes, Check, Code2, Copy } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { Brand } from "./Brand";
import { MiniMaxMark, SeedanceMark, KimiMark } from "./NewProviderMarks";
import { modelPopularityRank } from "./model-order";
import "./landing-product.css";

const endpoint = "https://ai.gateway.vishwanetwork.xyz/v1";
const productModels = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    Icon: OpenAI,
    capability: "Text & vision",
    input: 958,
    output: 326,
    cost: "$0.004025",
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    Icon: Anthropic,
    capability: "Reasoning & code",
    input: 1590,
    output: 526,
    cost: "$0.009504",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    Icon: Gemini,
    capability: "Multimodal",
    input: 675,
    output: 187,
    cost: "$0.002719",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    Icon: DeepSeek,
    capability: "Text & code",
    input: 783,
    output: 194,
    cost: "$0.000586",
  },
  {
    id: "qwen3-coder",
    name: "Qwen3 Coder",
    provider: "Qwen",
    Icon: Qwen,
    capability: "Code",
    input: 1062,
    output: 302,
    cost: "$0.001000",
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    provider: "Mistral",
    Icon: Mistral,
    capability: "Text & reasoning",
    input: 422,
    output: 228,
    cost: "$0.000885",
  },
  {
    id: "MiniMax-M2.7",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    Icon: MiniMaxMark,
    capability: "Reasoning & code",
    input: 0,
    output: 0,
    cost: "—",
  },
  {
    id: "dreamina-seedance-2-0-260128",
    name: "Seedance 2.0",
    provider: "ByteDance Seed",
    Icon: SeedanceMark,
    capability: "Video & audio",
    input: 0,
    output: 0,
    cost: "—",
  },
  {
    id: "kimi-k3.1-pro",
    name: "Kimi K3.1 Pro",
    provider: "Kimi",
    Icon: KimiMark,
    capability: "Vision & reasoning",
    input: 0,
    output: 0,
    cost: "—",
  },
].sort((a, b) => modelPopularityRank(a.id) - modelPopularityRank(b.id));
const tabs = [
  { id: "models", label: "Model catalog", Icon: Boxes },
  { id: "integration", label: "API integration", Icon: Code2 },
  { id: "usage", label: "Usage", Icon: Activity },
] as const;
type Tab = (typeof tabs)[number]["id"];
type Language = "Python" | "TypeScript";
const formatNumber = new Intl.NumberFormat("en-US");
function requestLines(language: Language, modelId: string) {
  if (modelId === "dreamina-seedance-2-0-260128")
    return language === "Python"
      ? [
          "import os, requests",
          "",
          "# SEEDANCE_API_BASE includes /api/v3",
          "task = requests.post(",
          '    os.environ["SEEDANCE_API_BASE"] + "/contents/generations/tasks",',
          '    headers={"Authorization": "Bearer " + os.environ["SEEDANCE_API_KEY"]},',
          "    json={",
          '        "model": "' + modelId + '",',
          '        "content": [{"type": "text", "text": "A sunrise over a calm ocean."}],',
          '        "duration": 5, "resolution": "1080p", "ratio": "16:9",',
          '        "generate_audio": True,',
          "    },",
          ")",
          'print(task.json()["id"])',
        ]
      : [
          "// SEEDANCE_API_BASE includes /api/v3",
          "const response = await fetch(",
          '  process.env.SEEDANCE_API_BASE + "/contents/generations/tasks", {',
          '    method: "POST",',
          '    headers: { "Content-Type": "application/json",',
          '      Authorization: "Bearer " + process.env.SEEDANCE_API_KEY },',
          "    body: JSON.stringify({",
          '      model: "' + modelId + '",',
          '      content: [{ type: "text", text: "A sunrise over a calm ocean." }],',
          '      duration: 5, resolution: "1080p", ratio: "16:9", generate_audio: true,',
          "    }),",
          "  })",
          "console.log((await response.json()).id)",
        ];
  return language === "Python"
    ? [
        "import os",
        "from openai import OpenAI",
        "",
        "client = OpenAI(",
        '    api_key=os.environ["VISHWA_API_KEY"],',
        '    base_url="' + endpoint + '",',
        ")",
        "",
        "response = client.chat.completions.create(",
        '    model="' + modelId + '",',
        '    messages=[{"role": "user", "content": "Hello"}],',
        ")",
        "print(response.choices[0].message.content)",
      ]
    : [
        'import OpenAI from "openai"',
        "",
        "const client = new OpenAI({",
        "  apiKey: process.env.VISHWA_API_KEY,",
        '  baseURL: "' + endpoint + '",',
        "})",
        "",
        "const response = await client.chat.completions.create({",
        '  model: "' + modelId + '",',
        '  messages: [{ role: "user", content: "Hello" }],',
        "})",
        "",
        "console.log(response.choices[0].message.content)",
      ];
}

export function LandingProduct() {
  const id = useId();
  const [active, setActive] = useState<Tab>("models");
  const [modelIndex, setModelIndex] = useState(0);
  const [language, setLanguage] = useState<Language>("Python");
  const [copyState, setCopyState] = useState<{
    modelId: string;
    language: Language;
    label: "Copied" | "Copy unavailable";
  }>();
  const model = productModels[modelIndex];
  const isVideo = model.id === "dreamina-seedance-2-0-260128";
  const metered = model.input + model.output > 0;
  const lines = requestLines(language, model.id);
  const copyLabel =
    copyState?.modelId === model.id && copyState.language === language
      ? copyState.label
      : "Copy request";
  const inputShare = metered ? (model.input / (model.input + model.output)) * 100 : 0;
  function chooseModel(index: number) {
    setModelIndex(index);
    setCopyState(undefined);
  }
  function tabKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const directions: Record<string, number> = {
      ArrowRight: (index + 1) % tabs.length,
      ArrowLeft: (index + tabs.length - 1) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const next = directions[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(tabs[next].id);
    event.currentTarget.parentElement
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
      [next]?.focus();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopyState({ modelId: model.id, language, label: "Copied" });
    } catch {
      setCopyState({ modelId: model.id, language, label: "Copy unavailable" });
    }
  }
  return (
    <div className="lp-product">
      <div
        className="lp-product-tabs"
        role="tablist"
        aria-label="Explore the gateway"
        aria-orientation="horizontal"
      >
        {tabs.map(({ id: tab, label, Icon }, index) => (
          <button
            type="button"
            key={tab}
            id={id + "-tab-" + tab}
            role="tab"
            aria-selected={active === tab}
            aria-controls={id + "-panel-" + tab}
            tabIndex={active === tab ? 0 : -1}
            onClick={() => setActive(tab)}
            onKeyDown={(event) => tabKey(event, index)}
          >
            <Icon size={19} aria-hidden="true" />
            <span>{label}</span>
            <span className="lp-product-tab-line" />
          </button>
        ))}
      </div>
      <div className="lp-product-window">
        <div className="lp-product-chrome">
          <Brand />
          <div className="lp-product-window-tools" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
        <div className="lp-product-stages">
          <section
            className="lp-product-panel"
            id={id + "-panel-models"}
            role="tabpanel"
            aria-labelledby={id + "-tab-models"}
            hidden={active !== "models"}
            tabIndex={0}
          >
            <header className="lp-product-panel-heading">
              <h3>Model catalog</h3>
            </header>
            <div className="lp-product-model-table">
              <div className="lp-product-model-columns" aria-hidden="true">
                <span>Model</span>
                <span>Model ID</span>
                <span>Capability</span>
                <span />
              </div>
              <div
                role="group"
                tabIndex={0}
                aria-label="Choose the model used in the API request and usage breakdown"
              >
                {productModels.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className="lp-product-model"
                    aria-pressed={modelIndex === index}
                    onClick={() => chooseModel(index)}
                  >
                    <span className="lp-product-model-identity">
                      <span
                        className={
                          "lp-product-provider provider-" +
                          item.provider.toLowerCase().replaceAll(" ", "-")
                        }
                      >
                        <item.Icon size={24} aria-hidden="true" focusable="false" />
                      </span>
                      <span>
                        <strong>{item.name}</strong>
                        <small>{item.provider}</small>
                      </span>
                    </span>
                    <code>{item.id}</code>
                    <span className="lp-product-capability">{item.capability}</span>
                    <span className="lp-product-model-check" aria-hidden="true">
                      {modelIndex === index ? <Check size={16} /> : <ArrowUpRight size={16} />}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section
            className="lp-product-panel lp-product-integration"
            id={id + "-panel-integration"}
            role="tabpanel"
            aria-labelledby={id + "-tab-integration"}
            hidden={active !== "integration"}
            tabIndex={0}
          >
            <header className="lp-product-panel-heading">
              <h3>{isVideo ? "Video generation API" : "API integration"}</h3>
            </header>
            <div className="lp-product-code">
              <div className="lp-product-code-toolbar">
                <div className="lp-product-languages" role="group" aria-label="SDK language">
                  {(["Python", "TypeScript"] as Language[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      aria-pressed={language === item}
                      onClick={() => {
                        setLanguage(item);
                        setCopyState(undefined);
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <button type="button" className="lp-product-copy" onClick={copy} aria-live="polite">
                  {copyLabel === "Copied" ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copyLabel}</span>
                </button>
              </div>
              <pre tabIndex={0} aria-label={language + " API request"}>
                <code>
                  {lines.map((line, index) => (
                    <span className="lp-product-code-line" key={index}>
                      <span className="lp-product-code-number" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span>
                        {line
                          .split(/("[^"]*"|\b(?:from|import|const|new|await|print)\b)/g)
                          .map((token, tokenIndex) =>
                            tokenIndex % 2 === 0 ? (
                              token
                            ) : (
                              <span
                                key={tokenIndex}
                                className={
                                  token.startsWith('"')
                                    ? "lp-product-code-string"
                                    : "lp-product-code-keyword"
                                }
                              >
                                {token}
                              </span>
                            ),
                          )}
                      </span>
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </section>

          <section
            className="lp-product-panel lp-product-usage"
            id={id + "-panel-usage"}
            role="tabpanel"
            aria-labelledby={id + "-tab-usage"}
            hidden={active !== "usage"}
            tabIndex={0}
          >
            <header className="lp-product-panel-heading">
              <h3>{isVideo ? "Generation settings" : "Request breakdown"}</h3>
            </header>
            <div
              className="lp-product-usage-grid"
              tabIndex={0}
              aria-label="Request breakdown details"
            >
              <div className="lp-product-meter">
                <div className="lp-product-request-model">
                  <span className="lp-product-provider">
                    <model.Icon size={27} aria-hidden="true" focusable="false" />
                  </span>
                  <div>
                    <strong>{model.name}</strong>
                    <span>{model.provider}</span>
                  </div>
                  {metered && <span className="lp-product-request-count">1 request</span>}
                </div>
                <div className="lp-product-consumption">
                  <div>
                    <span>{isVideo ? "Video duration" : "Total tokens"}</span>
                    <strong>
                      {isVideo
                        ? "5s"
                        : metered
                          ? formatNumber.format(model.input + model.output)
                          : "—"}
                    </strong>
                  </div>
                </div>
                {metered && (
                  <>
                    <div
                      className="lp-product-token-bar"
                      aria-label={
                        "Input " +
                        Math.round(inputShare) +
                        "%, output " +
                        Math.round(100 - inputShare) +
                        "%"
                      }
                    >
                      <span style={{ flexGrow: model.input }} />
                      <span style={{ flexGrow: model.output }} />
                    </div>
                    <dl className="lp-product-token-legend">
                      <div>
                        <dt>
                          <i />
                          Input
                        </dt>
                        <dd>{Math.round(inputShare)}%</dd>
                      </div>
                      <div>
                        <dt>
                          <i />
                          Output
                        </dt>
                        <dd>{Math.round(100 - inputShare)}%</dd>
                      </div>
                    </dl>
                  </>
                )}
              </div>
              <div className="lp-product-receipt">
                <dl>
                  <div>
                    <dt>
                      <ArrowUpRight size={17} />
                      {isVideo ? "Resolution" : "Input tokens"}
                    </dt>
                    <dd>
                      {isVideo ? "1080p · 16:9" : metered ? formatNumber.format(model.input) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <ArrowDownLeft size={17} />
                      {isVideo ? "Output" : "Output tokens"}
                    </dt>
                    <dd>
                      {isVideo
                        ? "Video + audio"
                        : metered
                          ? formatNumber.format(model.output)
                          : "—"}
                    </dd>
                  </div>
                  <div className="lp-product-request-cost">
                    <dt>{metered ? "Request cost" : "Pricing pending"}</dt>
                    <dd>{model.cost}</dd>
                  </div>
                </dl>
                <div className="lp-product-receipt-base">
                  <span>Model ID</span>
                  <code>{model.id}</code>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
