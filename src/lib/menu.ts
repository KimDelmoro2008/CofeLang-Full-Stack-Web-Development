import menuData from "./menu-data.json";

export type MenuSize = { label: string; price: number };
export type MenuItem = {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  description: string;
  allergens: string;
  image: string;
  price: number; // centavos
  sizeNote: string;
  sizes: MenuSize[];
};

export const MENU: MenuItem[] = menuData as MenuItem[];
export const MENU_BY_ID = new Map(MENU.map((m) => [m.id, m]));

export const CATEGORIES: { id: string; label: string }[] = (() => {
  const seen = new Map<string, string>();
  for (const m of MENU) if (!seen.has(m.category)) seen.set(m.category, m.categoryLabel);
  return [...seen].map(([id, label]) => ({ id, label }));
})();

export const STUDENT_DISCOUNT_RATE = 20;
export const TAX_RATE = 12;
export const MIN_QTY = 1;
export const MAX_QTY = 50;
export const MAX_CASH_CENTS = 10_000_000;

export const peso = (cents: number) =>
  "\u20B1" +
  (cents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Price in centavos for one unit of a menu item at a size ("" = no size). Null if invalid. */
export function unitPrice(id: string, size: string): number | null {
  const item = MENU_BY_ID.get(id);
  if (!item) return null;
  if (item.sizes.length === 0) return size ? null : item.price;
  const s = item.sizes.find((x) => x.label === size);
  return s ? s.price : null;
}

/** subtotal -> minus 20% student discount -> plus 12% tax on the rest = total (all centavos). */
export function computeBill(lines: { unit: number; qty: number }[], student: boolean) {
  const subtotal = lines.reduce((sum, l) => sum + l.unit * l.qty, 0);
  const discount = student ? Math.round((subtotal * STUDENT_DISCOUNT_RATE) / 100) : 0;
  const taxable = subtotal - discount;
  const tax = Math.round((taxable * TAX_RATE) / 100);
  return { subtotal, discount, tax, total: taxable + tax };
}

export const PHONE_RE = /^(\+63|0)9\d{9}$/;
export const normalizePhone = (v: string) => v.replace(/[\s-]/g, "");
export const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .,'\u2019-]*$/u;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
