import { describe, expect, it } from "vitest";
import {
  NEXT_STATUSES,
  ORDER_STATUSES,
  orderStatusLabel,
  type OrderStatus,
} from "./status";

describe("order status transitions (UI mirror of the database rules)", () => {
  it("defines transitions for every status", () => {
    expect(Object.keys(NEXT_STATUSES).sort()).toEqual([...ORDER_STATUSES].sort());
  });

  it("only points to real statuses and never to itself", () => {
    for (const status of ORDER_STATUSES) {
      for (const next of NEXT_STATUSES[status]) {
        expect(ORDER_STATUSES).toContain(next);
        expect(next).not.toBe(status);
      }
    }
  });

  it("treats delivered and cancelled as final", () => {
    expect(NEXT_STATUSES.delivered).toEqual([]);
    expect(NEXT_STATUSES.cancelled).toEqual([]);
  });

  it("only allows cancelling before the order ships", () => {
    const cancellable = ORDER_STATUSES.filter((s) =>
      NEXT_STATUSES[s].includes("cancelled"),
    );
    expect(cancellable).toEqual(["pending", "confirmed", "processing"]);
  });

  it("lets every non-final status reach delivered by moving forward", () => {
    const canReachDelivered = (from: OrderStatus, seen = new Set<OrderStatus>()): boolean => {
      if (from === "delivered") return true;
      if (seen.has(from)) return false;
      seen.add(from);
      return NEXT_STATUSES[from].some((n) => canReachDelivered(n, seen));
    };
    for (const status of ["pending", "confirmed", "processing", "shipped"] as const) {
      expect(canReachDelivered(status)).toBe(true);
    }
  });

  it("has a readable label for every status", () => {
    for (const status of ORDER_STATUSES) {
      expect(orderStatusLabel(status)).not.toBe(status);
    }
  });
});