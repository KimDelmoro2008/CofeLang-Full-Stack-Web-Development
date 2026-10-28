import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, StaticHtml } from "@/components/SiteLayout";
import { indexHtml } from "@/lib/static-pages";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => pageMeta(
    "CofeLang – Student-Friendly Cafe in Quezon City",
    "CofeLang is a cafe beside TIP on Aurora Blvd, Quezon City, made for students: affordable coffee, milk tea, frappes, pasta, pizza and pastries.",
    true,
  ),
  component: () => <SiteLayout><StaticHtml html={indexHtml} /></SiteLayout>,
});
