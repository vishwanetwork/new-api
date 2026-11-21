import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  CircleAlert,
  Clock3,
  CreditCard,
  ExternalLink,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import type { Offer } from "./Models";
import {
  createOrder,
  currentCustomer,
  money,
  statusLabel,
  updateOrder,
  useCommerce,
  type PaymentStatus,
} from "./commerce";
import "./checkout.css";

export type Order = { kind: "credit" } | { kind: "model"; offer: Offer };
type Network = "Base" | "Ethereum" | "Solana";
type Currency = "USDC" | "USDT";
type Step = "amount" | "wallet" | "network" | "payment";
// Connector slots only. No wallet is requested or connected by these controls.
export const walletOptions: {
  id: string;
  name: string;
  mark: string;
  tone: string;
  networks: Network[];
}[] = [
  { id: "metamask", name: "MetaMask", mark: "M", tone: "orange", networks: ["Base", "Ethereum"] },
  { id: "phantom", name: "Phantom", mark: "P", tone: "purple", networks: ["Solana"] },
  { id: "jupiter", name: "Jupiter", mark: "J", tone: "green", networks: ["Solana"] },
  {
    id: "binance",
    name: "Binance Wallet",
    mark: "B",
    tone: "gold",
    networks: ["Base", "Ethereum", "Solana"],
  },
  {
    id: "okx",
    name: "OKX Wallet",
    mark: "OK",
    tone: "neutral",
    networks: ["Base", "Ethereum", "Solana"],
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    mark: "B",
    tone: "cyan",
    networks: ["Base", "Ethereum", "Solana"],
  },
];
const currencies: Record<Network, Currency[]> = {
  Base: ["USDC"],
  Ethereum: ["USDC", "USDT"],
  Solana: ["USDC", "USDT"],
};
const statusCopy: Record<PaymentStatus, { title: string; message: string }> = {
  awaiting_payment: {
    title: "Awaiting payment",
    message: "Your order is saved. Payment service connection is required to collect funds.",
  },
  confirming: {
    title: "Confirming payment",
    message:
      "Payment verification is in progress. Credit becomes available after finance confirms this order.",
  },
  needs_review: {
    title: "Under review",
    message:
      "Your reference has been sent for review. This page updates when finance records a decision.",
  },
  credited: {
    title: "Credit added",
    message: "Your credit is ready to use across the model catalog.",
  },
  failed: {
    title: "Payment failed",
    message: "No credit was added for this order. Retry to create a fresh payment order.",
  },
  cancelled: {
    title: "Order cancelled",
    message: "This order is closed. You can start again with the same amount.",
  },
  expired: {
    title: "Order expired",
    message: "The checkout window has ended. Create a new order to continue.",
  },
  refund_requested: {
    title: "Refund under review",
    message: "Finance is reviewing your refund request.",
  },
  refunded: {
    title: "Refund recorded",
    message: "The order credit has been returned and your balance updated.",
  },
};
const LOCAL_ORDER_WINDOW_MS = 30 * 60 * 1000;
const terminal = ["credited", "refunded", "refund_requested"];
const canRetry = ["failed", "cancelled", "expired"];

export function Checkout({ order, onClose }: { order: Order; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const data = useCommerce();
  const customer = currentCustomer(data);
  const initialAmount = order.kind === "model" ? order.offer.price : 25;
  const [preset, setPreset] = useState<number | null>(
    [10, 25, 50, 100].includes(initialAmount) ? initialAmount : null,
  );
  const [custom, setCustom] = useState(
    [10, 25, 50, 100].includes(initialAmount) ? "" : String(initialAmount),
  );
  const [method, setMethod] = useState<"Fiat" | "Crypto">("Fiat");
  const [step, setStep] = useState<Step>("amount");
  const [walletId, setWalletId] = useState<string | null>(null);
  const [network, setNetwork] = useState<Network>("Base");
  const [currency, setCurrency] = useState<Currency>("USDC");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(Date.now());
  const savedOrder = data.orders.find((item) => item.id === orderId);
  const wallet = walletOptions.find((item) => item.id === walletId);
  const amount = preset ?? Number(custom);
  const validAmount =
    Number.isFinite(amount) &&
    amount >= 1 &&
    amount <= 100000 &&
    (preset !== null || /^\d+(?:\.\d{1,2})?$/.test(custom));
  const amountCents = Math.round(amount * 100);
  const feeCents =
    savedOrder?.feeCents ?? Math.round((amountCents * data.settings.serviceFeePercent) / 100);
  const creditCents = savedOrder?.amountCents ?? amountCents;
  const totalCents = creditCents + feeCents;
  const remainingSeconds = savedOrder
    ? Math.max(
        0,
        Math.ceil(
          (new Date(savedOrder.createdAt).getTime() + LOCAL_ORDER_WINDOW_MS - clock) / 1000,
        ),
      )
    : 0;
  const steps =
    method === "Crypto" ? ["Credit", "Wallet", "Network", "Payment"] : ["Credit", "Payment"];
  const activeIndex =
    step === "amount" ? 0 : step === "wallet" ? 1 : step === "network" ? 2 : steps.length - 1;
  const currentStatus = savedOrder?.status ?? "awaiting_payment";
  const status = statusCopy[currentStatus];

  useEffect(() => {
    dialog.current?.showModal();
  }, []);
  useEffect(() => {
    heading.current?.focus();
    setError("");
  }, [step]);
  useEffect(() => {
    if (!savedOrder || savedOrder.status !== "awaiting_payment") return;
    const tick = () => setClock(Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [savedOrder?.id, savedOrder?.status]);
  useEffect(() => {
    if (savedOrder?.status === "awaiting_payment" && remainingSeconds === 0) {
      try {
        updateOrder(savedOrder.id, { status: "expired", note: "Local checkout window expired." });
      } catch {
        /* A finance update may already have settled it. */
      }
    }
  }, [savedOrder?.id, savedOrder?.status, remainingSeconds]);

  function createPayment() {
    if (!validAmount) {
      setError("Enter an amount from $1 to $100,000 with up to two decimals.");
      return;
    }
    if (
      method === "Crypto" &&
      (!wallet || !wallet.networks.includes(network) || !currencies[network].includes(currency))
    ) {
      setError("Choose a supported wallet, network, and token.");
      return;
    }
    try {
      if (savedOrder && !terminal.includes(savedOrder.status) && savedOrder.status !== "cancelled")
        updateOrder(savedOrder.id, {
          status: "cancelled",
          note: "Replaced with a new checkout order.",
        });
      const id = createOrder(amountCents, method, {
        ...(order.kind === "model" ? { modelId: order.offer.id } : {}),
        ...(method === "Crypto"
          ? { wallet: wallet!.name, network, currency }
          : { currency: "USD" }),
      });
      setOrderId(id);
      setReference("");
      setClock(Date.now());
      setStep("payment");
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create this order.");
    }
  }
  function goBack() {
    if (step === "wallet") setStep("amount");
    if (step === "network") setStep("wallet");
    if (step === "payment" && savedOrder?.status === "awaiting_payment") {
      try {
        updateOrder(savedOrder.id, {
          status: "cancelled",
          note: "Customer returned to checkout settings.",
        });
        setOrderId(null);
        setStep(method === "Crypto" ? "network" : "amount");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not edit the order.");
      }
    }
  }
  function selectWallet(id: string) {
    const selected = walletOptions.find((item) => item.id === id)!;
    setWalletId(id);
    if (!selected.networks.includes(network)) {
      setNetwork(selected.networks[0]);
      setCurrency("USDC");
    }
  }
  function recordState(next: PaymentStatus) {
    if (!savedOrder) return;
    try {
      updateOrder(savedOrder.id, {
        status: next,
        note: "Local review state: " + statusLabel(next),
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update this order.");
    }
  }
  function submitReference(event: React.FormEvent) {
    event.preventDefault();
    if (!savedOrder) return;
    if (reference.trim().length < 4 || reference.trim().length > 160) {
      setError("Enter a payment reference between 4 and 160 characters.");
      return;
    }
    try {
      updateOrder(savedOrder.id, {
        reference: reference.trim(),
        status: "needs_review",
        note: "Customer submitted a reference for finance review.",
      });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit the reference.");
    }
  }
  function goTo(hash: string) {
    location.hash = hash;
    onClose();
  }

  return (
    <dialog
      className="co-checkout"
      ref={dialog}
      aria-labelledby="checkout-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="co-header">
        <div className="co-header-label">
          <LockKeyhole size={17} /> Checkout
        </div>
        <button
          type="button"
          className="co-icon-button"
          aria-label="Close checkout"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </header>
      <div className="co-layout">
        <aside className="co-summary" aria-label="Order summary">
          <div className="co-summary-icon">
            <Wallet size={23} />
          </div>
          <h3>Workspace credit</h3>
          <p>One balance. Every model.</p>
          <div className="co-credit-value">
            {validAmount ? money(creditCents / 100) : "—"}
            <span>Credit to add</span>
          </div>
          {order.kind === "model" && (
            <div className="co-model-context">
              <span>Continue with</span>
              <strong>{order.offer.name}</strong>
              <span>{order.offer.provider}</span>
            </div>
          )}
          <dl className="co-breakdown">
            <div>
              <dt>Credit</dt>
              <dd>{validAmount ? money(creditCents / 100) : "—"}</dd>
            </div>
            <div>
              <dt>
                Service fee{" "}
                {data.settings.serviceFeePercent > 0
                  ? "(" + data.settings.serviceFeePercent + "%)"
                  : ""}
              </dt>
              <dd>{validAmount ? money(feeCents / 100) : "—"}</dd>
            </div>
            <div className="co-total">
              <dt>Total</dt>
              <dd>{validAmount ? money(totalCents / 100) : "—"}</dd>
            </div>
          </dl>
          <div className="co-balance">
            <span>Available balance</span>
            <strong>{money(customer.balanceMicros / 1_000_000)}</strong>
          </div>
          {savedOrder && (
            <div className="co-order-id">
              <span>Order</span>
              <code>{savedOrder.id}</code>
            </div>
          )}
        </aside>
        <div className="co-main">
          <ol className="co-progress" aria-label="Checkout progress">
            {steps.map((label, index) => (
              <li
                key={label}
                className={
                  index === activeIndex ? "is-current" : index < activeIndex ? "is-complete" : ""
                }
                aria-current={index === activeIndex ? "step" : undefined}
              >
                <span>{index < activeIndex ? <Check size={12} /> : index + 1}</span>
                {label}
              </li>
            ))}
          </ol>
          {step !== "amount" &&
            (step !== "payment" || savedOrder?.status === "awaiting_payment") && (
              <button type="button" className="co-back" onClick={goBack}>
                <ArrowLeft size={15} /> Back
              </button>
            )}
          <h2 id="checkout-title" ref={heading} tabIndex={-1}>
            {step === "amount"
              ? "Add credit"
              : step === "wallet"
                ? "Choose your wallet"
                : step === "network"
                  ? "Choose a network"
                  : status.title}
          </h2>

          {step === "amount" && (
            <>
              <fieldset className="co-fieldset">
                <legend>Amount</legend>
                <div className="co-amounts">
                  {[10, 25, 50, 100].map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={preset === value}
                      onClick={() => {
                        setPreset(value);
                        setCustom("");
                      }}
                    >
                      {money(value, 0)}
                    </button>
                  ))}
                </div>
                <label className="co-label" htmlFor="custom-credit">
                  Others <span>USD</span>
                </label>
                <div className={"co-custom-amount" + (preset === null ? " is-selected" : "")}>
                  <span>$</span>
                  <input
                    id="custom-credit"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="Enter amount"
                    value={custom}
                    onFocus={() => setPreset(null)}
                    onChange={(event) => {
                      setCustom(event.target.value);
                      setPreset(null);
                    }}
                    aria-invalid={preset === null && !!custom && !validAmount}
                    aria-describedby={
                      preset === null && !!custom && !validAmount ? "co-amount-error" : undefined
                    }
                  />
                </div>
                {preset === null && !!custom && !validAmount && (
                  <p className="co-error" id="co-amount-error">
                    Enter $1–$100,000 with up to two decimals.
                  </p>
                )}
              </fieldset>
              <fieldset className="co-fieldset">
                <legend>Payment method</legend>
                <div className="co-methods">
                  {(["Fiat", "Crypto"] as const).map((option) => (
                    <button
                      type="button"
                      key={option}
                      aria-pressed={method === option}
                      onClick={() => setMethod(option)}
                    >
                      {option === "Fiat" ? <CreditCard size={21} /> : <Wallet size={21} />}
                      <span>
                        <strong>{option}</strong>
                        <small>{option === "Fiat" ? "Card & bank" : "USDC & USDT"}</small>
                      </span>
                      {method === option && <Check size={17} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <button
                type="button"
                className="co-primary"
                disabled={!validAmount}
                onClick={() => (method === "Crypto" ? setStep("wallet") : createPayment())}
              >
                Proceed to Payment <ArrowRight size={17} />
              </button>
            </>
          )}

          {step === "wallet" && (
            <>
              <div className="co-wallets" role="group" aria-label="Wallet">
                {walletOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    aria-pressed={walletId === option.id}
                    onClick={() => selectWallet(option.id)}
                  >
                    <span className={"co-wallet-mark " + option.tone} aria-hidden="true">
                      {option.mark}
                    </span>
                    <span>{option.name}</span>
                    {walletId === option.id && <Check size={17} />}
                  </button>
                ))}
              </div>
              <p className="co-helper">
                Wallet connectors will be available when the payment service is connected.
              </p>
              <button
                type="button"
                className="co-primary"
                disabled={!wallet}
                onClick={() => setStep("network")}
              >
                Choose network <ArrowRight size={17} />
              </button>
            </>
          )}

          {step === "network" && (
            <>
              <div className="co-selected-wallet">
                <Wallet size={18} />
                {wallet?.name}
                <span>Selected</span>
              </div>
              <fieldset className="co-fieldset">
                <legend>Network</legend>
                <div className="co-networks">
                  {wallet?.networks.map((option) => (
                    <button
                      type="button"
                      key={option}
                      aria-pressed={network === option}
                      onClick={() => {
                        setNetwork(option);
                        if (!currencies[option].includes(currency)) setCurrency("USDC");
                      }}
                    >
                      <span className={"co-network-dot co-network-" + option.toLowerCase()} />
                      {option}
                      {network === option && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="co-fieldset">
                <legend>Token</legend>
                <div className="co-coins">
                  {currencies[network].map((option) => (
                    <button
                      type="button"
                      key={option}
                      aria-pressed={currency === option}
                      onClick={() => setCurrency(option)}
                    >
                      <span className={"co-coin " + option.toLowerCase()}>$</span>
                      {option}
                      {currency === option && <Check size={16} />}
                    </button>
                  ))}
                </div>
              </fieldset>
              <dl className="co-payment-facts">
                <div>
                  <dt>Charge currency</dt>
                  <dd>
                    {currency} on {network}
                  </dd>
                </div>
                <div>
                  <dt>Order total</dt>
                  <dd>{money(totalCents / 100)} USD</dd>
                </div>
                <div>
                  <dt>Token amount</dt>
                  <dd>Quoted at checkout</dd>
                </div>
                <div>
                  <dt>Network fee</dt>
                  <dd>Provided by wallet</dd>
                </div>
              </dl>
              <button type="button" className="co-primary" onClick={createPayment}>
                Continue <ArrowRight size={17} />
              </button>
            </>
          )}

          {step === "payment" && savedOrder && (
            <>
              <div className={"co-status-icon status-" + currentStatus}>
                {currentStatus === "credited" ? (
                  <CheckCircle2 size={27} />
                ) : canRetry.includes(currentStatus) ? (
                  <CircleAlert size={27} />
                ) : (
                  <Clock3 size={27} />
                )}
              </div>
              <p className="co-status-copy" role="status">
                {status.message}
              </p>
              {currentStatus === "awaiting_payment" && (
                <>
                  {method === "Fiat" ? (
                    <div className="co-handoff">
                      <ShieldCheck size={28} />
                      <strong>Secure hosted checkout</strong>
                      <span>Card details stay with the payment provider.</span>
                      <div className="co-connection">
                        <i />
                        Payment service offline
                      </div>
                      <button type="button" disabled>
                        Open secure checkout <ExternalLink size={15} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="co-crypto-route">
                        <span className={"co-wallet-mark " + wallet?.tone}>{wallet?.mark}</span>
                        <div>
                          <strong>{savedOrder.wallet}</strong>
                          <span>
                            {savedOrder.currency} · {savedOrder.network}
                          </span>
                        </div>
                        <span className="co-offline">Offline</span>
                      </div>
                      <dl className="co-payment-facts">
                        <div>
                          <dt>Destination</dt>
                          <dd>Assigned at checkout</dd>
                        </div>
                        <div>
                          <dt>Amount</dt>
                          <dd>Quoted at checkout</dd>
                        </div>
                        <div>
                          <dt>Network fee</dt>
                          <dd>Provided by wallet</dd>
                        </div>
                      </dl>
                    </>
                  )}
                  <div className="co-expiry">
                    <Clock3 size={15} />
                    <span>Local order window</span>
                    <strong>
                      {Math.floor(remainingSeconds / 60)}:
                      {String(remainingSeconds % 60).padStart(2, "0")}
                    </strong>
                  </div>
                  <form className="co-reference" onSubmit={submitReference}>
                    <label htmlFor="co-payment-reference">Payment reference</label>
                    <input
                      id="co-payment-reference"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="Transaction or receipt reference"
                      autoComplete="off"
                      maxLength={160}
                    />
                    <p>Submit a reference for manual finance review.</p>
                    <button
                      type="submit"
                      className="co-primary"
                      disabled={reference.trim().length < 4}
                    >
                      Submit payment reference <ArrowRight size={17} />
                    </button>
                  </form>
                  <button
                    type="button"
                    className="co-text-button"
                    onClick={() => recordState("cancelled")}
                  >
                    Cancel order
                  </button>
                </>
              )}
              {["needs_review", "confirming"].includes(currentStatus) && (
                <div className="co-tracking">
                  <div>
                    <CheckCircle2 size={18} />
                    <span>Order created</span>
                  </div>
                  <div className="is-current">
                    <Clock3 size={18} />
                    <span>Finance verification</span>
                  </div>
                  <div>
                    <span className="co-tracking-dot" />
                    <span>Credit available</span>
                  </div>
                  {savedOrder.reference && (
                    <dl>
                      <dt>Reference</dt>
                      <dd>{savedOrder.reference}</dd>
                    </dl>
                  )}
                  <button
                    type="button"
                    className="co-secondary"
                    onClick={() => goTo("/console/billing")}
                  >
                    View billing <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {currentStatus === "credited" && (
                <div className="co-success">
                  <div>
                    <span>Credit added</span>
                    <strong>{money(savedOrder.amountCents / 100)}</strong>
                  </div>
                  <div>
                    <span>Available balance</span>
                    <strong>{money(customer.balanceMicros / 1_000_000)}</strong>
                  </div>
                  <button
                    type="button"
                    className="co-primary"
                    onClick={() => goTo("/console/keys")}
                  >
                    Create API key <ArrowRight size={17} />
                  </button>
                  <button
                    type="button"
                    className="co-secondary"
                    onClick={() =>
                      goTo(
                        order.kind === "model"
                          ? "/console/playground?model=" + encodeURIComponent(order.offer.id)
                          : "/models",
                      )
                    }
                  >
                    {order.kind === "model" ? "Continue with " + order.offer.name : "Browse models"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              )}
              {canRetry.includes(currentStatus) && (
                <>
                  <div className="co-result-note">
                    {savedOrder.note || "This order was not credited."}
                  </div>
                  <button type="button" className="co-primary" onClick={createPayment}>
                    <RefreshCw size={17} /> Retry payment
                  </button>
                  <button
                    type="button"
                    className="co-text-button"
                    onClick={() => {
                      setStep("amount");
                      setOrderId(null);
                    }}
                  >
                    Change payment method
                  </button>
                </>
              )}
              {["refund_requested", "refunded"].includes(currentStatus) && (
                <button
                  type="button"
                  className="co-primary"
                  onClick={() => goTo("/console/billing")}
                >
                  View billing <ArrowRight size={17} />
                </button>
              )}
            </>
          )}
          {error && (
            <p className="co-error" role="alert">
              <CircleAlert size={16} />
              {error}
            </p>
          )}
          <p className="co-local-note">
            <LockKeyhole size={14} />
            No funds move in this workspace.
          </p>
        </div>
      </div>
    </dialog>
  );
}
