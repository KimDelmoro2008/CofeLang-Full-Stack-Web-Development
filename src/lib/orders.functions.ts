import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  MAX_CASH_CENTS, MAX_QTY, MENU_BY_ID, NAME_RE, PHONE_RE, computeBill, normalizePhone, unitPrice,
} from "./menu";

const OrderInput = z.object({
  items: z.array(z.object({
    id: z.string().max(100),
    size: z.string().max(30),
    qty: z.number().int().min(1).max(MAX_QTY),
  })).min(1).max(100),
  name: z.string().trim().min(2).max(60).regex(NAME_RE),
  phone: z.string().trim().max(20).transform(normalizePhone).refine((v) => PHONE_RE.test(v)),
  orderType: z.enum(["Pickup", "Dine-in"]),
  notes: z.string().trim().max(200),
  student: z.boolean(),
  cashCents: z.number().int().min(1).max(MAX_CASH_CENTS),
});

function orderNumber() {
  const d = new Date();
  const stamp = d.toISOString().slice(2, 10).replace(/-/g, "");
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  for (const b of bytes) code += chars[b % chars.length];
  return `CL-${stamp}-${code}`;
}

export const placeOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => OrderInput.parse(input))
  .handler(async ({ data, context }) => {
    // Prices always come from the menu on the server, never from the browser.
    const items = data.items.map((l) => {
      const unit = unitPrice(l.id, l.size);
      const m = MENU_BY_ID.get(l.id);
      if (unit === null || !m) throw new Error("An item in your cart is no longer on the menu.");
      return { id: l.id, name: m.name, category: m.categoryLabel, size: l.size, qty: l.qty, price: unit };
    });
    const bill = computeBill(items.map((i) => ({ unit: i.price, qty: i.qty })), data.student);
    if (data.cashCents < bill.total) throw new Error("Cash must cover the total bill.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as { email?: string }).email ?? "";
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data: row, error } = await supabaseAdmin.from("orders").insert({
        order_number: orderNumber(),
        user_id: context.userId,
        account_email: email,
        customer_name: data.name,
        phone: data.phone,
        order_type: data.orderType,
        notes: data.notes,
        student: data.student,
        items,
        subtotal_cents: bill.subtotal,
        discount_cents: bill.discount,
        tax_cents: bill.tax,
        total_cents: bill.total,
        cash_cents: data.cashCents,
        change_cents: data.cashCents - bill.total,
      }).select("order_number").single();
      if (!error) return { orderNumber: row.order_number };
      if (error.code !== "23505") throw new Error("We couldn't save your order. Please try again.");
    }
    throw new Error("We couldn't save your order. Please try again.");
  });
