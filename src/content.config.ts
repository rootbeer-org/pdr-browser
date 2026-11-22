import { defineCollection } from "astro:content";
import type { Loader, LoaderContext } from "astro/loaders";
import { z } from "astro/zod";
import { exportCatalog, parseCatalog, type Catalog } from "#/catalog/source.ts";
import type { IndexEntry } from "#/catalog/types.ts";

let exported: Promise<Catalog> | undefined;

function catalogLoader(
  name: string,
  save: (store: LoaderContext["store"], catalog: Catalog) => void,
): Loader {
  return {
    name,
    load: async ({ store }) => {
      if (import.meta.env.DEV && store.keys().length) return;

      exported ??= exportCatalog().then(parseCatalog);
      const catalog = await exported;
      store.clear();
      save(store, catalog);
    },
  };
}

const packages = defineCollection({
  loader: catalogLoader("rb-packages", (store, catalog) => {
    for (const pkg of catalog.packages) store.set({ id: pkg.name, data: { ...pkg } });
  }),
  schema: z.custom<IndexEntry>(),
});

const catalog = defineCollection({
  loader: catalogLoader("rb-catalog", (store, { json, targets_version, expires }) => {
    store.set({ id: "current", data: { json, targets_version, expires } });
  }),
  schema: z.custom<Omit<Catalog, "packages">>(),
});

export const collections = { packages, catalog };
