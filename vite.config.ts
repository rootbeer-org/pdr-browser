import { nitro } from "nitro/vite";
import { solidStart } from "@solidjs/start/config";
import tailwind from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (!/^[0-9a-f]{64}$/.test(env.VITE_CATALOG_PUBLIC_KEY ?? "")) {
    throw new Error("VITE_CATALOG_PUBLIC_KEY needs to be a 32-byte hex key");
  }

  return {
    define: { "import.meta.env.PDR_BUILD_ID": JSON.stringify(Date.now().toString()) },
    plugins: [solidStart({ devOverlay: false }), tailwind(), nitro()],
    nitro: { compatibilityDate: "2026-09-29" },
  };
});
