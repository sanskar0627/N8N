import type { FC } from "react";

interface JsonLdProps {
  data: Record<string, unknown>;
}

export const JsonLd: FC<JsonLdProps> = ({ data }) => (
  <script
    type="application/ld+json"
    dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
  />
);

const SITE_URL =
  process.env.BETTER_AUTH_URL || "https://m9m.sanskarshukla.com";

export const SoftwareApplicationJsonLd: FC = () => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "M9M",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description:
        "Visual workflow automation platform. Build, automate, and orchestrate complex workflows with a drag-and-drop editor. Connect AI models, APIs, and services.",
      author: {
        "@type": "Person",
        name: "Sanskar Shukla",
        url: "https://sanskarshukla.com",
      },
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
        description: "Free tier available",
      },
      featureList: [
        "Visual drag-and-drop workflow builder",
        "AI-powered nodes (Anthropic, OpenAI, Google Gemini)",
        "API integrations (Slack, Discord, Stripe, Google Forms)",
        "Real-time workflow execution monitoring",
        "Credential management",
        "Self-hostable",
      ],
      screenshot: `${SITE_URL}/og-image.png`,
    }}
  />
);

export const BreadcrumbJsonLd: FC<{
  items: { name: string; url: string }[];
}> = ({ items }) => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: item.name,
        item: item.url,
      })),
    }}
  />
);

export const WebSiteJsonLd: FC = () => (
  <JsonLd
    data={{
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "M9M",
      url: SITE_URL,
      description: "Visual workflow automation platform",
      author: {
        "@type": "Person",
        name: "Sanskar Shukla",
        url: "https://sanskarshukla.com",
      },
    }}
  />
);
