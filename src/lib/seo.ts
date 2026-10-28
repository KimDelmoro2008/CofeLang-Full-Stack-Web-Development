export const OG_IMAGE = "https://cofelang.vercel.app/assets/og-image.png";

export function pageMeta(title: string, description: string, withImage = false) {
  const meta: Record<string, string>[] = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ];
  if (withImage) {
    meta.push({ property: "og:image", content: OG_IMAGE }, { name: "twitter:image", content: OG_IMAGE });
  }
  return { meta };
}
