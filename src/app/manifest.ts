import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "M9M — Visual Workflow Automation",
    short_name: "M9M",
    description:
      "Build, automate, and orchestrate complex workflows visually with AI-powered nodes.",
    start_url: "/workflows",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      {
        src: "/logo/logo.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable",
      },
    ],
  };
}
