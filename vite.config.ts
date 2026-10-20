import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwind from "@tailwindcss/vite";
import { defineConfig, type UserConfig } from "vite";

import { prepareCatalog, readCatalogManifest } from "./scripts/catalog.ts";

export default defineConfig(async ({ command, isPreview }): Promise<UserConfig> => {
  const catalog = isPreview
    ? await readCatalogManifest()
    : await prepareCatalog(command === "build" || process.env.PDR_REFRESH === "1");

  return {
    define: { "import.meta.env.PDR_DATA_PATH": JSON.stringify(catalog.dataPath) },
    plugins: [solidStart({ devOverlay: false }), tailwind(), nitro()],
    nitro: {
      preset: "static",
      compatibilityDate: "2026-09-29",
      prerender: {
        routes: [
          "/",
          "/404.html",
          ...catalog.names.map((name) => `/packages/${encodeURIComponent(name)}/`),
        ],
        crawlLinks: false,
        failOnError: true,
        concurrency: 8,
      },
    },
  };
});
