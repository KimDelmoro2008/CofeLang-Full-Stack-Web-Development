import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { LogoutButton, SiteLayout } from "@/components/SiteLayout";
import { Bill, ItemsList, STATUS_LABELS, SignInPrompt, formatDate, itemsOf, type Order } from "@/components/OrderBits";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { peso } from "@/lib/menu";
import { toast } from "@/components/toast";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/dashboard")({
  head: () => pageMeta("Staff Dashboard – CofeLang", "CofeLang staff dashboard: see customer orders live, track their status and mark them as done."),
  component: Dashboard,
});

const NEXT: Record<string, { to: string; label: string } | null> = {
  new: { to: "preparing", label: "Start preparing" },
  preparing: { to: "done", label: "Mark as done" },
  done: null,
};

function Dashboard() {
  const { session, isStaff, ready } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState("all");
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!isStaff) return;
    const load = () =>
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(500)
        .then(({ data }) => setOrders(data ?? []));
    load();
    const ch = supabase.channel("staff-orders-" + Math.random().toString(36).slice(2))
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [isStaff]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: orders.length, new: 0, preparing: 0, done: 0 };
    orders.forEach((o) => { c[o.status] = (c[o.status] ?? 0) + 1; });
    return c;
  }, [orders]);
  const sales = orders.filter((o) => o.status === "done").reduce((s, o) => s + o.total_cents, 0);
  const term = q.trim().toLowerCase();
  const shown = orders.filter((o) => (filter === "all" || o.status === filter) &&
    (!term || [o.order_number, o.customer_name, o.phone].join(" ").toLowerCase().includes(term)));

  const setStatus = async (o: Order, status: string) => {
    const { error } = await supabase.from("orders").update({ status, updated_at: new Date().toISOString() }).eq("id", o.id);
    if (error) toast("Couldn't update that order. Please try again.");
    else {
      setOrders((list) => list.map((x) => (x.id === o.id ? { ...x, status } : x)));
      toast(`${o.order_number} is now ${STATUS_LABELS[status]}.`);
    }
  };

  return (
    <SiteLayout>
      <section className="hero hero--compact">
        <h1>Staff Dashboard</h1>
        <p>Track customer orders and mark them as done.</p>
      </section>
      <section className="section">
        <h2 className="section-title">Orders</h2>
        {!ready ? null : !session ? <SignInPrompt text="The dashboard is for staff only. Log in with your @tip.edu.ph email." /> :
          !isStaff ? <SignInPrompt text="This account isn't staff. Log in with your @tip.edu.ph email to open the dashboard." /> : (
            <>
              <p className="product-count">Signed in as {session.user.email} (staff). Orders update live.</p>
              <dl className="stat-grid">
                <div className="stat"><dt>New</dt><dd>{counts["new"]}</dd></div>
                <div className="stat"><dt>Preparing</dt><dd>{counts["preparing"]}</dd></div>
                <div className="stat"><dt>Done</dt><dd>{counts["done"]}</dd></div>
                <div className="stat"><dt>Total sales</dt><dd>{peso(sales)}</dd></div>
              </dl>
              <div className="dash-tools">
                <div className="tool-field">
                  <label htmlFor="dashSearch">Search orders</label>
                  <input type="search" id="dashSearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order number, name or phone" autoComplete="off" />
                </div>
              </div>
              <div className="category-filter" role="group" aria-label="Filter orders by status">
                {["all", "new", "preparing", "done"].map((s) => (
                  <button key={s} type="button" className="filter-btn" aria-pressed={filter === s} onClick={() => setFilter(s)}>
                    {s === "all" ? "All" : STATUS_LABELS[s]} <span className="count">{counts[s]}</span>
                  </button>
                ))}
              </div>
              {shown.length === 0 ? (
                <div className="empty-state"><p>{orders.length ? "No orders match." : "No orders yet. New orders appear here automatically."}</p></div>
              ) : (
                <div className="ticket-grid">
                  {shown.map((o) => (
                    <article className="ticket" data-status={o.status} key={o.id}>
                      <div className="ticket-head">
                        <h3>{o.order_number}</h3>
                        <span className={"status-badge status-" + o.status}>{STATUS_LABELS[o.status]}</span>
                      </div>
                      <p className="ticket-time">{formatDate(o.created_at)}</p>
                      <p className="ticket-meta">{o.order_type} · {o.customer_name} · {o.phone}{o.student ? " · Student (check ID)" : ""}</p>
                      <ItemsList items={itemsOf(o)} />
                      {o.notes && <p className="ticket-notes">Notes: {o.notes}</p>}
                      <Bill order={o} />
                      <div className="ticket-actions">
                        {NEXT[o.status] && (
                          <button type="button" className="product-btn" onClick={() => setStatus(o, NEXT[o.status]!.to)}>{NEXT[o.status]!.label}</button>
                        )}
                        {o.status !== "new" && (
                          <button type="button" className="btn-outline" onClick={() => setStatus(o, "new")}>Reset to New</button>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              )}
              <div className="cart-actions"><LogoutButton /></div>
            </>
          )}
      </section>
    </SiteLayout>
  );
}
