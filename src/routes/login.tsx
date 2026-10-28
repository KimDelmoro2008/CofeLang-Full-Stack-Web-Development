import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { LogoutButton, SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { EMAIL_RE } from "@/lib/menu";
import { pageMeta } from "@/lib/seo";

const safeNext = (v: unknown) => (typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "");

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>): { msg?: string; next?: string } => {
    const out: { msg?: string; next?: string } = {};
    if (typeof s["msg"] === "string") out.msg = s["msg"];
    const next = safeNext(s["next"]);
    if (next) out.next = next;
    return out;
  },
  head: () => pageMeta("Login – CofeLang", "Log in to CofeLang to order and track your orders. Staff with a tip.edu.ph email open the order dashboard."),
  component: Login,
});

function Login() {
  const { msg, next } = Route.useSearch();
  const { session, isStaff, ready } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(msg === "logout" ? "You have been logged out." : "");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(""); setInfo("");
    if (!EMAIL_RE.test(email.trim())) return setError("Enter a valid email, like you@example.com.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setBusy(true);
    if (mode === "in") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) return setError(error.message.includes("confirm") ? "Please confirm your email first — check your inbox." : "Wrong email or password.");
      if (next) navigate({ to: next });
    } else {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(), password,
        options: { emailRedirectTo: window.location.origin + (next || "/login") },
      });
      setBusy(false);
      if (error) return setError(error.message);
      if (!data.session) setInfo("Check your email and click the link to confirm your account, then log in.");
    }
  };

  const google = async () => {
    setError("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/login" });
    if (r.error) setError("Google sign-in didn't work. Please try again.");
    else if (!r.redirected && next) navigate({ to: next });
  };

  return (
    <SiteLayout>
      <section className="hero hero--compact">
        <h1>Login</h1>
        <p>Sign in as a customer, or as staff to open the order dashboard.</p>
      </section>
      <section className="section section--form">
        <div className="form-card">
          {!ready ? null : session ? (
            <div className="thanks">
              <h3>You're logged in</h3>
              <p>Signed in as {session.user.email}{isStaff ? " (staff)" : ""}.</p>
              <div className="login-actions">
                {isStaff && <Link to="/dashboard" className="hero-btn">Open Dashboard</Link>}
                {next && <Link to={next} className="hero-btn">Continue</Link>}
                <Link to="/products" className="btn-outline">Browse Menu</Link>
                <LogoutButton />
              </div>
            </div>
          ) : (
            <>
              <h2>{mode === "in" ? "Log in" : "Create an account"}</h2>
              {info && <p className="notice" role="status">{info}</p>}
              <form onSubmit={submit} noValidate>
                <div className="form-group">
                  <label htmlFor="loginEmail">Email <span className="req">*</span></label>
                  <input type="email" id="loginEmail" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <p className="field-hint">Accounts with an @tip.edu.ph email get access to the staff dashboard.</p>
                </div>
                <div className="form-group">
                  <label htmlFor="loginPassword">Password <span className="req">*</span></label>
                  <input type="password" id="loginPassword" autoComplete={mode === "in" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="field-error form-error" role="alert">{error}</p>}
                <button type="submit" className="submit-btn" disabled={busy}>{busy ? "Please wait…" : mode === "in" ? "Log in" : "Sign up"}</button>
              </form>
              <p className="form-intro" style={{ textAlign: "center", margin: "1rem 0" }}>or</p>
              <button type="button" className="btn-outline" style={{ width: "100%" }} onClick={google}>Continue with Google</button>
              <p className="form-legal">
                {mode === "in" ? "New to CofeLang? " : "Already have an account? "}
                <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === "in" ? "up" : "in"); setError(""); }}>
                  {mode === "in" ? "Create an account" : "Log in instead"}
                </a>
              </p>
            </>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
