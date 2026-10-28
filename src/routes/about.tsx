import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { SiteLayout, StaticHtml } from "@/components/SiteLayout";
import { aboutHtml } from "@/lib/static-pages";
import { pageMeta } from "@/lib/seo";
import { EMAIL_RE } from "@/lib/menu";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/about")({
  head: () => pageMeta("About Us – CofeLang", "Learn about CofeLang: how a group of IT students built a student-friendly cafe beside TIP in Quezon City, and the values behind every cup."),
  component: About,
});

function About() {
  return (
    <SiteLayout>
      <StaticHtml html={aboutHtml} />
      <ContactSection />
    </SiteLayout>
  );
}

function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "message", string>>>({});
  const [sent, setSent] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Partial<Record<"name" | "email" | "message", string>> = {};
    if (form.name.trim().length < 2) errs.name = "Please enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) errs.email = "Enter a valid email, like you@example.com.";
    if (form.message.trim().length < 5) errs.message = "Please write a short message (at least 5 characters).";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setFail("");
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim().slice(0, 60), email: form.email.trim().slice(0, 100), message: form.message.trim().slice(0, 1000),
    });
    setBusy(false);
    if (error) { setFail("We couldn't send your message. Please try again."); return; }
    setSent(form.name.trim());
    setForm({ name: "", email: "", message: "" });
  };

  const field = (k: "name" | "email", label: string, type: string) => (
    <div className={"form-group" + (errors[k] ? " has-error" : "")}>
      <label htmlFor={"contact-" + k}>{label} <span className="req" aria-hidden="true">*</span></label>
      <input id={"contact-" + k} type={type} value={form[k]} maxLength={k === "name" ? 60 : 100}
        aria-invalid={!!errors[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
      {errors[k] && <p className="field-error">{errors[k]}</p>}
    </div>
  );

  return (
    <section className="section" id="contact">
      <h2 className="section-title">Contact Us</h2>
      <p className="section-subtitle">Questions or feedback? Send us a note.</p>
      <div className="form-card contact-card">
        {sent === null ? (
          <form onSubmit={submit} noValidate>
            {field("name", "Name", "text")}
            {field("email", "Email", "email")}
            <div className={"form-group" + (errors.message ? " has-error" : "")}>
              <label htmlFor="contact-message">Message <span className="req" aria-hidden="true">*</span></label>
              <textarea id="contact-message" rows={5} maxLength={1000} value={form.message}
                aria-invalid={!!errors.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              {errors.message && <p className="field-error">{errors.message}</p>}
            </div>
            {fail && <p className="field-error form-error" role="alert">{fail}</p>}
            <button type="submit" className="submit-btn" disabled={busy}>{busy ? "Sending…" : "Send Message"}</button>
          </form>
        ) : (
          <div className="thanks" role="status">
            <h3>Thank you!</h3>
            <p>Thanks, {sent}. Your message reached the CofeLang team and we'll get back to you by email.</p>
            <button type="button" className="btn-outline" onClick={() => setSent(null)}>Write another message</button>
          </div>
        )}
      </div>
    </section>
  );
}
