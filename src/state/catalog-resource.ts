import { createMemo, createResource, createRoot } from "solid-js";
import { loadCatalog } from "../catalog/load.ts";
import { matchesPackage, searchPackages } from "../catalog/search.ts";
import { platforms } from "../catalog/types.ts";
import { catalogSource } from "../config.ts";
import { platform, query, sort } from "./browser-state.ts";

export const { catalog, packages, results, platformCounts, queryCount, error, refetch } =
  createRoot(() => {
    const [catalog, { refetch }] = createResource(() => loadCatalog(catalogSource));

    const packages = () => catalog()?.packages ?? [];

    const results = createMemo(() => {
      const matched = searchPackages(packages(), query(), platform());
      return sort() === "name" ? matched.sort((a, b) => a.name.localeCompare(b.name)) : matched;
    });

    const platformCounts = createMemo(() =>
      Object.fromEntries(
        platforms.map(({ id }) => [
          id,
          packages().filter((pkg) => matchesPackage(pkg, query(), id)).length,
        ]),
      ),
    );

    const queryCount = createMemo(
      () => packages().filter((pkg) => matchesPackage(pkg, query(), "")).length,
    );

    const error = () => {
      const cause = catalog.error;
      if (!cause) return "";
      return cause instanceof Error ? cause.message : "The catalog could not be loaded.";
    };

    return { catalog, packages, results, platformCounts, queryCount, error, refetch };
  });
