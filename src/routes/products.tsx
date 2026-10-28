import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { CATEGORIES, MENU, MAX_QTY, peso, type MenuItem } from "@/lib/menu";
import { cart } from "@/lib/cart";
import { toast } from "@/components/toast";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/products")({
  head: () => pageMeta("Menu – Coffee, Milk Tea, Frappe, Pasta & More | CofeLang", "Browse the CofeLang menu of 78 items: hot and iced coffee, milk tea, frappes, fruit tea, pasta, pizza, rice meals and pastries."),
  component: Products,
});

function Products() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("default");
  const [cat, setCat] = useState("all");

  const items = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = MENU.filter((m) =>
      (cat === "all" || m.category === cat) &&
      (!term || [m.name, m.categoryLabel, m.description, m.allergens].join(" ").toLowerCase().includes(term)));
    if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "name") list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [q, sort, cat]);

  return (
    <SiteLayout>
      <section className="hero hero--page">
        <h1>Our Menu</h1>
        <p>Explore our wide selection of food and drinks crafted just for you.</p>
      </section>
      <section className="section">
        <h2 className="section-title">Delicious Menu</h2>
        <p className="section-subtitle">Browse our complete menu of {MENU.length} items</p>
        <div className="menu-tools">
          <div className="tool-field tool-field--search">
            <label htmlFor="menuSearch">Search the menu</label>
            <input type="search" id="menuSearch" value={q} onChange={(e) => setQ(e.target.value)}
              placeholder='Try "mocha", "pizza" or "matcha"' autoComplete="off" />
          </div>
          <div className="tool-field">
            <label htmlFor="menuSort">Sort by</label>
            <select id="menuSort" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="default">Menu order</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>
        </div>
        <div className="category-filter" role="group" aria-label="Filter by category">
          {[{ id: "all", label: "All" }, ...CATEGORIES].map((c) => (
            <button key={c.id} type="button" className="filter-btn" aria-pressed={cat === c.id} onClick={() => setCat(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
        <p className="product-count" role="status" aria-live="polite">
          {items.length === MENU.length ? `Showing all ${MENU.length} items` : `Showing ${items.length} of ${MENU.length} items`}
        </p>
        <p className="cart-hint">
          Pick a size (where offered), tap Add to Cart, then head to your <Link to="/cart">Cart</Link> to place the order.
        </p>
        <div className="products-grid">
          {items.map((m) => <ProductCard key={m.id} item={m} />)}
        </div>
        {items.length === 0 && <div className="empty-state"><p>No items match your search.</p></div>}
      </section>
    </SiteLayout>
  );
}

function ProductCard({ item }: { item: MenuItem }) {
  const [size, setSize] = useState(item.sizes[0]?.label ?? "");
  const priceText = item.sizes.length ? item.sizes.map((s) => peso(s.price)).join(" / ") : peso(item.price);
  const add = () => {
    const label = item.name + (size ? ` (${size})` : "");
    toast(cart.add(item.id, size) === "ok" ? `Added ${label} to your cart.` : `You already have the maximum of ${MAX_QTY} ${label}.`);
  };
  return (
    <article className="product-card">
      {item.image && <img src={item.image} alt={`${item.name} (${item.categoryLabel})`} className="product-img" loading="lazy" />}
      <div className="product-info">
        <span className="product-category">{item.categoryLabel}</span>
        <h3>{item.name}</h3>
        <p className="product-desc">{item.description}</p>
        {item.allergens && <p className="allergen-note"><span className="visually-hidden">Allergens: </span>Contains: {item.allergens}</p>}
        <p className="product-price">{priceText} {item.sizeNote && <span className="size-note">{item.sizeNote}</span>}</p>
        <div className="product-actions">
          {item.sizes.length > 0 && (
            <>
              <label className="visually-hidden" htmlFor={"size-" + item.id}>Size for {item.name}</label>
              <select id={"size-" + item.id} className="size-select" value={size} onChange={(e) => setSize(e.target.value)}>
                {item.sizes.map((s) => <option key={s.label} value={s.label}>{s.label} – {peso(s.price)}</option>)}
              </select>
            </>
          )}
          <button type="button" className="product-btn add-to-cart" onClick={add}>
            Add to Cart<span className="visually-hidden"> {item.name}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
