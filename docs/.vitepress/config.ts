import { defineConfig } from "vitepress";

export default defineConfig({
  title: "OpenOrca UI",
  description:
    "React packages for building agent operations dashboards and runtime control planes.",
  base: "/openorca-ui/",
  cleanUrls: true,
  themeConfig: {
    nav: [
      { text: "Getting Started", link: "/getting-started/" },
      { text: "Packages", link: "/packages/core" },
      { text: "Guides", link: "/guides/runtime-mode" },
      { text: "Integrations", link: "/integrations/overview" },
      { text: "Reference", link: "/reference/theme" },
      { text: "Examples", link: "/examples/vite-react" },
    ],
    sidebar: {
      "/getting-started/": [
        {
          text: "Getting Started",
          items: [
            { text: "Overview", link: "/getting-started/" },
            { text: "Installation", link: "/getting-started/installation" },
            {
              text: "First Dashboard",
              link: "/getting-started/first-dashboard",
            },
            {
              text: "Demo vs Runtime",
              link: "/getting-started/demo-vs-runtime",
            },
          ],
        },
      ],
      "/packages/": [
        {
          text: "Packages",
          items: [
            { text: "Core", link: "/packages/core" },
            { text: "React", link: "/packages/react" },
            { text: "Theme", link: "/packages/theme" },
          ],
        },
      ],
      "/guides/": [
        {
          text: "Guides",
          items: [
            {
              text: "Compose a Custom Dashboard",
              link: "/guides/compose-custom-dashboard",
            },
            { text: "Styling and Theme", link: "/guides/styling-and-theme" },
            { text: "Data Model", link: "/guides/data-model" },
            { text: "Runtime Mode", link: "/guides/runtime-mode" },
          ],
        },
      ],
      "/integrations/": [
        {
          text: "Integrations",
          items: [
            { text: "Overview", link: "/integrations/overview" },
            {
              text: "Runtime Bridge Contract",
              link: "/integrations/runtime-bridge-contract",
            },
            {
              text: "VoiceGateway",
              link: "/integrations/voicegateway",
            },
            {
              text: "LangGraph Python",
              link: "/integrations/langgraph-python",
            },
          ],
        },
      ],
      "/reference/": [
        {
          text: "Reference",
          items: [
            { text: "Core", link: "/reference/core" },
            { text: "React", link: "/reference/react" },
            { text: "Theme", link: "/reference/theme" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "Examples",
          items: [
            { text: "Vite React", link: "/examples/vite-react" },
            { text: "Runtime Dashboard", link: "/examples/runtime-dashboard" },
          ],
        },
      ],
    },
    search: {
      provider: "local",
    },
    footer: {
      message: "Frontend-first agent operations UI for React.",
      copyright: "MIT",
    },
  },
});
