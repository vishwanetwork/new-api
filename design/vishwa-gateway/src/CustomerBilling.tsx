import { useState } from "react";
import { ArrowDownToLine, ArrowRight, Plus } from "lucide-react";
import {
  currentCustomer,
  money,
  requestRefund,
  statusLabel,
  updateSettings,
  useCommerce,
  type PaymentOrder,
} from "./commerce";
import { Badge, date, Empty, LowBalance, Modal, Title } from "./CustomerJourney";
import { TimeRangeSelect, timeRangeStart, type TimeRange } from "./TimeRange";

function receipt(order: PaymentOrder, email: string) {
  const text = [
    "VISHWA GATEWAY",
    "LOCAL WORKSPACE RECEIPT",
    "This design record is not a tax invoice or proof of a real payment.",
    "",
    `Order: ${order.id}`,
    `Account: ${email}`,
    `Created: ${date(order.createdAt)}`,
    `Status: ${statusLabel(order.status)}`,
    `Payment method: ${order.method}`,
    `Credit: ${money(order.amountCents / 100)}`,
    `Fee: ${money(order.feeCents / 100)}`,
    `Total: ${money((order.amountCents + order.feeCents) / 100)}`,
    `Reference: ${order.reference ?? "Not received"}`,
    `Credited: ${order.creditedAt ? date(order.creditedAt) : "Pending"}`,
  ].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = order.id + "-receipt.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function CustomerBilling({ onAddCredit }: { credit: number; onAddCredit: () => void }) {
  const data = useCommerce();
  const user = currentCustomer(data);
  const orders = data.orders.filter((o) => o.userId === user.id);
  const [period, setPeriod] = useState<TimeRange>("All");
  const [status, setStatus] = useState("all");
  const [method, setMethod] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refund, setRefund] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const selected = orders.find((o) => o.id === selectedId);
  const filtered = orders.filter(
    (o) =>
      Date.parse(o.createdAt) >= timeRangeStart(period, Date.now()) &&
      (status === "all" || o.status === status) &&
      (method === "all" || o.method === method) &&
      (!query.trim() ||
        [o.id, o.reference ?? ""].join(" ").toLowerCase().includes(query.trim().toLowerCase())),
  );
  const pending = orders
    .filter((o) => ["awaiting_payment", "confirming", "needs_review"].includes(o.status))
    .reduce((s, o) => s + o.amountCents, 0);
  function close() {
    setSelectedId(null);
    setRefund(false);
    setNote("");
    setError("");
  }
  return (
    <>
      <Title
        title="Billing"
        action={
          <button className="cw-button cw-primary" onClick={onAddCredit}>
            <Plus size={16} />
            Add credit
          </button>
        }
      />
      <LowBalance onAddCredit={onAddCredit} />
      <div className="cw-split">
        <section className="cw-panel cw-balance">
          <div className="cw-panel-title">
            <h2>Available credit</h2>
          </div>
          <strong>{money(user.balanceMicros / 1e6)}</strong>
          <p className="cw-note">Ready to use across models</p>
        </section>
        <section className="cw-panel cw-balance">
          <div className="cw-panel-title">
            <h2>Awaiting confirmation</h2>
          </div>
          <strong>{money(pending / 100)}</strong>
          <p className="cw-note">Credit becomes available after payment is confirmed.</p>
        </section>
      </div>
      <section className="cw-panel">
        <div className="cj-panel-head">
          <h2>Order history</h2>
          <TimeRangeSelect value={period} onChange={setPeriod} label="Billing date range" />
        </div>
        <div className="cw-filters">
          <label className="cw-search">
            <input
              aria-label="Search orders"
              placeholder="Search order or reference"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            aria-label="Filter order status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">All statuses</option>
            {[
              "awaiting_payment",
              "confirming",
              "needs_review",
              "credited",
              "failed",
              "cancelled",
              "expired",
              "refund_requested",
              "refunded",
            ].map((s) => (
              <option key={s} value={s}>
                {statusLabel(s)}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter payment method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option value="all">All payment methods</option>
            <option>Fiat</option>
            <option>Crypto</option>
          </select>
        </div>
        {filtered.length ? (
          <div className="cw-table-scroll">
            <table>
              <thead>
                <tr>
                  {["Order", "Date", "Credit", "Method", "Status", ""].map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <strong>{o.id}</strong>
                    </td>
                    <td>{date(o.createdAt)}</td>
                    <td>{money(o.amountCents / 100)}</td>
                    <td>{o.method}</td>
                    <td>
                      <Badge status={o.status} />
                    </td>
                    <td>
                      <button
                        className="cw-link"
                        onClick={() => {
                          close();
                          setSelectedId(o.id);
                        }}
                        aria-label={"View order " + o.id}
                      >
                        View order
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty title={orders.length ? "No matching orders" : "No transactions yet"}>
            <p>
              {orders.length
                ? "Adjust the filters to find an order."
                : "Add credit to start using models."}
            </p>
            <button
              className="cw-button"
              onClick={
                orders.length
                  ? () => {
                      setQuery("");
                      setStatus("all");
                      setMethod("all");
                      setPeriod("All");
                    }
                  : onAddCredit
              }
            >
              {orders.length ? "Clear filters" : "Add credit"}
            </button>
          </Empty>
        )}
      </section>
      <section className="cw-panel">
        <div className="cj-panel-head">
          <h2>Automatic top-up</h2>
          <span className="cw-badge">Provider connection required</span>
        </div>
        <p className="cw-note">
          Save your preferred rules. Automatic payments stay inactive until a payment provider is
          connected.
        </p>
        <form
          className="cw-form cj-topup"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            const low = Math.round(Number(f.get("threshold")) * 100),
              amount = Math.round(Number(f.get("amount")) * 100),
              limit = Math.round(Number(f.get("monthly")) * 100);
            if (
              ![low, amount, limit].every(Number.isSafeInteger) ||
              low < 0 ||
              amount < 100 ||
              limit < amount
            ) {
              setSaved("Monthly cap must cover at least one top-up.");
              return;
            }
            updateSettings({
              autoTopup: f.has("enabled"),
              lowBalanceCents: low,
              autoTopupCents: amount,
              autoTopupLimitCents: limit,
            });
            setSaved("Rules saved. Automatic payments remain inactive.");
          }}
        >
          <label className="cw-checkbox">
            <input name="enabled" type="checkbox" defaultChecked={data.settings.autoTopup} />
            Enable when payment provider is connected
          </label>
          <div className="cj-three-fields">
            <label>
              When balance is below · USD
              <input
                required
                name="threshold"
                type="number"
                min="0"
                step=".01"
                max="100000"
                defaultValue={data.settings.lowBalanceCents / 100}
              />
            </label>
            <label>
              Add credit · USD
              <input
                required
                name="amount"
                type="number"
                min="1"
                step=".01"
                max="100000"
                defaultValue={data.settings.autoTopupCents / 100}
              />
            </label>
            <label>
              Monthly cap · USD
              <input
                required
                name="monthly"
                type="number"
                min="1"
                step=".01"
                max="1000000"
                defaultValue={data.settings.autoTopupLimitCents / 100}
              />
            </label>
          </div>
          <div className="cw-form-actions">
            <button className="cw-button" type="submit">
              Save rules
            </button>
            <span className="cw-feedback" role="status">
              {saved}
            </span>
          </div>
        </form>
      </section>
      {selected && (
        <Modal title="Order details" onClose={close}>
          <div className="cj-panel-head">
            <strong>{selected.id}</strong>
            <Badge status={selected.status} />
          </div>
          <div className="cj-order-status">
            <strong>
              {
                {
                  awaiting_payment: "Complete your payment",
                  confirming: "Payment is confirming",
                  needs_review: "Payment is under review",
                  credited: "Credit is available",
                  failed: "Payment could not be confirmed",
                  cancelled: "Payment cancelled",
                  expired: "Payment window expired",
                  refund_requested: "Refund request received",
                  refunded: "Refund recorded",
                }[selected.status]
              }
            </strong>
            <p>
              {
                {
                  awaiting_payment: "Your order is saved. Credit has not been added yet.",
                  confirming:
                    "Keep your transaction reference. Credit will update after confirmation.",
                  needs_review:
                    "Finance is reviewing your payment reference. No further payment is needed while this is reviewed.",
                  credited: "Your workspace balance has been updated. You can start using models.",
                  failed: "No credit was added. Check the payment details before trying again.",
                  cancelled: "This order will not add credit to your workspace.",
                  expired: "The payment window has expired. Create a new order to try again.",
                  refund_requested: "Finance will review your request and available credit.",
                  refunded: "The refund decision has been recorded in your billing history.",
                }[selected.status]
              }
            </p>
          </div>
          <dl>
            {[
              ["Created", date(selected.createdAt)],
              ["Payment method", selected.method],
              ["Wallet", selected.wallet ?? "—"],
              [
                "Network / currency",
                [selected.network, selected.currency].filter(Boolean).join(" / ") || "USD",
              ],
              ["Reference", selected.reference ?? "Not received"],
              ["Credited", selected.creditedAt ? date(selected.creditedAt) : "Not yet"],
              [
                "Model",
                selected.modelId
                  ? (data.pricing.find((m) => m.id === selected.modelId)?.name ?? selected.modelId)
                  : "All models",
              ],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <div className="cj-cost-line">
            <span>Credit</span>
            <strong>{money(selected.amountCents / 100)}</strong>
          </div>
          <div className="cj-cost-line">
            <span>Service fee</span>
            <strong>{money(selected.feeCents / 100)}</strong>
          </div>
          <div className="cj-cost-line cj-cost-total">
            <span>Total</span>
            <strong>{money((selected.amountCents + selected.feeCents) / 100)}</strong>
          </div>
          {selected.note && <p className="cw-note">{selected.note}</p>}
          <div className="cw-form-actions">
            {selected.creditedAt && (
              <button className="cw-button" onClick={() => receipt(selected, user.email)}>
                <ArrowDownToLine size={15} />
                Download receipt
              </button>
            )}
            {selected.status === "credited" && (
              <>
                <a className="cw-button cw-primary" href="#/console/keys" onClick={close}>
                  Use your credit <ArrowRight size={15} />
                </a>
                <button className="cw-button" onClick={() => setRefund(true)}>
                  Request a refund
                </button>
              </>
            )}
            {["failed", "cancelled", "expired"].includes(selected.status) && (
              <button
                className="cw-button cw-primary"
                onClick={() => {
                  close();
                  onAddCredit();
                }}
              >
                Try another payment
              </button>
            )}
          </div>
          {refund && selected.status === "credited" && (
            <form
              className="cw-form cj-refund"
              onSubmit={(e) => {
                e.preventDefault();
                if (!note.trim()) {
                  setError("Tell us why you are requesting a refund.");
                  return;
                }
                try {
                  requestRefund(selected.id, note.trim());
                  setRefund(false);
                  setNote("");
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Request could not be saved.");
                }
              }}
            >
              <label>
                Refund request
                <textarea
                  rows={3}
                  required
                  maxLength={1000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Tell us what happened."
                />
              </label>
              <p className="cw-note">
                Submitting a request does not initiate a payment. Refunds are reviewed by Finance.
              </p>
              {error && <p role="alert">{error}</p>}
              <div className="cw-form-actions">
                <button className="cw-button" type="submit">
                  Submit request
                </button>
                <button className="cw-button" type="button" onClick={() => setRefund(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
