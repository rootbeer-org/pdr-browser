import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwind from "@tailwindcss/vite";
import { defineConfig, loadEnv, type UserConfig } from "vite";

import { prepareCatalog, readCatalogManifest } from "./scripts/catalog.ts";

export default defineConfig(async ({ mode, command, isPreview }): Promise<UserConfig> => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (!/^[0-9a-f]{64}$/.test(env.VITE_CATALOG_PUBLIC_KEY ?? "")) {
    throw new Error("VITE_CATALOG_PUBLIC_KEY needs to be a 32-byte hex key");
  }

  const catalog = isPreview
    ? await readCatalogManifest()
    : await prepareCatalog(
        { url: env.VITE_PDR_URL, publicKey: env.VITE_CATALOG_PUBLIC_KEY },
        command === "build" || process.env.PDR_REFRESH === "1",
      );

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
