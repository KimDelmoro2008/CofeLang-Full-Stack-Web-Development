import { useSyncExternalStore } from "react";
import { MAX_QTY, MENU_BY_ID, unitPrice } from "./menu";

export type CartLine = { id: string; size: string; qty: number };
const KEY = "cofelang.cart.v2";
const listeners = new Set<() => void>();
let cache: CartLine[] | null = null;
const EMPTY: CartLine[] = [];

function read(): CartLine[] {
  if (cache) return cache;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    cache = Array.isArray(raw)
      ? raw.filter(
          (l) => l && MENU_BY_ID.has(l.id) && unitPrice(l.id, l.size ?? "") !== null &&
            Number.isInteger(l.qty) && l.qty >= 1 && l.qty <= MAX_QTY,
        )
      : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(lines: CartLine[]) {
  cache = lines;
  try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch { /* storage blocked */ }
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) { cache = null; listeners.forEach((l) => l()); }
  });
}

export const cart = {
  add(id: string, size: string): "ok" | "max" {
    const lines = [...read()];
    const i = lines.findIndex((l) => l.id === id && l.size === size);
    const cur = lines[i];
    if (cur) {
      if (cur.qty >= MAX_QTY) return "max";
      lines[i] = { ...cur, qty: cur.qty + 1 };
    } else lines.push({ id, size, qty: 1 });
    write(lines);
    return "ok";
  },
  setQty(id: string, size: string, qty: number) {
    write(read().map((l) => (l.id === id && l.size === size ? { ...l, qty: Math.min(MAX_QTY, Math.max(1, qty)) } : l)));
  },
  remove(id: string, size: string) {
    write(read().filter((l) => !(l.id === id && l.size === size)));
  },
  clear() { write([]); },
};

export function useCart(): CartLine[] {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    read,
    () => EMPTY,
  );
}
