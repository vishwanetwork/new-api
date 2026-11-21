import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  CreditCard,
  FileCheck2,
  Layers3,
  LayoutDashboard,
  LoaderCircle,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sun,
  TrendingUp,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Brand } from "./Brand";
import {
  useCommerce,
  money,
  statusLabel,
  reviewPayment,
  reconcileOrder,
  resolveRefund,
  updateCustomer,
  updatePricing,
  updateSettings,
  downloadCsv,
  type CommerceState,
  type PaymentOrder,
  type Customer,
  type Pricing,
  type StaffRole,
} from "./commerce";
import { TimeRangeSelect, timeRangeStart, type TimeRange } from "./TimeRange";
import "./admin.css";
type Section =
  | "overview"
  | "payments"
  | "reconciliation"
  | "users"
  | "growth"
  | "models"
  | "audit"
  | "settings";
const navigation = [
  ["overview", "Overview", LayoutDashboard],
  ["payments", "Payments", CreditCard],
  ["reconciliation", "Reconciliation", FileCheck2],
  ["users", "Customers", Users],
  ["growth", "Growth", TrendingUp],
  ["models", "Models & pricing", Layers3],
  ["audit", "Audit log", ShieldCheck],
  ["settings", "Settings", Settings],
] as const;
const pending = ["awaiting_payment", "confirming", "needs_review"],
  settled = ["credited", "refund_requested"];
const date = (v: string) =>
  new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const timestamp = (v: string) =>
  new Date(v).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
const num = (v: number) => new Intl.NumberFormat("en-US").format(v),
  cents = (v: number) => money(v / 100);
function inRange(value: string, range: TimeRange) {
  return Date.parse(value) >= timeRangeStart(range, Date.now()) && Date.parse(value) <= Date.now();
}
function sectionFromHash(): Section {
  const key = location.hash.split("/")[2] || "overview";
  return navigation.some(([id]) => id === key) ? (key as Section) : "overview";
}
const customerName = (data: CommerceState, id: string) =>
  data.users.find((u) => u.id === id)?.name ?? id;
function Status({ value }: { value: string }) {
  return (
    <span className={"ops-status ops-status-" + value}>
      <i />
      {statusLabel(value)}
    </span>
  );
}
function Empty({
  title = "No matching records",
  text = "Adjust your filters to see more results.",
}: {
  title?: string;
  text?: string;
}) {
  return (
    <div className="ops-empty">
      <Search size={24} />
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}
function Button({
  children,
  onClick,
  disabled = false,
  primary = false,
  type = "button",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  type?: "button" | "submit";
  title?: string;
}) {
  return (
    <button
      type={type}
      className={"ops-button" + (primary ? " ops-primary" : "")}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}
function PageTitle({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="ops-page-title">
      <div>
        {eyebrow && <span>{eyebrow}</span>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="ops-title-actions">{action}</div>}
    </header>
  );
}
function Stat({
  label,
  value,
  foot,
  icon: Icon = Wallet,
}: {
  label: string;
  value: string;
  foot: string;
  icon?: typeof Wallet;
}) {
  return (
    <article className="ops-stat">
      <div>
        <span>{label}</span>
        <Icon size={17} />
      </div>
      <strong>{value}</strong>
      <small>{foot}</small>
    </article>
  );
}
function SearchField({
  value,
  onChange,
  placeholder = "Search records",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="ops-search">
      <Search size={16} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button aria-label="Clear search" onClick={() => onChange("")}>
          <X size={14} />
        </button>
      )}
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  children,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className="ops-select">
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
      >
        {children}
      </select>
      <ChevronDown size={14} />
    </label>
  );
}
function Drawer({
  title,
  subtitle,
  children,
  onClose,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog className="ops-drawer" aria-label={title} ref={ref} onCancel={onClose}>
      <div className="ops-drawer-inner">
        <header>
          <div>
            {subtitle && <span>{subtitle}</span>}
            <h2>{title}</h2>
          </div>
          <button className="ops-icon" aria-label="Close panel" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        {children}
      </div>
    </dialog>
  );
}
function useAction() {
  const [result, setResult] = useState(""),
    [busy, setBusy] = useState(false);
  return {
    result,
    busy,
    run: async (fn: () => void, message: string) => {
      setBusy(true);
      setResult("");
      try {
        await Promise.resolve();
        fn();
        setResult(message);
      } catch (e) {
        setResult(e instanceof Error ? e.message : "Unable to save this change.");
      } finally {
        setBusy(false);
      }
    },
  };
}
function Feedback({ message }: { message: string }) {
  return message ? (
    <p className="ops-feedback" role="status">
      {message}
    </p>
  ) : null;
}
function ExportButton({ name, rows }: { name: string; rows: (string | number)[][] }) {
  return (
    <Button disabled={rows.length < 2} onClick={() => downloadCsv(name, rows)}>
      <ArrowDownToLine size={15} />
      Export
    </Button>
  );
}
function SpendChart({ data, range }: { data: CommerceState; range: TimeRange }) {
  const end = Date.now(),
    start =
      range === "All"
        ? Math.min(end - 86400000, ...data.usage.map((r) => Date.parse(r.at)))
        : timeRangeStart(range, end);
  const buckets = Array.from({ length: 14 }, (_, i) => {
    const from = start + ((end - start) / 14) * i,
      until = start + ((end - start) / 14) * (i + 1);
    return {
      value:
        data.usage
          .filter((r) => Date.parse(r.at) >= from && Date.parse(r.at) < until)
          .reduce((s, r) => s + r.costMicros, 0) / 1e6,
      at: new Date(until).toISOString(),
    };
  });
  const max = Math.max(...buckets.map((b) => b.value), 0.01),
    total = buckets.reduce((s, b) => s + b.value, 0);
  return (
    <section className="ops-panel ops-spend-chart">
      <div className="ops-panel-heading">
        <div>
          <h2>Metered spend</h2>
          <p>Usage charged to customer credit</p>
        </div>
        <strong>{money(total, 4)}</strong>
      </div>
      <div className="ops-bars" role="img" aria-label={"Metered spend " + money(total, 4)}>
        {buckets.map((b, i) => (
          <div key={i} title={date(b.at) + ": " + money(b.value, 4)}>
            <span style={{ height: Math.max(b.value ? 3 : 0, (b.value / max) * 100) + "%" }} />
          </div>
        ))}
      </div>
      <div className="ops-chart-axis">
        <span>{date(new Date(start).toISOString())}</span>
        <span>Today</span>
      </div>
    </section>
  );
}
function OrdersTable({
  orders,
  data,
  onOpen,
}: {
  orders: PaymentOrder[];
  data: CommerceState;
  onOpen: (id: string) => void;
}) {
  return orders.length ? (
    <div className="ops-table-scroll">
      <table className="ops-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            <th>Method</th>
            <th>Credit</th>
            <th>Status</th>
            <th>Created</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <button className="ops-text-button ops-id" onClick={() => onOpen(o.id)}>
                  {o.id}
                </button>
              </td>
              <td>{customerName(data, o.userId)}</td>
              <td>
                <span className="ops-method">
                  {o.method === "Crypto" ? <Wallet size={14} /> : <CreditCard size={14} />}{" "}
                  {o.method}
                </span>
              </td>
              <td>{cents(o.amountCents)}</td>
              <td>
                <Status value={o.status} />
              </td>
              <td className="ops-muted">{timestamp(o.createdAt)}</td>
              <td>
                <button
                  className="ops-icon"
                  aria-label={"View order " + o.id}
                  onClick={() => onOpen(o.id)}
                >
                  <ChevronRight size={17} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty />
  );
}
function Overview({ data, onOpen }: { data: CommerceState; onOpen: (id: string) => void }) {
  const [range, setRange] = useState<TimeRange>("30D");
  const orders = data.orders.filter((o) => inRange(o.createdAt, range)),
    usage = data.usage.filter((r) => inRange(r.at, range)),
    queue = data.orders.filter(
      (o) => pending.includes(o.status) || o.status === "refund_requested",
    );
  return (
    <>
      <PageTitle
        eyebrow="Operations"
        title="A clear view of your platform."
        description="Payments, customer credit, and usage in one place."
        action={<TimeRangeSelect value={range} onChange={setRange} label="Overview time range" />}
      />
      <div className="ops-stats">
        <Stat
          label="Credit inflow"
          value={cents(
            orders.filter((o) => settled.includes(o.status)).reduce((s, o) => s + o.amountCents, 0),
          )}
          foot={orders.filter((o) => settled.includes(o.status)).length + " settled orders"}
        />
        <Stat
          label="Customer credit"
          value={money(data.users.reduce((s, u) => s + u.balanceMicros, 0) / 1e6)}
          foot="Current local balance"
          icon={Layers3}
        />
        <Stat
          label="Active customers"
          value={num(new Set(usage.map((r) => r.userId)).size)}
          foot={data.users.length + " total customers"}
          icon={Users}
        />
        <Stat
          label="Needs attention"
          value={num(queue.length)}
          foot={queue.filter((o) => o.status === "refund_requested").length + " refund requests"}
          icon={CircleAlert}
        />
      </div>
      <div className="ops-two-col">
        <SpendChart data={data} range={range} />
        <section className="ops-panel">
          <div className="ops-panel-heading">
            <div>
              <h2>Operational pulse</h2>
              <p>Based on records in this workspace</p>
            </div>
            <Activity size={19} />
          </div>
          <div className="ops-pulse">
            <div>
              <span>API requests</span>
              <strong>{num(usage.length)}</strong>
            </div>
            <div>
              <span>Successful requests</span>
              <strong>
                {usage.length
                  ? Math.round(
                      (usage.filter((r) => r.status === "success").length / usage.length) * 100,
                    ) + "%"
                  : "—"}
              </strong>
            </div>
            <div>
              <span>Reconciliation exceptions</span>
              <strong>{data.orders.filter((o) => o.reconciliation === "exception").length}</strong>
            </div>
            <div>
              <span>Available models</span>
              <strong>
                {data.pricing.filter((m) => m.status === "available").length} /{" "}
                {data.pricing.length}
              </strong>
            </div>
          </div>
          <a className="ops-panel-link" href="#/admin/reconciliation">
            Open reconciliation <ArrowUpRight size={16} />
          </a>
        </section>
      </div>
      <section className="ops-panel ops-panel-table">
        <div className="ops-panel-heading">
          <div>
            <h2>
              Review queue <span className="ops-count">{queue.length}</span>
            </h2>
            <p>Payments and refunds requiring a decision</p>
          </div>
          <a href="#/admin/payments" className="ops-text-button">
            View all <ChevronRight size={15} />
          </a>
        </div>
        <OrdersTable orders={queue.slice(0, 5)} data={data} onOpen={onOpen} />
      </section>
    </>
  );
}
function PaymentDrawer({
  id,
  data,
  onClose,
}: {
  id: string;
  data: CommerceState;
  onClose: () => void;
}) {
  const o = data.orders.find((o) => o.id === id)!,
    user = data.users.find((u) => u.id === o.userId)!;
  const [reference, setReference] = useState(o.reference ?? ""),
    [note, setNote] = useState(""),
    [received, setReceived] = useState(
      o.receivedCents === undefined ? "" : String(o.receivedCents / 100),
    ),
    [ack, setAck] = useState(false);
  const action = useAction(),
    finance = data.settings.staffRole === "Finance",
    reviewable = pending.includes(o.status),
    refundable = o.status === "refund_requested";
  const receivedValid =
    /^\d+(?:\.\d{1,2})?$/.test(received) &&
    Number.isSafeInteger(Math.round(Number(received) * 100));
  const valid =
    finance && reference.trim().length > 0 && note.trim().length > 0 && ack && !action.busy;
  const exact = receivedValid && Math.round(Number(received) * 100) === o.amountCents + o.feeCents;
  return (
    <Drawer title={o.id} subtitle="Payment details" onClose={onClose}>
      <div className="ops-drawer-status">
        <Status value={o.status} />
        <span>{timestamp(o.createdAt)}</span>
      </div>
      <div className="ops-detail-amount">
        <span>Customer credit</span>
        <strong>{cents(o.amountCents)}</strong>
      </div>
      <dl className="ops-details">
        <div>
          <dt>Customer</dt>
          <dd>
            {user.name}
            <small>{user.email}</small>
          </dd>
        </div>
        <div>
          <dt>Service fee</dt>
          <dd>{cents(o.feeCents)}</dd>
        </div>
        <div>
          <dt>Total payable</dt>
          <dd>{cents(o.amountCents + o.feeCents)}</dd>
        </div>
        <div>
          <dt>Payment method</dt>
          <dd>
            {o.method}
            {o.wallet && <small>{o.wallet}</small>}
          </dd>
        </div>
        {o.network && (
          <div>
            <dt>Network / currency</dt>
            <dd>
              {o.network} · {o.currency}
            </dd>
          </div>
        )}
        <div>
          <dt>Reference</dt>
          <dd className="ops-break">{o.reference || "Not submitted"}</dd>
        </div>
        <div>
          <dt>Reconciliation</dt>
          <dd>
            <Status value={o.reconciliation} />
          </dd>
        </div>
        {o.creditedAt && (
          <div>
            <dt>Credited</dt>
            <dd>{timestamp(o.creditedAt)}</dd>
          </div>
        )}
        <div>
          <dt>Available credit</dt>
          <dd>{money(user.balanceMicros / 1e6)}</dd>
        </div>
      </dl>
      {o.note && (
        <div className="ops-note">
          <strong>Latest note</strong>
          <p>{o.note}</p>
        </div>
      )}
      {(reviewable || refundable) && (
        <form
          className="ops-review"
          onSubmit={(e) => {
            e.preventDefault();
            if (valid)
              action.run(
                () =>
                  refundable
                    ? resolveRefund(o.id, true, note)
                    : reviewPayment(
                        o.id,
                        "approve",
                        reference,
                        note,
                        Math.round(Number(received) * 100),
                      ),
                refundable
                  ? "Refund recorded in the local ledger."
                  : "Payment credited in the local ledger.",
              );
          }}
        >
          <h3>{refundable ? "Review refund" : "Review payment"}</h3>
          {!finance && (
            <p className="ops-access-note">
              <ShieldCheck size={15} />
              Finance role required for this action.
            </p>
          )}
          <label>
            Transaction reference
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={!finance}
              required
            />
          </label>
          {!refundable && (
            <label>
              Received amount · USD
              <input
                inputMode="decimal"
                placeholder="0.00"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                disabled={!finance}
                required
              />
              {receivedValid && !exact && (
                <small className="ops-error">Received amount must match the total payable.</small>
              )}
            </label>
          )}
          <label>
            Review note
            <textarea
              rows={3}
              placeholder="Evidence and reason for your decision"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              disabled={!finance}
              required
            />
          </label>
          <label className="ops-check">
            <input
              type="checkbox"
              checked={ack}
              onChange={(e) => setAck(e.target.checked)}
              disabled={!finance}
            />
            <span>
              I am recording a local review. No bank transfer or on-chain transaction will be
              executed.
            </span>
          </label>
          {refundable && user.balanceMicros < o.amountCents * 10000 && (
            <p className="ops-access-note">
              Available credit is below the refund amount. Approval is blocked.
            </p>
          )}
          <div className="ops-review-actions">
            <Button
              primary
              type="submit"
              disabled={
                !valid ||
                (!refundable && !exact) ||
                (refundable && user.balanceMicros < o.amountCents * 10000)
              }
            >
              {action.busy ? <LoaderCircle size={15} /> : <Check size={15} />}{" "}
              {refundable ? "Approve refund" : "Confirm payment"}
            </Button>
            <Button
              disabled={!valid}
              onClick={() =>
                action.run(
                  () =>
                    refundable
                      ? resolveRefund(o.id, false, note)
                      : reviewPayment(o.id, "reject", reference, note),
                  refundable ? "Refund declined." : "Payment rejected.",
                )
              }
            >
              {refundable ? "Decline refund" : "Reject payment"}
            </Button>
          </div>
        </form>
      )}
      <Feedback message={action.result} />
    </Drawer>
  );
}
function Payments({ data, onOpen }: { data: CommerceState; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [method, setMethod] = useState("all"),
    [range, setRange] = useState<TimeRange>("All");
  const filtered = data.orders.filter(
    (o) =>
      inRange(o.createdAt, range) &&
      (status === "all" || o.status === status) &&
      (method === "all" || o.method === method) &&
      [o.id, o.reference, customerName(data, o.userId)]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const rows = [
    ["Order", "Customer", "Credit USD", "Fee USD", "Method", "Status", "Reference", "Created"],
    ...filtered.map((o) => [
      o.id,
      customerName(data, o.userId),
      o.amountCents / 100,
      o.feeCents / 100,
      o.method,
      o.status,
      o.reference || "",
      o.createdAt,
    ]),
  ];
  return (
    <>
      <PageTitle
        title="Payments"
        description="Review incoming payments and manage refund requests."
        action={<ExportButton name="vishwa-payments.csv" rows={rows} />}
      />
      <div className="ops-metric-strip">
        <div>
          <span>Awaiting review</span>
          <strong>{data.orders.filter((o) => pending.includes(o.status)).length}</strong>
        </div>
        <div>
          <span>Refund requests</span>
          <strong>{data.orders.filter((o) => o.status === "refund_requested").length}</strong>
        </div>
        <div>
          <span>Settled credit</span>
          <strong>
            {cents(
              data.orders
                .filter((o) => settled.includes(o.status))
                .reduce((s, o) => s + o.amountCents, 0),
            )}
          </strong>
        </div>
      </div>
      <section className="ops-panel ops-panel-table">
        <div className="ops-filters">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search order, customer, reference"
          />
          <Select label="Payment status" value={status} onChange={setStatus}>
            <option value="all">All statuses</option>
            {[
              "awaiting_payment",
              "confirming",
              "needs_review",
              "credited",
              "refund_requested",
              "refunded",
              "failed",
              "cancelled",
            ].map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
          <Select label="Payment method" value={method} onChange={setMethod}>
            <option value="all">All methods</option>
            <option>Fiat</option>
            <option>Crypto</option>
          </Select>
          <TimeRangeSelect value={range} onChange={setRange} label="Payment time range" />
        </div>
        <OrdersTable orders={filtered} data={data} onOpen={onOpen} />
        <div className="ops-table-footer">{filtered.length} orders</div>
      </section>
    </>
  );
}
function Reconciliation({ data }: { data: CommerceState }) {
  const [status, setStatus] = useState("all"),
    [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const orders = data.orders.filter(
    (o) =>
      (status === "all" || o.reconciliation === status) &&
      [o.id, o.reference, customerName(data, o.userId)]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Reconciliation"
        description="Compare expected payments with amounts recorded by your team."
        action={
          <ExportButton
            name="vishwa-reconciliation.csv"
            rows={[
              ["Order", "Expected USD", "Received USD", "Status", "Reference"],
              ...orders.map((o) => [
                o.id,
                (o.amountCents + o.feeCents) / 100,
                o.receivedCents === undefined ? "" : o.receivedCents / 100,
                o.reconciliation,
                o.reference || "",
              ]),
            ]}
          />
        }
      />
      <div className="ops-stats ops-stats-three">
        <Stat
          label="Unmatched"
          value={num(data.orders.filter((o) => o.reconciliation === "unmatched").length)}
          foot="Awaiting a reconciliation note"
          icon={FileCheck2}
        />
        <Stat
          label="Exceptions"
          value={num(data.orders.filter((o) => o.reconciliation === "exception").length)}
          foot="Require investigation"
          icon={CircleAlert}
        />
        <Stat
          label="Matched locally"
          value={num(data.orders.filter((o) => o.reconciliation === "matched").length)}
          foot="No provider verification connected"
          icon={CheckCircle2}
        />
      </div>
      <section className="ops-panel ops-panel-table">
        <div className="ops-filters">
          <SearchField value={query} onChange={setQuery} placeholder="Search order or reference" />
          <Select label="Reconciliation status" value={status} onChange={setStatus}>
            <option value="all">All records</option>
            {["unmatched", "matched", "exception"].map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </Select>
        </div>
        {orders.length ? (
          <div className="ops-table-scroll">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Expected</th>
                  <th>Received</th>
                  <th>Difference</th>
                  <th>Reconciliation</th>
                  <th>Reference</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong className="ops-id">{o.id}</strong>
                      <small>{customerName(data, o.userId)}</small>
                    </td>
                    <td>{cents(o.amountCents + o.feeCents)}</td>
                    <td>
                      {o.receivedCents === undefined ? (
                        <span className="ops-muted">Not recorded</span>
                      ) : (
                        cents(o.receivedCents)
                      )}
                    </td>
                    <td>
                      {o.receivedCents === undefined
                        ? "—"
                        : cents(o.receivedCents - o.amountCents - o.feeCents)}
                    </td>
                    <td>
                      <Status value={o.reconciliation} />
                    </td>
                    <td className="ops-muted ops-id">{o.reference || "—"}</td>
                    <td>
                      <Button onClick={() => setSelected(o.id)}>
                        Review
                        <ChevronRight size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </section>
      {selected && (
        <ReconciliationDrawer
          key={selected}
          id={selected}
          data={data}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
function ReconciliationDrawer({
  id,
  data,
  onClose,
}: {
  id: string;
  data: CommerceState;
  onClose: () => void;
}) {
  const order = data.orders.find((o) => o.id === id)!;
  const [received, setReceived] = useState(
      order.receivedCents === undefined ? "" : String(order.receivedCents / 100),
    ),
    [note, setNote] = useState(""),
    [ack, setAck] = useState(false);
  const action = useAction(),
    valid =
      /^\d+(?:\.\d{1,2})?$/.test(received) &&
      Number.isSafeInteger(Math.round(Number(received) * 100)),
    expected = order.amountCents + order.feeCents,
    finance = data.settings.staffRole === "Finance";
  const record = (result: "matched" | "exception") =>
    action.run(
      () => reconcileOrder(id, result, note, Math.round(Number(received) * 100)),
      "Reconciliation saved to the local ledger.",
    );
  return (
    <Drawer title={id} subtitle="Reconciliation review" onClose={onClose}>
      <dl className="ops-details">
        <div>
          <dt>Expected payment</dt>
          <dd>{cents(expected)}</dd>
        </div>
        <div>
          <dt>Customer credit</dt>
          <dd>{cents(order.amountCents)}</dd>
        </div>
        <div>
          <dt>Service fee</dt>
          <dd>{cents(order.feeCents)}</dd>
        </div>
        <div>
          <dt>Reference</dt>
          <dd className="ops-break">{order.reference || "Not submitted"}</dd>
        </div>
      </dl>
      <div className="ops-note">
        <strong>Manual local record</strong>
        <p>
          No PSP statement or blockchain data has been retrieved. Record the amount from evidence
          you have independently reviewed.
        </p>
      </div>
      <div className="ops-review">
        <label>
          Received amount · USD
          <input
            inputMode="decimal"
            value={received}
            onChange={(e) => setReceived(e.target.value)}
            placeholder="0.00"
            disabled={!finance}
          />
        </label>
        {valid && (
          <div className="ops-difference">
            <span>Difference</span>
            <strong>{cents(Math.round(Number(received) * 100) - expected)}</strong>
          </div>
        )}
        <label>
          Reconciliation note
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Source, reference, and any discrepancy"
            disabled={!finance}
          />
        </label>
        <label className="ops-check">
          <input
            type="checkbox"
            checked={ack}
            onChange={(e) => setAck(e.target.checked)}
            disabled={!finance}
          />
          <span>This updates the local record only; it does not verify receipt or move funds.</span>
        </label>
        {!finance && (
          <p className="ops-access-note">Finance role required to save a reconciliation.</p>
        )}
        <div className="ops-review-actions">
          <Button
            primary
            disabled={
              !finance ||
              !valid ||
              !note.trim() ||
              !ack ||
              action.busy ||
              Math.round(Number(received) * 100) !== expected
            }
            onClick={() => record("matched")}
          >
            Mark matched
          </Button>
          <Button
            disabled={!finance || !valid || !note.trim() || !ack || action.busy}
            onClick={() => record("exception")}
          >
            Flag exception
          </Button>
        </div>
        <Feedback message={action.result} />
      </div>
    </Drawer>
  );
}
function Customers({ data, onOrder }: { data: CommerceState; onOrder: (id: string) => void }) {
  const [query, setQuery] = useState(""),
    [status, setStatus] = useState("all"),
    [source, setSource] = useState("all"),
    [selected, setSelected] = useState<string | null>(null);
  const users = data.users.filter(
    (u) =>
      (status === "all" || u.status === status) &&
      (source === "all" || u.source === source) &&
      [u.name, u.email, u.company, u.id].join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Customers"
        description="Account health, balances, and usage at a glance."
        action={
          <ExportButton
            name="vishwa-customers.csv"
            rows={[
              ["ID", "Name", "Email", "Company", "Source", "Status", "Credit USD", "Joined"],
              ...users.map((u) => [
                u.id,
                u.name,
                u.email,
                u.company,
                u.source,
                u.status,
                u.balanceMicros / 1e6,
                u.joinedAt,
              ]),
            ]}
          />
        }
      />
      <section className="ops-panel ops-panel-table">
        <div className="ops-filters">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search name, email, or company"
          />
          <Select label="Customer status" value={status} onChange={setStatus}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
          <Select label="Acquisition source" value={source} onChange={setSource}>
            <option value="all">All sources</option>
            {[...new Set(data.users.map((u) => u.source))].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </Select>
        </div>
        {users.length ? (
          <div className="ops-table-scroll">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Credit balance</th>
                  <th>Metered spend</th>
                  <th>Joined</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <button
                        className="ops-person ops-text-button"
                        onClick={() => setSelected(u.id)}
                      >
                        <span className="ops-avatar">
                          {u.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </span>
                        <span>
                          <strong>{u.name}</strong>
                          <small>{u.email}</small>
                        </span>
                      </button>
                    </td>
                    <td>{u.company}</td>
                    <td>
                      <Status value={u.status} />
                    </td>
                    <td>{money(u.balanceMicros / 1e6)}</td>
                    <td>
                      {money(
                        data.usage
                          .filter((r) => r.userId === u.id)
                          .reduce((s, r) => s + r.costMicros, 0) / 1e6,
                        4,
                      )}
                    </td>
                    <td className="ops-muted">{date(u.joinedAt)}</td>
                    <td>
                      <button
                        className="ops-icon"
                        aria-label={"Open " + u.name}
                        onClick={() => setSelected(u.id)}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
        <div className="ops-table-footer">{users.length} customers</div>
      </section>
      {selected && (
        <CustomerDrawer
          key={selected}
          user={data.users.find((u) => u.id === selected)!}
          data={data}
          onClose={() => setSelected(null)}
          onOrder={(id) => {
            setSelected(null);
            onOrder(id);
          }}
        />
      )}
    </>
  );
}
function CustomerDrawer({
  user,
  data,
  onClose,
  onOrder,
}: {
  user: Customer;
  data: CommerceState;
  onClose: () => void;
  onOrder: (id: string) => void;
}) {
  const [tab, setTab] = useState<"orders" | "activity">("orders"),
    [confirm, setConfirm] = useState(false);
  const action = useAction(),
    usage = data.usage.filter((r) => r.userId === user.id),
    orders = data.orders.filter((o) => o.userId === user.id);
  return (
    <Drawer title={user.name} subtitle={user.company} onClose={onClose}>
      <div className="ops-customer-intro">
        <span>{user.email}</span>
        <Status value={user.status} />
      </div>
      <div className="ops-mini-stats">
        <div>
          <span>Available credit</span>
          <strong>{money(user.balanceMicros / 1e6)}</strong>
        </div>
        <div>
          <span>Metered spend</span>
          <strong>{money(usage.reduce((s, r) => s + r.costMicros, 0) / 1e6, 4)}</strong>
        </div>
      </div>
      <dl className="ops-details">
        <div>
          <dt>Customer ID</dt>
          <dd>{user.id}</dd>
        </div>
        <div>
          <dt>Acquisition</dt>
          <dd>{user.source}</dd>
        </div>
        <div>
          <dt>Joined</dt>
          <dd>{date(user.joinedAt)}</dd>
        </div>
        <div>
          <dt>Last active</dt>
          <dd>{timestamp(user.lastActive)}</dd>
        </div>
      </dl>
      <div className="ops-tabs" role="group" aria-label="Customer records">
        <button aria-pressed={tab === "orders"} onClick={() => setTab("orders")}>
          Orders <span>{orders.length}</span>
        </button>
        <button aria-pressed={tab === "activity"} onClick={() => setTab("activity")}>
          Activity <span>{usage.length}</span>
        </button>
      </div>
      {tab === "orders" ? (
        orders.length ? (
          <div className="ops-record-list">
            {orders.map((o) => (
              <button key={o.id} onClick={() => onOrder(o.id)}>
                <span>
                  <strong>{o.id}</strong>
                  <small>{timestamp(o.createdAt)}</small>
                </span>
                <span>
                  {cents(o.amountCents)}
                  <Status value={o.status} />
                </span>
                <ChevronRight size={16} />
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="No payment orders"
            text="Payment orders appear when this customer adds credit."
          />
        )
      ) : usage.length ? (
        <div className="ops-record-list">
          {usage.map((r) => (
            <div key={r.id}>
              <span>
                <strong>{data.pricing.find((m) => m.id === r.modelId)?.name ?? r.modelId}</strong>
                <small>
                  {timestamp(r.at)} · {num(r.input + r.output)} tokens
                </small>
              </span>
              <span>
                {money(r.costMicros / 1e6, 4)}
                <Status value={r.status} />
              </span>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No requests yet" text="Request activity appears after the first API call." />
      )}
      <div className="ops-account-action">
        <h3>Account access</h3>
        <p>
          {user.status === "active"
            ? "Suspend this account in the local workspace."
            : "Restore this account in the local workspace."}
        </p>
        <label className="ops-check">
          <input
            type="checkbox"
            checked={confirm}
            onChange={(e) => setConfirm(e.target.checked)}
            disabled={data.settings.staffRole === "Analyst"}
          />
          <span>Confirm this account status change</span>
        </label>
        <Button
          disabled={!confirm || data.settings.staffRole === "Analyst" || action.busy}
          onClick={() =>
            action.run(() => {
              updateCustomer(user.id, {
                status: user.status === "active" ? "suspended" : "active",
              });
              setConfirm(false);
            }, "Account status updated.")
          }
        >
          {user.status === "active" ? "Suspend account" : "Restore account"}
        </Button>
        <Feedback message={action.result} />
      </div>
    </Drawer>
  );
}
function Growth({ data }: { data: CommerceState }) {
  const [range, setRange] = useState<TimeRange>("30D");
  const users = data.users.filter((u) => inRange(u.joinedAt, range)),
    cohort = new Set(users.map((u) => u.id)),
    paid = new Set(
      data.orders
        .filter((o) => cohort.has(o.userId) && settled.includes(o.status))
        .map((o) => o.userId),
    ),
    activated = new Set(
      data.usage.filter((r) => cohort.has(r.userId) && r.status === "success").map((r) => r.userId),
    );
  const sources = [...new Set(data.users.map((u) => u.source))]
      .map((source) => ({
        source,
        count: users.filter((u) => u.source === source).length,
        paid: users.filter((u) => u.source === source && paid.has(u.id)).length,
      }))
      .sort((a, b) => b.count - a.count),
    max = Math.max(...sources.map((s) => s.count), 1),
    creditInflow = data.orders
      .filter((o) => inRange(o.createdAt, range) && settled.includes(o.status))
      .reduce((s, o) => s + o.amountCents, 0),
    funnel = [
      { name: "Registered", value: users.length },
      { name: "Added credit", value: paid.size },
      { name: "Made an API request", value: activated.size },
    ];
  return (
    <>
      <PageTitle
        title="Growth"
        description="Acquisition and activation from local customer records."
        action={
          <>
            <TimeRangeSelect value={range} onChange={setRange} label="Growth time range" />
            <ExportButton
              name="vishwa-growth.csv"
              rows={[
                ["Source", "Registrations", "Paid customers"],
                ...sources.map((s) => [s.source, s.count, s.paid]),
              ]}
            />
          </>
        }
      />
      <div className="ops-stats">
        <Stat
          label="New customers"
          value={num(users.length)}
          foot="Joined in selected period"
          icon={Users}
        />
        <Stat
          label="Activated"
          value={num(activated.size)}
          foot="At least one successful API request"
          icon={Activity}
        />
        <Stat
          label="Activation rate"
          value={users.length ? Math.round((activated.size / users.length) * 100) + "%" : "—"}
          foot="Of new customers"
          icon={TrendingUp}
        />
        <Stat
          label="Credit inflow"
          value={cents(creditInflow)}
          foot="Settled credit, excluding refunds"
        />
      </div>
      <div className="ops-two-col">
        <section className="ops-panel">
          <div className="ops-panel-heading">
            <div>
              <h2>Acquisition sources</h2>
              <p>New customer attribution</p>
            </div>
            <Users size={19} />
          </div>
          <div className="ops-source-bars">
            {sources.map((s, i) => (
              <div key={s.source}>
                <div>
                  <span>
                    <i
                      style={{
                        background: ["var(--vg-accent)", "var(--vg-cyan)", "#9cabe4", "#8faaa1"][
                          i % 4
                        ],
                      }}
                    />
                    {s.source}
                  </span>
                  <strong>{s.count}</strong>
                </div>
                <div className="ops-track">
                  <span style={{ width: (s.count / max) * 100 + "%" }} />
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="ops-panel">
          <div className="ops-panel-heading">
            <div>
              <h2>Activation milestones</h2>
              <p>Selected cohort · independent milestones</p>
            </div>
          </div>
          <div className="ops-funnel">
            {funnel.map((item, i) => (
              <div key={item.name}>
                <span className="ops-funnel-number">0{i + 1}</span>
                <div>
                  <span>{item.name}</span>
                  <div className="ops-track">
                    <span
                      style={{
                        width: (users.length ? (item.value / users.length) * 100 : 0) + "%",
                      }}
                    />
                  </div>
                </div>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
      <SpendChart data={data} range={range} />
      <section className="ops-panel ops-panel-table">
        <div className="ops-panel-heading">
          <h2>Source performance</h2>
          <span className="ops-muted">Recorded attribution</span>
        </div>
        <div className="ops-table-scroll">
          <table className="ops-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Registrations</th>
                <th>Paid customers</th>
                <th>Paid conversion</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((s) => (
                <tr key={s.source}>
                  <td>{s.source}</td>
                  <td>{s.count}</td>
                  <td>{s.paid}</td>
                  <td>{s.count ? Math.round((s.paid / s.count) * 100) + "%" : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
function ModelPricing({ data }: { data: CommerceState }) {
  const [query, setQuery] = useState(""),
    [selected, setSelected] = useState<string | null>(null);
  const rows = data.pricing.filter((m) =>
    [m.name, m.provider, m.id].join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Models & pricing"
        description="Set input and output rates for new local requests."
        action={
          <ExportButton
            name="vishwa-pricing.csv"
            rows={[
              ["Model", "Provider", "Input USD per1M", "Output USD per1M", "Status"],
              ...rows.map((m) => [
                m.id,
                m.provider,
                m.ratesConfigured === false ? "Pricing pending" : m.inputRate,
                m.ratesConfigured === false ? "Pricing pending" : m.outputRate,
                m.status,
              ]),
            ]}
          />
        }
      />
      <section className="ops-panel ops-panel-table">
        <div className="ops-filters">
          <SearchField value={query} onChange={setQuery} placeholder="Search models or providers" />
          <span className="ops-filter-note">Rates per 1M tokens</span>
        </div>
        {rows.length ? (
          <div className="ops-table-scroll">
            <table className="ops-table">
              <thead>
                <tr>
                  <th>Model</th>
                  <th>Provider</th>
                  <th>Input</th>
                  <th>Output</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <strong>{m.name}</strong>
                      <small className="ops-id">{m.id}</small>
                    </td>
                    <td className="ops-muted">{m.provider}</td>
                    <td>
                      {m.ratesConfigured === false ? "Pricing pending" : money(m.inputRate, 2)}
                    </td>
                    <td>{m.ratesConfigured === false ? "—" : money(m.outputRate, 2)}</td>
                    <td>
                      <Status value={m.status} />
                    </td>
                    <td>
                      <Button onClick={() => setSelected(m.id)}>
                        {m.ratesConfigured === false
                          ? "View setup"
                          : data.settings.staffRole === "Finance"
                            ? "Edit rates"
                            : "View rates"}
                        <SlidersHorizontal size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty />
        )}
      </section>
      {selected && (
        <PricingDrawer
          key={selected}
          model={data.pricing.find((m) => m.id === selected)!}
          role={data.settings.staffRole}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
function PricingDrawer({
  model,
  role,
  onClose,
}: {
  model: Pricing;
  role: StaffRole;
  onClose: () => void;
}) {
  const [input, setInput] = useState(String(model.inputRate)),
    [output, setOutput] = useState(String(model.outputRate)),
    [status, setStatus] = useState(model.status);
  const action = useAction(),
    valid = [input, output].every(
      (v) => v.trim() !== "" && Number.isFinite(Number(v)) && Number(v) >= 0,
    );
  if (model.ratesConfigured === false)
    return (
      <Drawer title={model.name} subtitle={model.provider + " · Pricing pending"} onClose={onClose}>
        <div className="ops-note">
          <strong>Gateway pricing not configured</strong>
          <p>
            {model.modality === "video"
              ? "Video generation requires an asynchronous endpoint and a video-specific billing configuration. Language input/output rates do not apply."
              : "Input and output rates must be configured before this model can be enabled."}
          </p>
        </div>
        <dl className="ops-details">
          <div>
            <dt>Model ID</dt>
            <dd className="ops-break">{model.id}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>Setup pending</dd>
          </div>
          <div>
            <dt>Rates</dt>
            <dd>Not configured</dd>
          </div>
        </dl>
      </Drawer>
    );
  return (
    <Drawer title={model.name} subtitle={model.provider + " · Pricing"} onClose={onClose}>
      <div className="ops-note">
        <strong>USD per 1M tokens</strong>
        <p>
          Past usage retains the rate recorded at request time. Changes affect future local
          requests.
        </p>
      </div>
      <form
        className="ops-review"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && role === "Finance")
            action.run(
              () =>
                updatePricing(model.id, {
                  inputRate: Number(input),
                  outputRate: Number(output),
                  status,
                }),
              "Pricing saved. An audit event has been recorded.",
            );
        }}
      >
        <label>
          Input rate
          <input
            type="number"
            min="0"
            step="any"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={role !== "Finance"}
            required
          />
        </label>
        <label>
          Output rate
          <input
            type="number"
            min="0"
            step="any"
            value={output}
            onChange={(e) => setOutput(e.target.value)}
            disabled={role !== "Finance"}
            required
          />
        </label>
        <label>
          Availability
          <Select
            label="Model availability"
            value={status}
            onChange={(v) => setStatus(v as Pricing["status"])}
            disabled={role !== "Finance"}
          >
            <option value="available">Available</option>
            <option value="paused">Paused</option>
          </Select>
        </label>
        <div className="ops-calculation">
          <span>1,000 input + 500 output</span>
          <strong>
            {valid ? money((Number(input) * 1000 + Number(output) * 500) / 1e6, 4) : "—"}
          </strong>
        </div>
        {role !== "Finance" && (
          <p className="ops-access-note">Only Finance can change model pricing.</p>
        )}
        <Button type="submit" primary disabled={!valid || role !== "Finance" || action.busy}>
          Save pricing
        </Button>
        <Feedback message={action.result} />
      </form>
    </Drawer>
  );
}
function AuditLog({ data }: { data: CommerceState }) {
  const [query, setQuery] = useState(""),
    [actor, setActor] = useState("all"),
    [range, setRange] = useState<TimeRange>("All");
  const rows = data.audit.filter(
    (e) =>
      inRange(e.at, range) &&
      (actor === "all" || e.actor === actor) &&
      [e.actor, e.action, e.target, e.note].join(" ").toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageTitle
        title="Audit log"
        description="Changes made in this local workspace."
        action={
          <ExportButton
            name="vishwa-audit.csv"
            rows={[
              ["Time", "Actor", "Action", "Target", "Note"],
              ...rows.map((e) => [e.at, e.actor, e.action, e.target, e.note]),
            ]}
          />
        }
      />
      <section className="ops-panel ops-panel-table">
        <div className="ops-filters">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search action, target, or note"
          />
          <Select label="Audit actor" value={actor} onChange={setActor}>
            <option value="all">All actors</option>
            {[...new Set(data.audit.map((e) => e.actor))].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </Select>
          <TimeRangeSelect value={range} onChange={setRange} label="Audit time range" />
        </div>
        {rows.length ? (
          <div className="ops-table-scroll">
            <table className="ops-table ops-audit-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.id}>
                    <td className="ops-muted">{timestamp(e.at)}</td>
                    <td>
                      <span className="ops-actor">{e.actor}</span>
                    </td>
                    <td>
                      <strong>{e.action}</strong>
                    </td>
                    <td className="ops-id">{e.target}</td>
                    <td className="ops-audit-note">{e.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title={data.audit.length ? "No matching events" : "No changes recorded yet"}
            text="Payment reviews, pricing changes, and account actions appear here."
          />
        )}
      </section>
    </>
  );
}
const integrations = [
  {
    name: "Fiat payments",
    description: "Checkout sessions and signed payment webhooks.",
    requirements: [
      "Create a hosted checkout session on the server.",
      "Validate signed callbacks and reconcile the order amount.",
      "Credit the customer ledger once after verified settlement.",
    ],
  },
  {
    name: "Crypto payments",
    description: "Wallet connectors, chain receipts, and settlement.",
    requirements: [
      "Configure supported networks, assets, and wallets.",
      "Verify the recipient, chain, amount, and transaction confirmations.",
      "Handle duplicate receipts and asynchronous settlement.",
    ],
  },
  {
    name: "Inference gateway",
    description: "Live model routing and metered token consumption.",
    requirements: [
      "Authenticate API keys and enforce account limits.",
      "Capture input/output usage and the applied pricing snapshot.",
      "Settle credit and write request activity on the server.",
    ],
  },
  {
    name: "Authentication",
    description: "Google sign-in, email codes, and staff access.",
    requirements: [
      "Connect Google OAuth and verified email delivery.",
      "Persist server-side sessions and protected staff roles.",
      "Enforce role permissions on every administrative endpoint.",
    ],
  },
];
function AdminSettings({ data }: { data: CommerceState }) {
  const [fee, setFee] = useState(String(data.settings.serviceFeePercent)),
    [integration, setIntegration] = useState<number | null>(null);
  const action = useAction(),
    valid =
      fee.trim() !== "" && Number.isFinite(Number(fee)) && Number(fee) >= 0 && Number(fee) <= 100;
  return (
    <>
      <PageTitle
        title="Settings"
        description="Local payment policy and integration requirements."
      />
      <div className="ops-two-col">
        <section className="ops-panel">
          <div className="ops-panel-heading">
            <div>
              <h2>Payment policy</h2>
              <p>Applied to new credit orders</p>
            </div>
            <CreditCard size={19} />
          </div>
          <form
            className="ops-review"
            onSubmit={(e) => {
              e.preventDefault();
              if (valid && data.settings.staffRole === "Finance")
                action.run(
                  () => updateSettings({ serviceFeePercent: Number(fee) }),
                  "Service fee saved for future local orders.",
                );
            }}
          >
            <label>
              Service fee · %
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                disabled={data.settings.staffRole !== "Finance"}
                required
              />
            </label>
            <div className="ops-calculation">
              <span>$100 credit checkout</span>
              <strong>{valid ? money(100 + Number(fee)) : "—"}</strong>
            </div>
            <p className="ops-muted">
              The customer receives $100 credit. The service fee is charged separately.
            </p>
            <Button
              primary
              type="submit"
              disabled={!valid || data.settings.staffRole !== "Finance" || action.busy}
            >
              Save policy
            </Button>
            <Feedback message={action.result} />
          </form>
        </section>
        <section className="ops-panel">
          <div className="ops-panel-heading">
            <div>
              <h2>Staff role view</h2>
              <p>Local interface permissions</p>
            </div>
            <ShieldCheck size={19} />
          </div>
          <div className="ops-role-options">
            {(["Finance", "Support", "Analyst"] as const).map((role) => (
              <button
                key={role}
                aria-pressed={data.settings.staffRole === role}
                onClick={() => updateSettings({ staffRole: role })}
              >
                <span>
                  <strong>{role}</strong>
                  <small>
                    {role === "Finance"
                      ? "Payments, refunds, pricing, and customers"
                      : role === "Support"
                        ? "Customer access and read-only payments"
                        : "Read-only analytics and records"}
                  </small>
                </span>
                {data.settings.staffRole === role && <CheckCircle2 size={19} />}
              </button>
            ))}
          </div>
          <p className="ops-muted ops-role-disclaimer">
            This role switch changes the local UI. Server authorization is not connected.
          </p>
        </section>
      </div>
      <section className="ops-panel">
        <div className="ops-panel-heading">
          <div>
            <h2>Service connections</h2>
            <p>Integration handoff</p>
          </div>
          <span className="ops-offline">
            <i />
            Services offline
          </span>
        </div>
        <div className="ops-integrations">
          {integrations.map((item, i) => (
            <button key={item.name} onClick={() => setIntegration(i)}>
              <span className="ops-integration-icon">
                {i === 0 ? (
                  <CreditCard />
                ) : i === 1 ? (
                  <Wallet />
                ) : i === 2 ? (
                  <Layers3 />
                ) : (
                  <ShieldCheck />
                )}
              </span>
              <span>
                <strong>{item.name}</strong>
                <small>{item.description}</small>
              </span>
              <span className="ops-status ops-status-unmatched">Pending</span>
              <ChevronRight size={16} />
            </button>
          ))}
        </div>
      </section>
      {integration !== null && (
        <Drawer
          title={integrations[integration].name}
          subtitle="Integration requirements"
          onClose={() => setIntegration(null)}
        >
          <div className="ops-note">
            <strong>Backend connection pending</strong>
            <p>
              Credentials are managed on the server. This interface stores no payment or identity
              secrets.
            </p>
          </div>
          <ol className="ops-requirements">
            {integrations[integration].requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ol>
          <Button onClick={() => setIntegration(null)}>
            Done
            <Check size={15} />
          </Button>
        </Drawer>
      )}
    </>
  );
}
export function Admin({
  theme,
  onToggleTheme,
}: {
  theme: "dark" | "light";
  onToggleTheme: () => void;
}) {
  const data = useCommerce(),
    [section, setSection] = useState(sectionFromHash),
    [order, setOrder] = useState<string | null>(null);
  useEffect(() => {
    const update = () => {
      setSection(sectionFromHash());
      setOrder(null);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);
  const role = data.settings.staffRole;
  let content: ReactNode;
  switch (section) {
    case "payments":
      content = <Payments data={data} onOpen={setOrder} />;
      break;
    case "reconciliation":
      content = <Reconciliation data={data} />;
      break;
    case "users":
      content = <Customers data={data} onOrder={setOrder} />;
      break;
    case "growth":
      content = <Growth data={data} />;
      break;
    case "models":
      content = <ModelPricing data={data} />;
      break;
    case "audit":
      content = <AuditLog data={data} />;
      break;
    case "settings":
      content = <AdminSettings data={data} />;
      break;
    default:
      content = <Overview data={data} onOpen={setOrder} />;
  }
  return (
    <div className="ops-app">
      <header className="ops-topbar">
        <a href="#/admin" aria-label="Vishwa operations home">
          <Brand />
        </a>
        <span className="ops-internal">
          <ShieldCheck size={14} />
          Internal operations
        </span>
        <div className="ops-topbar-actions">
          <span className="ops-offline">
            <i />
            Local dataset · services offline
          </span>
          <button
            className="ops-icon"
            onClick={onToggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="ops-avatar">OP</span>
        </div>
      </header>
      <div className="ops-layout">
        <aside className="ops-sidebar">
          <div className="ops-workspace">
            <span className="ops-workspace-icon">
              <Layers3 size={19} />
            </span>
            <span>
              <strong>Gateway</strong>
              <small>Operations workspace</small>
            </span>
          </div>
          <nav aria-label="Internal operations">
            {navigation.map(([id, label, Icon]) => (
              <a
                key={id}
                href={id === "overview" ? "#/admin" : "#/admin/" + id}
                aria-current={section === id ? "page" : undefined}
              >
                <Icon size={17} />
                <span>{label}</span>
                {id === "payments" &&
                  data.orders.filter(
                    (o) => pending.includes(o.status) || o.status === "refund_requested",
                  ).length > 0 && (
                    <b>
                      {
                        data.orders.filter(
                          (o) => pending.includes(o.status) || o.status === "refund_requested",
                        ).length
                      }
                    </b>
                  )}
              </a>
            ))}
          </nav>
          <div className="ops-sidebar-bottom">
            <label>
              Viewing as
              <Select
                label="Staff role view"
                value={role}
                onChange={(v) => updateSettings({ staffRole: v as StaffRole })}
              >
                {(["Finance", "Support", "Analyst"] as const).map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </Select>
            </label>
            <a href="#/console">
              Customer workspace
              <ArrowUpRight size={15} />
            </a>
          </div>
        </aside>
        <main className="ops-main" key={section}>
          {content}
        </main>
      </div>
      {order && data.orders.some((o) => o.id === order) && (
        <PaymentDrawer key={order} id={order} data={data} onClose={() => setOrder(null)} />
      )}
    </div>
  );
}
