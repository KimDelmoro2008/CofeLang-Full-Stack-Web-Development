import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { Bill, ItemsList, STATUS_LABELS, SignInPrompt, formatDate, itemsOf, type Order } from "@/components/OrderBits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/orders")({
  head: () => pageMeta("My Orders – CofeLang", "See the orders you placed at CofeLang, with order numbers, live status, items and totals."),
  component: OrdersPage,
});

function OrdersPage() {
  const { session, ready } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    if (!session) return;
    const uid = session.user.id;
    const load = () =>
      supabase.from("orders").select("*").eq("user_id", uid).order("created_at", { ascending: false })
        .then(({ data }) => setOrders(data ?? []));
    load();
    const ch = supabase.channel("my-orders-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${uid}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session]);

  return (
    <SiteLayout>
      <section className="hero hero--compact">
        <h1>My Orders</h1>
        <p>Every order you've placed, with its live status from the counter.</p>
      </section>
      <section className="section section--narrow">
        <h2 className="section-title">Order History</h2>
        {!ready ? null : !session ? <SignInPrompt text="Log in to see your orders." /> : orders === null ? <p>Loading…</p> :
          orders.length === 0 ? (
            <div className="empty-state">
              <p>You haven't placed any orders yet.</p>
              <Link to="/products" className="hero-btn">Browse the menu</Link>
            </div>
          ) : (
            <>
              <p className="product-count">{orders.length} {orders.length === 1 ? "order" : "orders"}</p>
              <div className="orders-list">
                {orders.map((o) => {
                  const items = itemsOf(o);
                  const units = items.reduce((n, i) => n + i.qty, 0);
                  return (
                    <article className="order-card" key={o.id}>
                      <div className="order-head">
                        <h3>{o.order_number}</h3>
                        <span className={"status-badge status-" + o.status}>{STATUS_LABELS[o.status]}</span>
                        <time className="order-date" dateTime={o.created_at}>{formatDate(o.created_at)}</time>
                      </div>
                      <p className="order-meta">{o.order_type} for {o.customer_name} · {units} {units === 1 ? "item" : "items"}</p>
                      <ItemsList items={items} />
                      {o.notes && <p className="order-meta">Notes: {o.notes}</p>}
                      <Bill order={o} />
                    </article>
                  );
                })}
              </div>
            </>
          )}
      </section>
    </SiteLayout>
  );
}
