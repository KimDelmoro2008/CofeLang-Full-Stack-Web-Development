import { describe, expect, it } from "vitest";
import { computeBill, unitPrice } from "./menu";

describe("bill rules", () => {
  it("adds 12% tax with no discount", () => {
    expect(computeBill([{ unit: 10000, qty: 1 }], false)).toEqual({
      subtotal: 10000, discount: 0, tax: 1200, total: 11200,
    });
  });
  it("takes 20% student discount before 12% tax", () => {
    expect(computeBill([{ unit: 10000, qty: 1 }], true)).toEqual({
      subtotal: 10000, discount: 2000, tax: 960, total: 8960,
    });
  });
  it("uses the menu price for a size, and rejects unknown sizes", () => {
    expect(unitPrice("hot-coffee-hazelnut", "Large")).toBe(9000);
    expect(unitPrice("hot-coffee-hazelnut", "Huge")).toBeNull();
  });
});
