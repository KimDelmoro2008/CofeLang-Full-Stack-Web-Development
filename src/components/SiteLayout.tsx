import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/products", label: "Products" },
  { to: "/cart", label: "Cart" },
  { to: "/orders", label: "My Orders" },
  { to: "/developers", label: "Developers" },
] as const;

function useLogout() {
  const navigate = useNavigate();
  return async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login", search: { msg: "logout" } });
  };
}

export function LogoutButton({ className = "btn-outline btn-danger" }: { className?: string }) {
  const logout = useLogout();
  return <button type="button" className={className} onClick={logout}>Log out</button>;
}

function Header() {
  const [open, setOpen] = useState(false);
  const { session, isStaff } = useAuth();
  const lines = useCart();
  const count = lines.reduce((n, l) => n + l.qty, 0);
  const navRef = useRef<HTMLElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const logout = useLogout();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!navRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("click", onClick);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("click", onClick); };
  }, []);

  return (
    <header className="site-header">
      <div className="header-container">
        <Link to="/" className="logo">
          <img src="/assets/logo.svg" alt="CofeLang logo" width={48} height={48} />
          <span className="logo-text">
            <span className="brand-name">CofeLang</span>
            <span className="brand-tagline">Brew &amp; Bytes for Students</span>
          </span>
        </Link>
        <button ref={btnRef} className="nav-toggle" type="button" aria-expanded={open} aria-controls="site-nav"
          aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
          <span className="nav-toggle-bar" /><span className="nav-toggle-bar" /><span className="nav-toggle-bar" />
        </button>
        <nav ref={navRef} id="site-nav" className={"site-nav" + (open ? " is-open" : "")} aria-label="Primary"
          onClick={(e) => (e.target as HTMLElement).closest("a,button") && setOpen(false)}>
          <ul>
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} activeOptions={{ exact: true }} activeProps={{ "aria-current": "page" }}>
                  {n.label}
                  {n.to === "/cart" && count > 0 && <span className="cart-badge">{count}</span>}
                </Link>
              </li>
            ))}
            {isStaff && (
              <li><Link to="/dashboard" activeProps={{ "aria-current": "page" }}>Dashboard</Link></li>
            )}
            <li>
              {session ? (
                <a href="/login" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
              ) : (
                <Link to="/login" activeProps={{ "aria-current": "page" }}>Login</Link>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-col">
          <h2 className="footer-title">CofeLang</h2>
          <p>A student-friendly cafe offering quality brews, refreshing drinks, and delicious snacks at affordable prices.</p>
        </div>
        <div className="footer-col">
          <h2 className="footer-title">Quick Links</h2>
          <ul className="footer-links">
            {NAV.map((n) => <li key={n.to}><Link to={n.to}>{n.label}</Link></li>)}
            <li><Link to="/login">Login</Link></li>
          </ul>
        </div>
        <div className="footer-col">
          <h2 className="footer-title">Contact Us</h2>
          <p>Aurora Blvd, beside TIP, Quezon City</p>
          <p>+63 955 078 6293</p>
          <p>Cofelang@gmail.com</p>
        </div>
        <div className="footer-col">
          <h2 className="footer-title">Hours</h2>
          <p>Mon–Fri 7:00 AM–10:00 PM</p>
          <p>Sat–Sun 8:00 AM–11:00 PM</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 CofeLang. All rights reserved. Designed by the CofeLang Web Development Team.</p>
        <p className="footer-legal">
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </p>
      </div>
    </footer>
  );
}

export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main">Skip to main content</a>
      <Header />
      <main id="main" tabIndex={-1}>{children}</main>
      <Footer />
    </>
  );
}

export function StaticHtml({ html }: { html: string }) {
  return <div style={{ display: "contents" }} dangerouslySetInnerHTML={{ __html: html }} />;
}
