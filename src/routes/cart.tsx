import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";
import { cart, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import {
  MAX_CASH_CENTS, MAX_QTY, MENU_BY_ID, NAME_RE, PHONE_RE, STUDENT_DISCOUNT_RATE, TAX_RATE,
  computeBill, normalizePhone, peso, unitPrice,
} from "@/lib/menu";
import { placeOrder } from "@/lib/orders.functions";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/cart")({
  head: () => pageMeta("Your Cart – CofeLang", "Review the drinks and food in your CofeLang cart, enter your details and place a pickup or dine-in order."),
  component: CartPage,
});

const parseCash = (v: string) => {
  const t = v.trim().replace(/,/g, "");
  const n = Number(t);
  return t !== "" && Number.isFinite(n) ? Math.round(n * 100) : null;
};

function CartPage() {
  const lines = useCart();
  const [student, setStudent] = useState(false);
  const rows = lines.map((l) => ({ ...l, item: MENU_BY_ID.get(l.id)!, unit: unitPrice(l.id, l.size)! }));
  const bill = computeBill(rows, student);
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <SiteLayout>
      <section className="hero hero--compact">
        <h1>Your Cart</h1>
        <p>Review your selected items and complete your order.</p>
      </section>
      <section className="section section--narrow">
        <h2 className="section-title">Order Summary</h2>
        {rows.length === 0 ? (
          <div className="empty-state">
            <p>Your cart is empty.</p>
            <Link to="/products" className="hero-btn">Browse the menu</Link>
          </div>
        ) : (
          <>
            <div className="table-wrap">
              <table className="cart-table">
                <caption className="visually-hidden">Items in your cart</caption>
                <thead><tr><th>Item</th><th>Size</th><th>Unit price</th><th>Quantity</th><th>Line total</th><th><span className="visually-hidden">Remove</span></th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id + r.size}>
                      <td data-label="Item">{r.item.name}</td>
                      <td data-label="Size">{r.size || "—"}</td>
                      <td data-label="Unit price">{peso(r.unit)}</td>
                      <td data-label="Quantity">
                        <div className="qty-control">
                          <button type="button" className="qty-btn" aria-label="Decrease" disabled={r.qty <= 1} onClick={() => cart.setQty(r.id, r.size, r.qty - 1)}>−</button>
                          <span className="qty-value">{r.qty}</span>
                          <button type="button" className="qty-btn" aria-label="Increase" disabled={r.qty >= MAX_QTY} onClick={() => cart.setQty(r.id, r.size, r.qty + 1)}>+</button>
                        </div>
                      </td>
                      <td data-label="Line total">{peso(r.unit * r.qty)}</td>
                      <td><button type="button" className="remove-btn" onClick={() => cart.remove(r.id, r.size)}>Remove</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="cart-totals">
              <div><dt>Subtotal</dt><dd>{peso(bill.subtotal)}</dd></div>
              {bill.discount > 0 && <div className="cart-totals-discount"><dt>Student discount ({STUDENT_DISCOUNT_RATE}%)</dt><dd>−{peso(bill.discount)}</dd></div>}
              <div><dt>Tax ({TAX_RATE}%)</dt><dd>{peso(bill.tax)}</dd></div>
              <div className="cart-totals-grand"><dt>Total</dt><dd>{peso(bill.total)}</dd></div>
            </dl>
            <div className="cart-actions">
              <Link to="/products" className="btn-outline">&larr; Continue Shopping</Link>
              <button type="button" className="btn-outline btn-danger"
                onClick={() => (confirmClear ? (cart.clear(), setConfirmClear(false)) : setConfirmClear(true))}>
                {confirmClear ? "Tap again to clear" : "Clear Cart"}
              </button>
            </div>
          </>
        )}
      </section>
      {rows.length > 0 && (
        <CheckoutForm lines={lines} student={student} setStudent={setStudent} total={bill.total} />
      )}
    </SiteLayout>
  );
}

function CheckoutForm({ lines, student, setStudent, total }: {
  lines: { id: string; size: string; qty: number }[]; student: boolean; setStudent: (v: boolean) => void; total: number;
}) {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const submitOrder = useServerFn(placeOrder);
  const [f, setF] = useState({ name: "", phone: "", orderType: "", cash: "", notes: "" });
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const cash = parseCash(f.cash);

  if (!ready) return null;
  if (!session) {
    return (
      <section className="section section--narrow section--tight">
        <div className="form-card">
          <h2>Your Details</h2>
          <p className="form-intro">Log in or create a free account to place your order and track it in My Orders.</p>
          <Link to="/login" search={{ next: "/cart" }} className="submit-btn">Log in to check out</Link>
        </div>
      </section>
    );
  }

  const validate = () => {
    const e: { [k: string]: string } & Partial<Record<"name"|"phone"|"orderType"|"cash"|"notes", string>> = {};
    const name = f.name.trim();
    if (name.length < 2 || !NAME_RE.test(name)) e.name = "Enter your full name (letters only).";
    if (!PHONE_RE.test(normalizePhone(f.phone.trim()))) e.phone = "Enter a Philippine mobile number, like 0917 123 4567.";
    if (!f.orderType) e.orderType = "Choose pickup or dine-in.";
    if (!f.cash.trim()) e.cash = "Enter the cash amount you will pay with.";
    else if (cash === null || cash <= 0) e.cash = "Enter a valid amount, like 500 or 250.50.";
    else if (cash > MAX_CASH_CENTS) e.cash = "That amount is too large.";
    else if (cash < total) e.cash = `Cash must be at least ${peso(total)} to cover the bill.`;
    if (f.notes.length > 200) e.notes = "Notes can be up to 200 characters.";
    return e;
  };

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validate();
    setErrors(e);
    setFormError("");
    if (Object.keys(e).length) {
      const n = Object.keys(e).length;
      setFormError(n === 1 ? "Please fix the highlighted field and try again." : `Please fix the ${n} highlighted fields and try again.`);
      return;
    }
    setBusy(true);
    try {
      const res = await submitOrder({ data: {
        items: lines, name: f.name.trim(), phone: f.phone.trim(), orderType: f.orderType as "Pickup" | "Dine-in",
        notes: f.notes.trim(), student, cashCents: cash!,
      } });
      cart.clear();
      navigate({ to: "/checkout-success", search: { order: res.orderNumber } });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "We couldn't save your order. Your cart is unchanged.");
      setBusy(false);
    }
  };

  const G = ({ k, children }: { k: string; children: React.ReactNode }) => (
    <div className={"form-group" + (errors[k] ? " has-error" : "")}>
      {children}
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <section className="section section--narrow section--tight">
      <div className="form-card">
        <h2>Your Details</h2>
        <p className="form-intro">Fields marked <span className="req" aria-hidden="true">*</span> are required. Pay at the counter when you pick up or dine in.</p>
        <form onSubmit={submit} noValidate>
          <div className="form-row">
            <G k="name">
              <label htmlFor="custName">Full name <span className="req">*</span></label>
              <input id="custName" autoComplete="name" maxLength={60} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
            </G>
            <G k="phone">
              <label htmlFor="custPhone">Mobile number <span className="req">*</span></label>
              <input id="custPhone" type="tel" autoComplete="tel" placeholder="0917 123 4567" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <p className="field-hint">Philippine mobile number, e.g. 0917 123 4567 or +63 917 123 4567.</p>
            </G>
          </div>
          <fieldset className={"form-group" + (errors["orderType"] ? " has-error" : "")}>
            <legend>Order type <span className="req">*</span></legend>
            <div className="radio-group">
              {["Pickup", "Dine-in"].map((t) => (
                <label key={t}><input type="radio" name="orderType" value={t} checked={f.orderType === t} onChange={() => setF({ ...f, orderType: t })} /> {t}</label>
              ))}
            </div>
            {errors["orderType"] && <p className="field-error">{errors["orderType"]}</p>}
          </fieldset>
          <div className="form-group">
            <label className="check-label" htmlFor="custStudent">
              <input type="checkbox" id="custStudent" checked={student} onChange={(e) => setStudent(e.target.checked)} />
              <span>I'm a student: apply the 20% student discount</span>
            </label>
            <p className="field-hint">Please show a valid student ID at the counter. Staff will check it.</p>
          </div>
          <G k="cash">
            <label htmlFor="custCash">Cash you will pay with (₱) <span className="req">*</span></label>
            <input id="custCash" type="number" inputMode="decimal" min="0" step="0.01" placeholder="e.g. 500" value={f.cash} onChange={(e) => setF({ ...f, cash: e.target.value })} />
            <p className="field-hint">
              Amount due: <strong>{peso(total)}</strong> &middot; Change:{" "}
              <strong aria-live="polite">{cash !== null && cash >= total && cash <= MAX_CASH_CENTS ? peso(cash - total) : "—"}</strong>
            </p>
          </G>
          <G k="notes">
            <label htmlFor="custNotes">Notes (optional)</label>
            <textarea id="custNotes" rows={3} maxLength={200} placeholder="e.g., less sugar, extra ice, no whip" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} />
            <p className="field-hint">Up to 200 characters.</p>
          </G>
          {formError && <p className="field-error form-error" role="alert">{formError}</p>}
          <button type="submit" className="submit-btn" disabled={busy}>{busy ? "Placing order…" : "Place Order"}</button>
          <p className="form-legal">
            By placing an order you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.
            No payment is taken online; the cash amount is only used to work out your change.
          </p>
        </form>
      </div>
    </section>
  );
}
