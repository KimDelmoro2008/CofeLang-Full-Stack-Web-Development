import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, StaticHtml } from "@/components/SiteLayout";
import { privacyHtml } from "@/lib/static-pages";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/privacy")({
  head: () => pageMeta("Privacy Policy – CofeLang", "How CofeLang handles your account, orders and messages."),
  component: () => <SiteLayout><StaticHtml html={privacyHtml} /></SiteLayout>,
});
