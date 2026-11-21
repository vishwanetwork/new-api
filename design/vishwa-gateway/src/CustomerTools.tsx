import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, ArrowRight, Code2, Play, Search, Square } from "lucide-react";
import {
  currentCustomer,
  downloadCsv,
  money,
  runLocalRequest,
  useCommerce,
  type Usage,
} from "./commerce";
import {
  Badge,
  Copy,
  date,
  Empty,
  Modal,
  ownUsage,
  rangeUsage,
  Title,
  count,
} from "./CustomerJourney";
import { TimeRangeSelect, type TimeRange } from "./TimeRange";
import "./tools-refinements.css";

export function CustomerPlayground({
  onModels,
  onAddCredit,
}: {
  onModels: () => void;
  onAddCredit?: () => void;
}) {
  const data = useCommerce();
  const user = currentCustomer(data);
  const chatModels = data.pricing.filter(
    (m) => m.modality !== "video" && m.ratesConfigured !== false,
  );
  const keys = data.keys.filter((k) => k.userId === user.id && k.enabled);
  const [key, setKey] = useState(keys[0]?.id ?? "");
  const [model, setModel] = useState(() => {
    const requested = new URLSearchParams(location.hash.split("?")[1]).get("model");
    return chatModels.find((m) => m.id === requested)?.id ?? chatModels[0]?.id ?? "";
  });
  const [prompt, setPrompt] = useState("");
  const [limit, setLimit] = useState("512");
  const [state, setState] = useState<"idle" | "running" | "complete" | "error" | "cancelled">(
    "idle",
  );
  const [result, setResult] = useState<{ text: string; usage: Usage } | null>(null);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  const maxOutput = Math.max(1, Math.min(16384, Math.trunc(Number(limit) || 512)));
  const request = JSON.stringify(
    {
      model,
      messages: [{ role: "user", content: prompt }],
      max_tokens: maxOutput,
    },
    null,
    2,
  );
  function run() {
    setError("");
    setResult(null);
    setState("running");
    timer.current = setTimeout(() => {
      try {
        setResult(runLocalRequest(model, key, prompt, maxOutput));
        setState("complete");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Request could not be completed.");
        setState("error");
      }
      timer.current = null;
    }, 850);
  }
  function stop() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setState("cancelled");
  }
  return (
    <>
      <Title
        title="Playground"
        action={
          <button className="cw-button" onClick={onModels}>
            Explore models <ArrowRight size={15} />
          </button>
        }
      />
      <div className="cj-notice">
        <div>
          <strong>Inference service offline</strong>
          <p>Run a local walkthrough to explore responses, usage and credit deduction.</p>
        </div>
        <span className="cw-badge">Local workspace</span>
      </div>
      <div className="cw-split cw-playground">
        <section className="cw-panel cw-form">
          <div className="cw-panel-title">
            <h2>Request</h2>
            <p>POST /v1/chat/completions</p>
          </div>
          <label>
            API key
            <select
              value={key}
              onChange={(e) => setKey(e.target.value)}
              disabled={state === "running"}
            >
              <option value="">Choose an API key</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.name} · {k.prefix}••••
                </option>
              ))}
            </select>
          </label>
          {!keys.length && (
            <a className="cw-link" href="#/console/keys">
              Create your first API key <ArrowRight size={14} />
            </a>
          )}
          <label>
            Model
            <select
              value={model}
              disabled={state === "running"}
              onChange={(e) => setModel(e.target.value)}
            >
              {chatModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                  {m.status === "paused" ? " · Unavailable" : ""}
                </option>
              ))}
            </select>
          </label>
          <label className="cw-prompt-field">
            Prompt
            <textarea
              rows={6}
              maxLength={8000}
              value={prompt}
              disabled={state === "running"}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Explain how a unified model API works."
            />
          </label>
          <label>
            Maximum output tokens
            <input
              type="number"
              min="1"
              max="16384"
              value={limit}
              disabled={state === "running"}
              onChange={(e) => setLimit(e.target.value)}
            />
          </label>
          <div className="cw-form-actions">
            {state === "running" ? (
              <button className="cw-button" onClick={stop}>
                <Square size={15} />
                Stop
              </button>
            ) : (
              <button className="cw-button cw-primary" onClick={run}>
                <Play size={15} />
                {state === "error" ? "Retry walkthrough" : "Run walkthrough"}
              </button>
            )}
            <span className="cw-note">{money(user.balanceMicros / 1e6)} available</span>
          </div>
        </section>
        <section className="cw-panel cw-request-output">
          <div className="cw-panel-title">
            <h2>
              <Code2 size={18} />
              Request JSON
            </h2>
            <p>Use a production key for live API requests.</p>
          </div>
          <textarea
            className="cw-json"
            aria-label="Request JSON"
            value={request}
            readOnly
            rows={12}
          />
          <Copy value={request} label="Copy JSON" />
        </section>
      </div>
      <section className="cw-panel" aria-live="polite">
        <div className="cj-panel-head">
          <h2>Response</h2>
          {state === "running" && <span className="cj-running">Preparing request…</span>}
          {result && <Badge status="success" />}
        </div>
        {state === "idle" && (
          <Empty title="Ready when you are">
            <p>Your response and usage will appear here.</p>
          </Empty>
        )}
        {state === "running" && (
          <div className="cj-response-loading">
            <i />
            <i />
            <i />
          </div>
        )}
        {state === "cancelled" && (
          <Empty title="Request stopped">
            <p>No tokens or credit were deducted.</p>
            <button className="cw-button" onClick={run}>
              Run again
            </button>
          </Empty>
        )}
        {state === "error" && (
          <div className="cj-error" role="alert">
            <h3>Request not completed</h3>
            <p>{error}</p>
            <div className="cw-form-actions">
              <button className="cw-button" onClick={run}>
                Retry
              </button>
              {error.toLowerCase().includes("credit") && (
                <button
                  className="cw-button cw-primary"
                  onClick={
                    onAddCredit ??
                    (() => {
                      location.hash = "/console/billing";
                    })
                  }
                >
                  Add credit
                </button>
              )}
              {/key|budget/i.test(error) && (
                <a className="cw-button" href="#/console/keys">
                  Manage API keys
                </a>
              )}
            </div>
          </div>
        )}
        {result && (
          <>
            <p className="cj-output">{result.text}</p>
            <div className="cj-metrics">
              <span>
                Input<strong>{count(result.usage.input)}</strong>
              </span>
              <span>
                Output<strong>{count(result.usage.output)}</strong>
              </span>
              <span>
                Cost<strong>{money(result.usage.costMicros / 1e6, 6)}</strong>
              </span>
            </div>
            <div className="cj-panel-head">
              <Copy value={result.text} label="Copy response" />
              <a className="cw-link" href="#/console/activity">
                View request details <ArrowRight size={15} />
              </a>
            </div>
          </>
        )}
      </section>
    </>
  );
}

export function CustomerActivity({ tab }: { tab: string }) {
  const data = useCommerce();
  const user = currentCustomer(data);
  const all = ownUsage(data);
  const current = tab === "audit" || tab === "tasks" ? tab : "usage";
  const [period, setPeriod] = useState<TimeRange>("30D");
  const [query, setQuery] = useState("");
  const [model, setModel] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<Usage | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const rows = rangeUsage(all, period).filter(
    (r) =>
      (model === "all" || r.modelId === model) &&
      (status === "all" || r.status === status) &&
      (!query.trim() ||
        [r.id, r.modelId, data.pricing.find((m) => m.id === r.modelId)?.name, r.error ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query.trim().toLowerCase())),
  );
  useEffect(() => setPage(1), [period, query, model, status]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const ownIds = new Set([
    user.id,
    ...data.keys.filter((k) => k.userId === user.id).map((k) => k.id),
    ...data.orders.filter((o) => o.userId === user.id).map((o) => o.id),
    ...all.map((r) => r.id),
  ]);
  const audits = data.audit.filter((e) => ownIds.has(e.target));
  const name = (id: string) => data.pricing.find((m) => m.id === id)?.name ?? id;
  return (
    <>
      <Title
        title="Activity"
        action={
          current === "usage" ? (
            <button
              className="cw-button"
              disabled={!rows.length}
              onClick={() =>
                downloadCsv("vishwa-usage.csv", [
                  [
                    "Request ID",
                    "Time",
                    "Model",
                    "Input tokens",
                    "Output tokens",
                    "Input USD / 1M",
                    "Output USD / 1M",
                    "Cost USD",
                    "Status",
                  ],
                  ...rows.map((r) => [
                    r.id,
                    r.at,
                    r.modelId,
                    r.input,
                    r.output,
                    r.inputRate,
                    r.outputRate,
                    (r.costMicros / 1e6).toFixed(6),
                    r.status,
                  ]),
                ])
              }
            >
              <ArrowDownToLine size={16} />
              Export CSV
            </button>
          ) : undefined
        }
      />
      <nav className="cw-tabs" aria-label="Activity views">
        {[
          ["usage", "Usage logs"],
          ["audit", "Audit logs"],
          ["tasks", "Task logs"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={"#/console/activity" + (id === "usage" ? "" : "/" + id)}
            aria-current={current === id ? "page" : undefined}
          >
            {label}
          </a>
        ))}
      </nav>
      {current === "usage" ? (
        <section className="cw-panel cw-log-panel">
          <div className="cw-panel-title">
            <h2>Requests</h2>
          </div>
          <div className="cw-filters">
            <label className="cw-search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search requests"
                placeholder="Search model or request ID"
              />
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              aria-label="Filter by model"
            >
              <option value="all">All models</option>
              {data.pricing.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <TimeRangeSelect value={period} onChange={setPeriod} label="Filter by date range" />
          </div>
          {rows.length ? (
            <>
              <div className="cw-table-scroll">
                <table>
                  <thead>
                    <tr>
                      {["Time", "Model", "Input", "Output", "Cost", "Status", ""].map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice((page - 1) * pageSize, page * pageSize).map((r) => (
                      <tr key={r.id}>
                        <td>{date(r.at)}</td>
                        <td>
                          <strong>{name(r.modelId)}</strong>
                        </td>
                        <td>{count(r.input)}</td>
                        <td>{count(r.output)}</td>
                        <td>{money(r.costMicros / 1e6, 6)}</td>
                        <td>
                          <Badge status={r.status} />
                        </td>
                        <td>
                          <button
                            className="cw-link"
                            onClick={() => setSelected(r)}
                            aria-label={"Details for " + r.id}
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cj-pagination">
                <span>{rows.length} requests</span>
                <button
                  className="cw-button"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  {page} / {pages}
                </span>
                <button
                  className="cw-button"
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <Empty title={all.length ? "No matching requests" : "No requests yet"}>
              <p>
                {all.length
                  ? "Try another filter or date range."
                  : "Run your first walkthrough from the Playground."}
              </p>
              {all.length ? (
                <button
                  className="cw-button"
                  onClick={() => {
                    setQuery("");
                    setModel("all");
                    setStatus("all");
                    setPeriod("All");
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <a className="cw-button" href="#/console/playground">
                  Open Playground
                </a>
              )}
            </Empty>
          )}
        </section>
      ) : (
        <section className="cw-panel">
          {current === "audit" && audits.length ? (
            <div className="cj-recent">
              {audits.map((e) => (
                <article key={e.id}>
                  <div>
                    <strong>{e.action}</strong>
                    <p>{e.note}</p>
                  </div>
                  <span>{date(e.at)}</span>
                </article>
              ))}
            </div>
          ) : (
            <Empty title={current === "audit" ? "No account events yet" : "No task runs"}>
              <p>
                {current === "audit"
                  ? "Key and billing changes will appear here."
                  : "Background tasks require a connected task service."}
              </p>
            </Empty>
          )}
        </section>
      )}
      {selected && (
        <Modal title="Request details" onClose={() => setSelected(null)}>
          <Badge status={selected.status} />
          <dl>
            {[
              ["Request ID", selected.id],
              ["Model", name(selected.modelId)],
              ["API key", data.keys.find((k) => k.id === selected.keyId)?.name ?? selected.keyId],
              ["Time", date(selected.at)],
              ["Latency", selected.latency + " ms"],
              ["Endpoint", "POST /v1/chat/completions"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <h3>Cost breakdown</h3>
          <div className="cj-cost-line">
            <span>
              Input · {count(selected.input)} × {money(selected.inputRate)} / 1M
            </span>
            <strong>{money((selected.input * selected.inputRate) / 1e6, 6)}</strong>
          </div>
          <div className="cj-cost-line">
            <span>
              Output · {count(selected.output)} × {money(selected.outputRate)} / 1M
            </span>
            <strong>{money((selected.output * selected.outputRate) / 1e6, 6)}</strong>
          </div>
          <div className="cj-cost-line cj-cost-total">
            <span>Total deducted</span>
            <strong>{money(selected.costMicros / 1e6, 6)}</strong>
          </div>
          {selected.error && (
            <div role="alert" className="cj-error">
              <strong>Request failed</strong>
              <p>{selected.error}</p>
            </div>
          )}
          <div className="cw-form-actions">
            <Copy value={selected.id} label="Copy request ID" />
            <a
              className="cw-button"
              href={"#/console/playground?model=" + encodeURIComponent(selected.modelId)}
              onClick={() => setSelected(null)}
            >
              {selected.status === "success" ? "Use model" : "Retry in Playground"}
            </a>
          </div>
        </Modal>
      )}
    </>
  );
}
