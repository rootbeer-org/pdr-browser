import solid from "@astrojs/solid-js";
import tailwind from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

export default defineConfig({
  trailingSlash: "always",
  devToolbar: { enabled: false },
  integrations: [solid()],
  vite: { plugins: [tailwind()] },
});
