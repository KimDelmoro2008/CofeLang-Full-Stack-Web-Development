import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout, StaticHtml } from "@/components/SiteLayout";
import { developersHtml } from "@/lib/static-pages";
import { pageMeta } from "@/lib/seo";

export const Route = createFileRoute("/developers")({
  head: () => pageMeta("Developers – CofeLang Web Development Team", "Meet the eight IT students behind the CofeLang website: their roles, short bios and skills."),
  component: () => <SiteLayout><StaticHtml html={developersHtml} /></SiteLayout>,
});
