import type { Tables } from "@/integrations/supabase/types";
import { STUDENT_DISCOUNT_RATE, TAX_RATE, peso } from "@/lib/menu";

export type Order = Tables<"orders">;
export type OrderItem = { id: string; name: string; size: string; qty: number; price: number };
export const STATUS_LABELS: Record<string, string> = { new: "New", preparing: "Preparing", done: "Done" };

export const itemsOf = (o: Order) => (o.items as unknown as OrderItem[]) ?? [];
export const itemLabel = (i: { name: string; size: string }) => i.name + (i.size ? ` (${i.size})` : "");
export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" });

export function ItemsList({ items }: { items: OrderItem[] }) {
  return (
    <ul className="order-items">
      {items.map((i, n) => (
        <li key={n}><span>{i.qty} × {itemLabel(i)}</span><span>{peso(i.price * i.qty)}</span></li>
      ))}
    </ul>
  );
}

export function Bill({ order }: { order: Order }) {
  const Row = ({ l, v, c }: { l: string; v: string; c?: string }) => (
    <div className={"bill-row" + (c ? " " + c : "")}><span>{l}</span><span>{v}</span></div>
  );
  return (
    <div className="bill">
      <Row l="Subtotal" v={peso(order.subtotal_cents)} />
      {order.discount_cents > 0 && <Row l={`Student discount (${STUDENT_DISCOUNT_RATE}%)`} v={"−" + peso(order.discount_cents)} c="bill-discount" />}
      <Row l={`Tax (${TAX_RATE}%)`} v={peso(order.tax_cents)} />
      <Row l="Total" v={peso(order.total_cents)} c="order-total" />
      <Row l="Cash" v={peso(order.cash_cents)} />
      <Row l="Change" v={peso(order.change_cents)} c="bill-change" />
    </div>
  );
}

export function SignInPrompt({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <p>{text}</p>
      <a href="/login" className="hero-btn">Log in or sign up</a>
    </div>
  );
}
