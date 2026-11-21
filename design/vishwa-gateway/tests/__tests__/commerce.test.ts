import { afterEach, beforeEach, expect, test } from "bun:test";
import { createCommerceHarness } from "../setup/browser";

let harness: Awaited<ReturnType<typeof createCommerceHarness>>;
beforeEach(async () => {
  harness = await createCommerceHarness();
});
afterEach(() => {
  harness?.restore();
});

test("approving a matching payment credits its principal once, including when review is repeated", () => {
  const commerce = harness.commerce;
  commerce.updateSettings({ serviceFeePercent: 2 });
  const orderId = commerce.createOrder(5000, "Crypto");

  commerce.reviewPayment(orderId, "approve", "TEST-TXN-001", "Amount reconciled", 5100);

  expect(commerce.currentCustomer().balanceMicros).toBe(70_000_000);
  expect(commerce.getCommerce().orders.find((order) => order.id === orderId)?.status).toBe(
    "credited",
  );
  expect(() =>
    commerce.reviewPayment(orderId, "approve", "TEST-TXN-001", "Repeated review", 5100),
  ).toThrow("This order is no longer awaiting review.");
  expect(commerce.currentCustomer().balanceMicros).toBe(70_000_000);
});

test("approving an underpaid order preserves its pending status and customer balance", () => {
  const commerce = harness.commerce;
  const orderId = commerce.createOrder(5000, "Fiat");
  const savedBeforeReview = harness.storage.getItem("vishwa-commerce-ops:v1");

  expect(() =>
    commerce.reviewPayment(orderId, "approve", "TEST-TXN-002", "Amount checked", 4900),
  ).toThrow("Received amount does not match the order total.");

  expect(commerce.currentCustomer().balanceMicros).toBe(20_000_000);
  expect(commerce.getCommerce().orders.find((order) => order.id === orderId)?.status).toBe(
    "awaiting_payment",
  );
  expect(harness.storage.getItem("vishwa-commerce-ops:v1")).toBe(savedBeforeReview);
});

test("approving a requested refund removes the principal once and rejects repeated settlement", () => {
  const commerce = harness.commerce;
  const orderId = commerce.createOrder(5000, "Fiat");
  commerce.reviewPayment(orderId, "approve", "TEST-TXN-003", "Amount reconciled", 5000);
  commerce.requestRefund(orderId, "Unused credit");

  commerce.resolveRefund(orderId, true, "Refund reconciled");

  expect(commerce.currentCustomer().balanceMicros).toBe(20_000_000);
  expect(commerce.getCommerce().orders.find((order) => order.id === orderId)?.status).toBe(
    "refunded",
  );
  expect(() => commerce.resolveRefund(orderId, true, "Repeated settlement")).toThrow(
    "Refund is not awaiting review.",
  );
  expect(commerce.currentCustomer().balanceMicros).toBe(20_000_000);
});
