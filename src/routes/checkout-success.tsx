import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Bill, ItemsList, STATUS_LABELS, itemsOf, type Order } from "@/components/OrderBits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/checkout-success")({
  validateSearch: (s: Record<string, unknown>) => ({ order: typeof s["order"] === "string" ? (s["order"] as string) : "" }),
  head: () => pageMeta("Order Confirmed – CofeLang", "Your CofeLang order was placed. See your order number, items and change."),
  component: Success,
});

function Success() {
  const { order: number } = Route.useSearch();
  const { session, ready } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  useEffect(() => {
    if (!ready) return;
    if (!session || !number) { setOrder(null); return; }
    supabase.from("orders").select("*").eq("order_number", number).maybeSingle().then(({ data }) => setOrder(data));
  }, [ready, session, number]);

  return (
    <SiteLayout>
      <section className="section success-section">
        <h1 className="visually-hidden">Order confirmation</h1>
        <div className="success-card">
          {order === undefined ? <p>Loading your order…</p> : order === null ? (
            <>
              <h2>We couldn't find that order</h2>
              <p>Check <Link to="/orders">My Orders</Link> or <Link to="/">return home</Link>.</p>
            </>
          ) : (
            <>
              <h2>Thank you, {order.customer_name}!</h2>
              <p>Your order has been sent to the counter.</p>
              <p className="order-number">Order number: <strong>{order.order_number}</strong></p>
              <p className="order-meta">{order.order_type} · <span className={"status-badge status-" + order.status}>{STATUS_LABELS[order.status]}</span></p>
              <ItemsList items={itemsOf(order)} />
              <Bill order={order} />
              <div className="login-actions">
                <Link to="/orders" className="hero-btn">View My Orders</Link>
                <Link to="/products" className="btn-outline">Order more</Link>
              </div>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
