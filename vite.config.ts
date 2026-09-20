import tailwind from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");

  if (!/^[0-9a-f]{64}$/.test(env.VITE_CATALOG_PUBLIC_KEY ?? "")) {
    throw new Error("VITE_CATALOG_PUBLIC_KEY needs to be a 32-byte hex key");
  }

  return {
    base: process.env.BASE_PATH ?? "/",
    plugins: [tailwind(), solid()],
  };
});
