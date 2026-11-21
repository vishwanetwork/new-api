import type { CommerceState } from "../../src/commerce";

const browserEvents = new EventTarget();

// Only browser boundaries are substituted. Every action under test comes from
// the unchanged design store; these checks do not assert server-side security.
export async function createCommerceHarness() {
  const values = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return values.size;
    },
    key: (index) => [...values.keys()][index] ?? null,
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => {
      values.clear();
    },
  };
  const fixture: CommerceState = {
    version: 1,
    currentUserId: "customer-test",
    users: [
      {
        id: "customer-test",
        name: "Test Customer",
        email: "customer@example.com",
        company: "Test Workspace",
        joinedAt: "2026-01-01T00:00:00Z",
        lastActive: "2026-01-01T00:00:00Z",
        source: "Direct",
        status: "active",
        balanceMicros: 20_000_000,
      },
    ],
    orders: [],
    keys: [],
    usage: [],
    audit: [],
    pricing: [],
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
  storage.setItem("vishwa-commerce-ops:v1", JSON.stringify(fixture));
  const originalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: storage });
  Object.defineProperty(globalThis, "window", { configurable: true, value: browserEvents });
  const restore = () => {
    storage.clear();
    if (originalStorage) Object.defineProperty(globalThis, "localStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "localStorage");
    if (originalWindow) Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  };
  try {
    const commerce = await import("../../src/commerce");
    // Reset each case through the store's real cross-tab storage event path.
    // Bun caches modules even when import URLs have different query strings.
    const event = new Event("storage");
    Object.defineProperties(event, {
      key: { value: "vishwa-commerce-ops:v1" },
      newValue: { value: JSON.stringify(fixture) },
    });
    browserEvents.dispatchEvent(event);
    return { commerce, storage, restore };
  } catch (error) {
    restore();
    throw error;
  }
}
