import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowRight, Check, ChevronDown, Copy as CopyIcon, KeyRound, Plus, X } from "lucide-react";
import {
  currentCustomer,
  createApiKey,
  updateApiKey,
  useCommerce,
  money,
  statusLabel,
  type ApiKey,
  type Usage,
} from "./commerce";
import { TimeRangeSelect, timeRangeStart, type TimeRange } from "./TimeRange";
import "./customer-journey.css";

export const count = (value: number) => new Intl.NumberFormat("en-US").format(value);
export const date = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const ownUsage = (data: ReturnType<typeof useCommerce>) =>
  data.usage.filter((r) => r.userId === data.currentUserId);
export function rangeUsage(rows: Usage[], range: TimeRange) {
  const end = Date.now();
  return rows.filter(
    (r) => Date.parse(r.at) >= timeRangeStart(range, end) && Date.parse(r.at) <= end,
  );
}
export function Title({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <header className="cw-title">
      <h1>{title}</h1>
      {action}
    </header>
  );
}
export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="cj-empty">
      <h3>{title}</h3>
      {children}
    </div>
  );
}
export function Badge({ status }: { status: string }) {
  return (
    <span
      className="cw-badge"
      data-tone={
        ["success", "credited", "active"].includes(status)
          ? "success"
          : ["failed", "needs_review", "refund_requested"].includes(status)
            ? "warning"
            : undefined
      }
    >
      {statusLabel(status)}
    </span>
  );
}
export function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
    return () => ref.current?.close();
  }, []);
  return (
    <dialog
      className="cw-dialog cj-dialog"
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <header>
        <h2>{title}</h2>
        <button
          type="button"
          className="cw-icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>
      {children}
    </dialog>
  );
}
export function Copy({ value, label = "Copy" }: { value: string; label?: string }) {
  const [message, setMessage] = useState("");
  return (
    <span className="cw-copy">
      <button
        type="button"
        className="cw-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setMessage("Copied");
          } catch {
            setMessage("Select the text and copy it manually.");
          }
        }}
      >
        <CopyIcon size={15} />
        {label}
      </button>
      <span role="status">{message}</span>
    </span>
  );
}
export function LowBalance({ onAddCredit }: { onAddCredit: () => void }) {
  const data = useCommerce();
  const customer = currentCustomer(data);
  return customer.balanceMicros < data.settings.lowBalanceCents * 10000 ? (
    <div className="cj-notice">
      <div>
        <strong>
          {customer.balanceMicros === 0
            ? "Your workspace is ready for credit"
            : "Balance is running low"}
        </strong>
        <p>
          {money(customer.balanceMicros / 1e6)} available · Alert below{" "}
          {money(data.settings.lowBalanceCents / 100)}
        </p>
      </div>
      <button className="cw-button" onClick={onAddCredit}>
        Add credit <Plus size={15} />
      </button>
    </div>
  ) : null;
}

function KeyForm({
  item,
  onSave,
  onCancel,
}: {
  item: ApiKey | null;
  onSave: (value: Pick<ApiKey, "name" | "budgetCents" | "expires" | "models">) => void;
  onCancel: () => void;
}) {
  const data = useCommerce();
  const [error, setError] = useState("");
  return (
    <form
      className="cw-form"
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const name = String(f.get("name") ?? "").trim();
        const raw = String(f.get("budget") ?? "");
        const budget = raw ? Math.round(Number(raw) * 100) : null;
        const expires = String(f.get("expires") ?? "");
        if (!name) return setError("Enter a key name.");
        if (budget !== null && (!Number.isSafeInteger(budget) || budget < 1))
          return setError("Enter a valid budget.");
        if (expires && new Date(expires + "T23:59:59Z").getTime() < Date.now())
          return setError("Choose a future expiration date.");
        onSave({
          name,
          budgetCents: budget,
          expires,
          models: f.getAll("models").map(String),
        });
      }}
    >
      <label>
        Name
        <input
          name="name"
          required
          maxLength={64}
          defaultValue={item?.name}
          placeholder="Production app"
          autoFocus
        />
      </label>
      <div className="cw-fields">
        <label>
          Monthly limit · USD
          <input
            name="budget"
            type="number"
            min=".01"
            step=".01"
            max="1000000"
            defaultValue={item?.budgetCents === null || !item ? "" : item.budgetCents / 100}
            placeholder="No limit"
          />
        </label>
        <label>
          Expires on
          <input
            type="date"
            name="expires"
            min={new Date().toISOString().slice(0, 10)}
            defaultValue={item?.expires}
          />
        </label>
      </div>
      <fieldset>
        <legend>Allowed models</legend>
        <p>Leave unchecked to allow all models.</p>
        <div className="cw-check-grid">
          {data.pricing.map((m) => (
            <label className="cw-checkbox" key={m.id}>
              <input
                type="checkbox"
                name="models"
                value={m.id}
                defaultChecked={item?.models.includes(m.id)}
              />
              {m.name}
            </label>
          ))}
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="cw-feedback">
          {error}
        </p>
      )}
      <div className="cw-form-actions">
        <button className="cw-button cw-primary" type="submit">
          {item ? "Save changes" : "Create key"}
        </button>
        <button className="cw-button" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
export function CustomerKeys() {
  const data = useCommerce();
  const keys = data.keys.filter((k) => k.userId === data.currentUserId);
  const [editor, setEditor] = useState<ApiKey | "new" | null>(null);
  const [secret, setSecret] = useState("");
  const [revoke, setRevoke] = useState<ApiKey | null>(null);
  const [message, setMessage] = useState("");
  const [model, setModel] = useState(data.pricing[0].id);
  const snippet = `from openai import OpenAI\nimport os\n\nclient = OpenAI(\n    base_url="https://ai.gateway.vishwanetwork.xyz/v1",\n    api_key=os.environ["VISHWA_API_KEY"],\n)\n\nresponse = client.chat.completions.create(\n    model="${model}",\n    messages=[{"role": "user", "content": "Hello"}],\n)\nprint(response.choices[0].message.content)`;
  return (
    <>
      <Title
        title="API Keys"
        action={
          <button className="cw-button cw-primary" onClick={() => setEditor("new")}>
            <Plus size={16} />
            Create key
          </button>
        }
      />
      {message && (
        <p className="cw-feedback" role="status">
          {message}
        </p>
      )}
      <section className="cw-panel">
        <div className="cw-panel-title">
          <h2>Your keys</h2>
        </div>
        {keys.length ? (
          <div className="cw-key-list">
            {keys.map((k) => (
              <article className="cw-key-row" key={k.id}>
                <div className="cw-key-main">
                  <span className="cw-row-icon">
                    <KeyRound size={18} />
                  </span>
                  <div>
                    <h3>{k.name}</h3>
                    <p className="cj-mono">{k.prefix}••••••••</p>
                    <p>
                      {k.budgetCents === null
                        ? "No monthly limit"
                        : money(k.budgetCents / 100) + " monthly limit"}{" "}
                      · {k.expires ? "Expires " + k.expires : "No expiry"}
                    </p>
                    <p>
                      {k.models.length ? `${k.models.length} allowed models` : "All models"} ·{" "}
                      {k.lastUsed ? "Last used " + date(k.lastUsed) : "Not used yet"}
                    </p>
                  </div>
                </div>
                <Badge
                  status={
                    !k.enabled
                      ? "revoked"
                      : k.expires && new Date(k.expires + "T23:59:59Z").getTime() < Date.now()
                        ? "expired"
                        : "active"
                  }
                />
                <div className="cw-key-actions">
                  <button className="cw-button" disabled={!k.enabled} onClick={() => setEditor(k)}>
                    Edit
                  </button>
                  <button className="cw-button" disabled={!k.enabled} onClick={() => setRevoke(k)}>
                    Revoke
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <Empty title="Create your first API key">
            <p>Control model access and spending for each app.</p>
            <button className="cw-button" onClick={() => setEditor("new")}>
              Create key <ArrowRight size={15} />
            </button>
          </Empty>
        )}
      </section>
      <section className="cw-panel cw-form">
        <div className="cj-panel-head">
          <h2>Make your first request</h2>
          <a className="cw-button" href="#/console/playground">
            Open Playground <ArrowRight size={15} />
          </a>
        </div>
        <label>
          Model
          <select value={model} onChange={(e) => setModel(e.target.value)}>
            {data.pricing.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <pre className="cj-code">{snippet}</pre>
        <Copy value={snippet} label="Copy Python" />
        <p className="cw-note">Use a production API key when the inference service is connected.</p>
      </section>
      {editor && (
        <Modal
          title={editor === "new" ? "Create API key" : "Edit API key"}
          onClose={() => setEditor(null)}
        >
          <KeyForm
            item={editor === "new" ? null : editor}
            onCancel={() => setEditor(null)}
            onSave={(value) => {
              if (editor === "new") {
                const result = createApiKey(value);
                setSecret(result.secret);
              } else {
                updateApiKey(editor.id, value);
                setMessage("Key settings updated.");
              }
              setEditor(null);
            }}
          />
        </Modal>
      )}
      {secret && (
        <Modal title="Save your API key" onClose={() => setSecret("")}>
          <p>Copy this key now. It will not be shown again.</p>
          <textarea
            className="cw-json cj-secret"
            aria-label="New API key"
            readOnly
            value={secret}
          />
          <Copy value={secret} label="Copy key" />
          <div className="cj-notice cj-notice-compact">
            This local design key works only in the walkthrough. It cannot authenticate live API
            requests.
          </div>
          <button className="cw-button cw-primary" onClick={() => setSecret("")}>
            I have saved my key
          </button>
        </Modal>
      )}
      {revoke && (
        <Modal title="Revoke API key?" onClose={() => setRevoke(null)}>
          <p>
            Requests using <strong>{revoke.name}</strong> will be blocked. This cannot be undone.
          </p>
          <div className="cw-form-actions">
            <button
              className="cw-button cw-primary"
              onClick={() => {
                updateApiKey(revoke.id, { enabled: false });
                setMessage("Key revoked.");
                setRevoke(null);
              }}
            >
              Revoke key
            </button>
            <button className="cw-button" onClick={() => setRevoke(null)}>
              Keep key
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

function tokenTimeline(rows: Usage[], range: TimeRange) {
  const end = new Date();
  const daily = range === "7D" || range === "30D";
  const start =
    range === "All"
      ? new Date(Math.min(Date.now(), ...rows.map((r) => Date.parse(r.at))))
      : new Date(timeRangeStart(range, Date.now()));
  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), daily ? start.getUTCDate() : 1),
  );
  const buckets: { day: string; label: string; tokens: number }[] = [];
  while (cursor <= end && buckets.length < 120) {
    const day = cursor.toISOString().slice(0, daily ? 10 : 7);
    buckets.push({
      day,
      label: cursor.toLocaleDateString(
        "en-US",
        daily
          ? { month: "short", day: "numeric", timeZone: "UTC" }
          : { month: "short", year: "2-digit", timeZone: "UTC" },
      ),
      tokens: rows
        .filter((r) => r.at.slice(0, daily ? 10 : 7) === day)
        .reduce((sum, r) => sum + r.input + r.output, 0),
    });
    if (daily) cursor.setUTCDate(cursor.getUTCDate() + 1);
    else cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return buckets;
}

export function CustomerOverview({
  onAddCredit,
  onModels,
}: {
  credit: number;
  onAddCredit: () => void;
  onModels: () => void;
}) {
  const data = useCommerce();
  const user = currentCustomer(data);
  const usage = ownUsage(data);
  const [period, setPeriod] = useState<TimeRange>("30D");
  const [tokensRange, setTokensRange] = useState<TimeRange>("30D");
  const [requestsRange, setRequestsRange] = useState<TimeRange>("30D");
  const [expanded, setExpanded] = useState(false);
  const hasCredit = data.orders.some((o) => o.userId === user.id && o.creditedAt);
  const hasKey = data.keys.some((k) => k.userId === user.id && k.enabled);
  const hasRequest = usage.some((r) => r.status === "success");
  const rows = rangeUsage(usage, period);
  const total = rows.reduce((s, r) => s + r.input + r.output, 0);
  const models = data.pricing
    .map((m) => ({
      ...m,
      tokens: rows.filter((r) => r.modelId === m.id).reduce((s, r) => s + r.input + r.output, 0),
    }))
    .sort((a, b) => b.tokens - a.tokens);
  const pending = data.orders.filter(
    (o) =>
      o.userId === user.id && ["awaiting_payment", "confirming", "needs_review"].includes(o.status),
  );
  const days = tokenTimeline(rows, period);
  const max = Math.max(1, ...days.map((d) => d.tokens));
  return (
    <>
      <Title title="Overview" />
      <LowBalance onAddCredit={onAddCredit} />
      {!hasRequest && (
        <section className="cw-panel cj-onboarding">
          <div className="cj-panel-head">
            <h2>Start building</h2>
            <span>{[hasCredit, hasKey, hasRequest].filter(Boolean).length} of 3 complete</span>
          </div>
          <div className="cj-steps">
            {[
              { name: "Add credit", done: hasCredit, click: onAddCredit },
              {
                name: "Create an API key",
                done: hasKey,
                href: "#/console/keys",
              },
              {
                name: "Send your first request",
                done: hasRequest,
                href: "#/console/playground",
              },
            ].map((s, i) => (
              <button
                key={s.name}
                onClick={() => (s.click ? s.click() : (location.hash = s.href!))}
                aria-label={s.name}
              >
                <span className="cj-step-number" data-done={s.done}>
                  {s.done ? <Check size={17} /> : i + 1}
                </span>
                <strong>{s.name}</strong>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </section>
      )}
      {pending.length > 0 && (
        <a className="cj-notice" href="#/console/billing">
          <span>
            {pending.length} payment{pending.length > 1 ? "s" : ""} awaiting confirmation
          </span>
          <span>
            View billing <ArrowRight size={15} />
          </span>
        </a>
      )}
      <div className="gn-console-summary">
        <article className="gn-console-stat">
          <span>Available credit</span>
          <strong>{money(user.balanceMicros / 1e6)}</strong>
          <button className="cw-button" onClick={onAddCredit}>
            <Plus size={15} />
            Add credit
          </button>
        </article>
        <article className="gn-console-stat">
          <span>Tokens processed</span>
          <strong>
            {count(rangeUsage(usage, tokensRange).reduce((s, r) => s + r.input + r.output, 0))}
          </strong>
          <TimeRangeSelect
            value={tokensRange}
            onChange={setTokensRange}
            label="Tokens processed time range"
          />
        </article>
        <article className="gn-console-stat">
          <span>API requests</span>
          <strong>{count(rangeUsage(usage, requestsRange).length)}</strong>
          <TimeRangeSelect
            value={requestsRange}
            onChange={setRequestsRange}
            label="API requests time range"
          />
        </article>
      </div>
      <div className="cw-split">
        <section className="cw-panel">
          <div className="cj-panel-head">
            <h2>Token usage</h2>
            <TimeRangeSelect value={period} onChange={setPeriod} label="Token usage time range" />
          </div>
          {rows.length ? (
            <>
              <div className="cj-chart" role="img" aria-label={"Tokens for " + period}>
                {days.map((d, i) => (
                  <div
                    key={d.day}
                    data-label={i % Math.max(1, Math.ceil(days.length / 6)) === 0}
                    title={d.label + ": " + count(d.tokens) + " tokens"}
                  >
                    <i
                      style={{
                        height: Math.max(2, (d.tokens / max) * 150) + "px",
                      }}
                    />
                    <span>{d.label}</span>
                  </div>
                ))}
              </div>
              <div className="cj-metrics">
                <span>
                  Input <strong>{count(rows.reduce((s, r) => s + r.input, 0))}</strong>
                </span>
                <span>
                  Output <strong>{count(rows.reduce((s, r) => s + r.output, 0))}</strong>
                </span>
                <span>
                  Spend{" "}
                  <strong>{money(rows.reduce((s, r) => s + r.costMicros, 0) / 1e6, 6)}</strong>
                </span>
              </div>
            </>
          ) : (
            <Empty title="Your usage starts here">
              <p>Complete a request to see tokens and spend.</p>
              <a className="cw-button" href="#/console/playground">
                Open Playground <ArrowRight size={15} />
              </a>
            </Empty>
          )}
        </section>
        <section className="cw-panel">
          <div className="cj-panel-head">
            <h2>Usage by model</h2>
            <button className="cw-link" onClick={onModels}>
              Model Market
            </button>
          </div>
          <ul id="customer-model-usage" className="gn-console-model-list">
            {(expanded ? models : models.slice(0, 4)).map((m) => (
              <li key={m.id}>
                <div className="gn-console-model-label">
                  <span>
                    <b>{m.name}</b>
                  </span>
                  <strong>{count(m.tokens)}</strong>
                </div>
                <div className="gn-console-model-track">
                  <span
                    style={{
                      width: (total ? (m.tokens / total) * 100 : 0) + "%",
                      background: "var(--vg-accent)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          {models.length > 4 && (
            <button
              className="cw-button gn-console-expand-models cj-model-more"
              type="button"
              aria-controls="customer-model-usage"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Show less" : "View all " + models.length + " models"}
              <ChevronDown size={16} />
            </button>
          )}
        </section>
      </div>
      <section className="cw-panel">
        <div className="cj-panel-head">
          <h2>Recent activity</h2>
          <a className="cw-link" href="#/console/activity">
            View all
          </a>
        </div>
        {usage.length ? (
          <div className="cj-recent">
            {usage.slice(0, 4).map((r) => (
              <a key={r.id} href="#/console/activity">
                <div>
                  <strong>{data.pricing.find((m) => m.id === r.modelId)?.name ?? r.modelId}</strong>
                  <p>{date(r.at)}</p>
                </div>
                <span>{count(r.input + r.output)} tokens</span>
                <strong>{money(r.costMicros / 1e6, 6)}</strong>
                <Badge status={r.status} />
              </a>
            ))}
          </div>
        ) : (
          <Empty title="No requests yet">
            <p>Your first request will appear here.</p>
          </Empty>
        )}
      </section>
    </>
  );
}
