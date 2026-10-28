import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, StaticHtml } from "@/components/SiteLayout";
import { termsHtml } from "@/lib/static-pages";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/terms")({
  head: () => pageMeta("Terms of Service – CofeLang", "Simple terms for using the CofeLang website, including notes on orders, prices and allergens."),
  component: () => <SiteLayout><StaticHtml html={termsHtml} /></SiteLayout>,
});
