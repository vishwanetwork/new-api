import { useSyncExternalStore } from "react";

export type PaymentStatus =
  | "awaiting_payment"
  | "confirming"
  | "needs_review"
  | "credited"
  | "failed"
  | "cancelled"
  | "expired"
  | "refund_requested"
  | "refunded";
export type PaymentMethod = "Fiat" | "Crypto";
export type StaffRole = "Finance" | "Support" | "Analyst";
export type Customer = {
  id: string;
  name: string;
  email: string;
  company: string;
  joinedAt: string;
  source: string;
  status: "active" | "suspended";
  balanceMicros: number;
  lastActive: string;
};
export type PaymentOrder = {
  id: string;
  userId: string;
  amountCents: number;
  feeCents: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  modelId?: string;
  wallet?: string;
  network?: string;
  currency?: string;
  reference?: string;
  receivedCents?: number;
  note?: string;
  reviewedBy?: string;
  creditedAt?: string;
  reconciliation: "unmatched" | "matched" | "exception";
};
export type ApiKey = {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed?: string;
  expires: string;
  budgetCents: number | null;
  models: string[];
  enabled: boolean;
};
export type Usage = {
  id: string;
  userId: string;
  keyId: string;
  modelId: string;
  at: string;
  input: number;
  output: number;
  inputRate: number;
  outputRate: number;
  costMicros: number;
  latency: number;
  status: "success" | "failed" | "cancelled";
  error?: string;
};
export type AuditEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  note: string;
};
export type Pricing = {
  id: string;
  name: string;
  provider: string;
  inputRate: number;
  outputRate: number;
  status: "available" | "paused";
  ratesConfigured?: boolean;
  modality?: "text" | "video";
};
export type CommerceState = {
  version: 1;
  currentUserId: string;
  users: Customer[];
  orders: PaymentOrder[];
  keys: ApiKey[];
  usage: Usage[];
  audit: AuditEvent[];
  pricing: Pricing[];
  settings: {
    serviceFeePercent: number;
    lowBalanceCents: number;
    autoTopup: boolean;
    autoTopupCents: number;
    autoTopupLimitCents: number;
    emailAlerts: boolean;
    staffRole: StaffRole;
  };
};

export const pricingCatalog: Pricing[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    inputRate: 2.5,
    outputRate: 5,
    status: "available",
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    inputRate: 3,
    outputRate: 9,
    status: "available",
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    inputRate: 2.2,
    outputRate: 6.6,
    status: "available",
  },
  {
    id: "deepseek-chat",
    name: "DeepSeek Chat",
    provider: "DeepSeek",
    inputRate: 0.5,
    outputRate: 1,
    status: "available",
  },
  {
    id: "qwen3-coder",
    name: "Qwen3 Coder",
    provider: "Qwen",
    inputRate: 0.6,
    outputRate: 1.2,
    status: "available",
  },
  {
    id: "mistral-large-latest",
    name: "Mistral Large",
    provider: "Mistral",
    inputRate: 0.8,
    outputRate: 2.4,
    status: "available",
  },
  {
    id: "dreamina-seedance-2-0-260128",
    name: "Seedance 2.0",
    provider: "ByteDance Seed",
    inputRate: 0,
    outputRate: 0,
    ratesConfigured: false,
    modality: "video",
    status: "paused",
  },
  {
    id: "MiniMax-M2.7",
    name: "MiniMax M2.7",
    provider: "MiniMax",
    inputRate: 0,
    outputRate: 0,
    ratesConfigured: false,
    modality: "text",
    status: "paused",
  },
  {
    id: "kimi-k3.1-pro",
    name: "Kimi K3.1 Pro",
    provider: "Kimi",
    inputRate: 0,
    outputRate: 0,
    ratesConfigured: false,
    modality: "text",
    status: "paused",
  },
];
export const money = (value: number, digits = 2) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
export const statusLabel = (value: string) =>
  value.replaceAll("_", " ").replace(/^./, (s) => s.toUpperCase());
const now = () => new Date().toISOString();
const uid = (prefix: string) => prefix + "-" + crypto.randomUUID().slice(0, 8).toUpperCase();
const ago = (days: number, hours = 12) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  date.setUTCHours(hours, 0, 0, 0);
  return date.toISOString();
};
const storageKey = "vishwa-commerce-ops:v1";

// Synthetic design records are isolated from the original Site and all live services.
function initialState(): CommerceState {
  const people = [
    ["Alex Morgan", "Lumen Studio", "Direct"],
    ["Jamie Chen", "Kite AI", "Referral"],
    ["Sam Rivera", "Northstar", "Organic"],
    ["Taylor Brooks", "Forma", "Direct"],
    ["Casey Park", "Orbit", "Partner"],
    ["Jordan Lee", "Canvas", "Organic"],
    ["Robin Ellis", "Atlas", "Referral"],
    ["Drew Patel", "Arc", "Organic"],
    ["Avery Kim", "Helix", "Partner"],
    ["Morgan Reed", "Field", "Direct"],
    ["Blair Wang", "Signal", "Organic"],
    ["Riley Cruz", "Parallel", "Referral"],
  ];
  const users: Customer[] = people.map(([name, company, source], i) => ({
    id: "usr-" + (i + 1),
    name,
    company,
    source,
    email: name.toLowerCase().replaceAll(" ", ".") + "@example.com",
    joinedAt: ago(i * 3 + 1),
    lastActive: ago(i % 5),
    status: "active",
    balanceMicros: i === 0 ? 0 : (i * 8 + 12) * 1_000_000,
  }));
  const orders: PaymentOrder[] = [
    {
      id: "ORD-1048",
      userId: "usr-1",
      amountCents: 5000,
      feeCents: 0,
      method: "Crypto",
      status: "needs_review",
      createdAt: ago(0, 9),
      updatedAt: ago(0, 10),
      wallet: "MetaMask",
      network: "Base",
      currency: "USDC",
      reference: "REF-LOCAL-1048",
      note: "Receipt submitted. Awaiting finance review.",
      reconciliation: "unmatched",
    },
    ...[2, 3, 4, 5, 6, 7, 8, 9].map((n, i): PaymentOrder => ({
      id: "ORD-" + (1048 - n),
      userId: "usr-" + n,
      amountCents: [10000, 25000, 5000, 10000, 50000, 2500, 7500, 20000][i],
      feeCents: 0,
      method: i % 2 ? "Fiat" : "Crypto",
      status:
        i === 1 ? "confirming" : i === 3 ? "failed" : i === 5 ? "refund_requested" : "credited",
      createdAt: ago(i * 2 + 1),
      updatedAt: ago(i * 2 + 1),
      reference: "REF-LOCAL-" + (1048 - n),
      network: i % 2 ? undefined : "Base",
      currency: i % 2 ? "USD" : "USDC",
      reconciliation: i === 0 ? "exception" : i === 1 ? "unmatched" : "matched",
    })),
  ];
  const usage: Usage[] = Array.from({ length: 48 }, (_, i) => {
    const m = pricingCatalog[i % 6],
      input = 650 + i * 113,
      output = 110 + i * 27;
    return {
      id: "REQ-" + (8100 + i),
      userId: "usr-" + ((i % 10) + 2),
      keyId: "key-seed",
      modelId: m.id,
      at: ago(i % 28),
      input,
      output,
      inputRate: m.inputRate,
      outputRate: m.outputRate,
      costMicros: Math.round(input * m.inputRate + output * m.outputRate),
      latency: 540 + i * 31,
      status: "success",
    };
  });
  return {
    version: 1,
    currentUserId: "usr-1",
    users,
    orders,
    keys: [],
    usage,
    pricing: pricingCatalog.map((item) => ({ ...item })),
    audit: [],
    settings: {
      serviceFeePercent: 0,
      lowBalanceCents: 1000,
      autoTopup: false,
      autoTopupCents: 5000,
      autoTopupLimitCents: 20000,
      emailAlerts: true,
      staffRole: "Finance",
    },
  };
}
// Add new catalog entries without resetting existing balances, orders, or edited rates.
function mergePricingCatalog(data: CommerceState): CommerceState {
  const existing = new Set(data.pricing.map((item) => item.id));
  const missing = pricingCatalog.filter((item) => !existing.has(item.id));
  return missing.length
    ? { ...data, pricing: [...data.pricing, ...missing.map((item) => ({ ...item }))] }
    : data;
}
let state: CommerceState;
try {
  const raw = localStorage.getItem(storageKey);
  const parsed = raw ? JSON.parse(raw) : null;
  state =
    parsed?.version === 1 &&
    Array.isArray(parsed.users) &&
    Array.isArray(parsed.orders) &&
    Array.isArray(parsed.pricing)
      ? parsed
      : initialState();
} catch {
  state = initialState();
}
state = mergePricingCatalog(state);
try {
  localStorage.setItem(storageKey, JSON.stringify(state));
} catch {}
const listeners = new Set<() => void>();
function emit(next: CommerceState) {
  state = next;
  try {
    localStorage.setItem(storageKey, JSON.stringify(next));
  } catch {}
  listeners.forEach((fn) => fn());
}
function change(fn: (draft: CommerceState) => void) {
  const next = structuredClone(state);
  fn(next);
  emit(next);
}
function audit(draft: CommerceState, actor: string, action: string, target: string, note: string) {
  draft.audit.unshift({ id: uid("EVT"), at: now(), actor, action, target, note });
}
window.addEventListener("storage", (event) => {
  if (event.key !== storageKey || !event.newValue) return;
  try {
    const next = JSON.parse(event.newValue);
    if (next.version === 1 && Array.isArray(next.pricing)) {
      state = mergePricingCatalog(next);
      listeners.forEach((fn) => fn());
    }
  } catch {}
});
export const getCommerce = () => state;
export function useCommerce() {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    getCommerce,
    getCommerce,
  );
}
export const currentCustomer = (data = state) =>
  data.users.find((user) => user.id === data.currentUserId)!;

export function createOrder(
  amountCents: number,
  method: PaymentMethod,
  extra: Partial<Pick<PaymentOrder, "modelId" | "wallet" | "network" | "currency">> = {},
) {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0)
    throw new Error("Enter a valid amount.");
  const order: PaymentOrder = {
    id: uid("ORD"),
    userId: state.currentUserId,
    amountCents,
    feeCents: Math.round((amountCents * state.settings.serviceFeePercent) / 100),
    method,
    status: "awaiting_payment",
    createdAt: now(),
    updatedAt: now(),
    reconciliation: "unmatched",
    ...extra,
  };
  change((d) => {
    d.orders.unshift(order);
    audit(d, "Customer", "Order created", order.id, method + " · " + money(amountCents / 100));
  });
  return order.id;
}
export function updateOrder(
  id: string,
  patch: Partial<
    Pick<
      PaymentOrder,
      "status" | "wallet" | "network" | "currency" | "reference" | "note" | "reconciliation"
    >
  >,
) {
  change((d) => {
    const o = d.orders.find((o) => o.id === id);
    if (!o) throw new Error("Order not found.");
    if (["credited", "refunded"].includes(o.status))
      throw new Error("Settled orders cannot be edited.");
    if (patch.status === "credited" || patch.status === "refunded")
      throw new Error("Use the finance review action.");
    Object.assign(o, patch, { updatedAt: now() });
  });
}
export function reviewPayment(
  id: string,
  decision: "approve" | "reject",
  reference: string,
  note: string,
  receivedCents?: number,
) {
  if (state.settings.staffRole !== "Finance") throw new Error("Finance access is required.");
  if (!reference.trim() || !note.trim())
    throw new Error("Add a transaction reference and review note.");
  if (decision === "approve" && (!Number.isSafeInteger(receivedCents) || receivedCents! < 0))
    throw new Error("Record the amount received.");
  change((d) => {
    const o = d.orders.find((o) => o.id === id);
    if (!o || !["needs_review", "confirming", "awaiting_payment"].includes(o.status))
      throw new Error("This order is no longer awaiting review.");
    const user = d.users.find((u) => u.id === o.userId);
    if (!user) throw new Error("Customer not found.");
    if (decision === "approve" && receivedCents !== o.amountCents + o.feeCents)
      throw new Error(
        "Received amount does not match the order total. Resolve the discrepancy first.",
      );
    o.receivedCents = receivedCents;
    o.reference = reference;
    o.note = note;
    o.updatedAt = now();
    o.reviewedBy = "Finance";
    o.status = decision === "approve" ? "credited" : "failed";
    if (decision === "approve") {
      user.balanceMicros += o.amountCents * 10000;
      o.creditedAt = now();
      o.reconciliation = "matched";
    }
    audit(
      d,
      "Finance",
      decision === "approve" ? "Payment confirmed" : "Payment rejected",
      id,
      note,
    );
  });
}
export function reconcileOrder(
  id: string,
  result: "matched" | "exception",
  note: string,
  receivedCents?: number | null,
) {
  if (state.settings.staffRole !== "Finance") throw new Error("Finance access is required.");
  if (!note.trim()) throw new Error("Add a reconciliation note.");
  change((d) => {
    const o = d.orders.find((o) => o.id === id);
    if (!o) throw new Error("Order not found.");
    if (receivedCents != null) {
      if (!Number.isSafeInteger(receivedCents) || receivedCents < 0)
        throw new Error("Enter a valid received amount.");
      o.receivedCents = receivedCents;
    }
    if (result === "matched" && o.receivedCents !== o.amountCents + o.feeCents)
      throw new Error("Received amount must match the order total.");
    o.reconciliation = result;
    o.note = note;
    audit(d, "Finance", "Reconciliation " + result, id, note);
  });
}
export function requestRefund(id: string, note: string) {
  change((d) => {
    const o = d.orders.find((o) => o.id === id);
    if (!o || o.status !== "credited")
      throw new Error("Only credited orders can be reviewed for a refund.");
    o.status = "refund_requested";
    o.note = note;
    o.updatedAt = now();
    audit(d, "Customer", "Refund requested", id, note);
  });
}
export function resolveRefund(id: string, approve: boolean, note: string) {
  if (state.settings.staffRole !== "Finance") throw new Error("Finance access is required.");
  if (!note.trim()) throw new Error("Add a review note.");
  change((d) => {
    const o = d.orders.find((o) => o.id === id);
    if (!o || o.status !== "refund_requested") throw new Error("Refund is not awaiting review.");
    const u = d.users.find((u) => u.id === o.userId)!;
    if (approve && u.balanceMicros < o.amountCents * 10000)
      throw new Error("Available credit is less than the requested refund.");
    if (approve) u.balanceMicros -= o.amountCents * 10000;
    o.status = approve ? "refunded" : "credited";
    o.note = note;
    o.updatedAt = now();
    audit(d, "Finance", approve ? "Refund recorded" : "Refund declined", id, note);
  });
}
export function createApiKey(data: Pick<ApiKey, "name" | "expires" | "budgetCents" | "models">) {
  const key: ApiKey = {
    ...data,
    id: uid("KEY"),
    userId: state.currentUserId,
    prefix: "vg_local_" + crypto.randomUUID().slice(0, 6),
    createdAt: now(),
    enabled: true,
  };
  const secret = key.prefix + "_" + crypto.randomUUID().replaceAll("-", "");
  change((d) => {
    d.keys.unshift(key);
    audit(d, "Customer", "Key created", key.id, key.name);
  });
  return { key, secret };
}
export function updateApiKey(
  id: string,
  patch: Partial<Pick<ApiKey, "name" | "expires" | "budgetCents" | "models" | "enabled">>,
) {
  change((d) => {
    const k = d.keys.find((k) => k.id === id && k.userId === d.currentUserId);
    if (k) {
      Object.assign(k, patch);
      audit(d, "Customer", "Key updated", id, k.name);
    }
  });
}
export function runLocalRequest(
  modelId: string,
  keyId: string,
  prompt: string,
  maxOutput: number,
): { text: string; usage: Usage } {
  const user = currentCustomer(),
    key = state.keys.find((k) => k.id === keyId && k.userId === user.id),
    model = state.pricing.find((m) => m.id === modelId);
  if (user.status !== "active") throw new Error("This account is suspended. Contact support.");
  if (!key?.enabled) throw new Error("Choose an active API key.");
  if (key.expires && new Date(key.expires + "T23:59:59Z").getTime() < Date.now())
    throw new Error("This API key has expired.");
  if (!model || model.status !== "available" || model.ratesConfigured === false)
    throw new Error("This model is unavailable until gateway pricing is configured.");
  if (model.modality === "video")
    throw new Error(
      "Video generation requires an asynchronous video endpoint, not the chat playground.",
    );
  if (key.models.length && !key.models.includes(modelId))
    throw new Error("This model is not allowed by the API key.");
  if (!prompt.trim()) throw new Error("Enter a prompt.");
  const text =
    "Your request is ready. Vishwa routes a single API request to " +
    model.name +
    " and reports input tokens, output tokens, and cost in one workspace. Connect the inference service to receive live model responses.";
  const input = Math.ceil(prompt.length / 4) + 28,
    output = Math.min(Math.ceil(text.length / 4), maxOutput),
    costMicros = Math.round(input * model.inputRate + output * model.outputRate);
  if (user.balanceMicros < costMicros)
    throw new Error("Insufficient credit. Add credit to continue.");
  const spent = state.usage
    .filter((r) => r.keyId === keyId && r.at.slice(0, 7) === now().slice(0, 7))
    .reduce((s, r) => s + r.costMicros, 0);
  if (key.budgetCents !== null && spent + costMicros > key.budgetCents * 10000)
    throw new Error("This API key has reached its monthly budget.");
  const usage: Usage = {
    id: uid("REQ"),
    userId: user.id,
    keyId,
    modelId,
    at: now(),
    input,
    output,
    inputRate: model.inputRate,
    outputRate: model.outputRate,
    costMicros,
    latency: 860,
    status: "success",
  };
  change((d) => {
    d.users.find((u) => u.id === user.id)!.balanceMicros -= costMicros;
    d.usage.unshift(usage);
    d.keys.find((k) => k.id === keyId)!.lastUsed = now();
    audit(d, "Customer", "Local request completed", usage.id, model.name);
  });
  return { text: text.slice(0, output * 4), usage };
}
export function updateSettings(patch: Partial<CommerceState["settings"]>) {
  if (patch.serviceFeePercent !== undefined) {
    if (state.settings.staffRole !== "Finance") throw new Error("Finance access is required.");
    if (
      !Number.isFinite(patch.serviceFeePercent) ||
      patch.serviceFeePercent < 0 ||
      patch.serviceFeePercent > 100
    )
      throw new Error("Enter a fee between 0 and 100%.");
  }
  change((d) => {
    Object.assign(d.settings, patch);
    if (patch.serviceFeePercent !== undefined)
      audit(d, "Finance", "Service fee updated", "settings", patch.serviceFeePercent + "%");
  });
}
export function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, "status" | "name" | "company">>,
) {
  if (state.settings.staffRole === "Analyst") throw new Error("Read-only access.");
  change((d) => {
    const u = d.users.find((u) => u.id === id);
    if (u) {
      Object.assign(u, patch);
      audit(d, state.settings.staffRole, "Customer updated", id, JSON.stringify(patch));
    }
  });
}
export function updatePricing(
  id: string,
  patch: Partial<Pick<Pricing, "inputRate" | "outputRate" | "status">>,
) {
  if (state.settings.staffRole !== "Finance") throw new Error("Finance access is required.");
  if (
    (patch.inputRate !== undefined && (!Number.isFinite(patch.inputRate) || patch.inputRate < 0)) ||
    (patch.outputRate !== undefined && (!Number.isFinite(patch.outputRate) || patch.outputRate < 0))
  )
    throw new Error("Rates must be non-negative.");
  change((d) => {
    const m = d.pricing.find((m) => m.id === id);
    if (m) {
      if ((m.ratesConfigured === false || m.modality === "video") && patch.status === "available")
        throw new Error(
          "Configure model pricing and its gateway integration before making it available.",
        );
      Object.assign(m, patch);
      audit(d, "Finance", "Model pricing updated", id, JSON.stringify(patch));
    }
  });
}
export function downloadCsv(name: string, rows: (string | number)[][]) {
  const blob = new Blob(
    [
      rows
        .map((r) => r.map((v) => '"' + String(v).replaceAll('"', '""') + '"').join(","))
        .join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
