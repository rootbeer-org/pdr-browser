import { createMemo, createResource, createRoot } from "solid-js";
import { loadRoot } from "../catalog/load.ts";
import { matchesPackage, searchPackages } from "../catalog/search.ts";
import { platforms } from "../catalog/types.ts";
import { catalogSource } from "../config.ts";
import { platform, query, sort } from "./browser-state.ts";

export const { catalog, packages, results, platformCounts, queryCount, error, refetch } =
  createRoot(() => {
    const [catalog, { refetch }] = createResource(() => loadRoot(catalogSource));

    const packages = () => catalog()?.packages ?? [];

    const results = createMemo(() => {
      const matched = searchPackages(packages(), query(), platform());
      if (sort() === "name") return matched.sort((a, b) => a.name.localeCompare(b.name));
      if (sort() === "name-desc") return matched.sort((a, b) => b.name.localeCompare(a.name));
      return matched;
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
      return cause instanceof Error ? cause.message : "The package repository could not be loaded.";
    };

    return { catalog, packages, results, platformCounts, queryCount, error, refetch };
  });
