import { useLocation, useSearchParams } from "@solidjs/router";
import { readSearch, type SortOrder } from "../catalog/search-options.ts";

export type { SortOrder } from "../catalog/search-options.ts";

export function useBrowserState() {
  const location = useLocation();
  const [, setParams] = useSearchParams();
  const options = () => readSearch(new URLSearchParams(location.search));
  const patch = (changes: Record<string, string>) =>
    setParams(changes, { replace: true, scroll: false });

  return {
    options,
    query: () => options().query,
    platform: () => options().platform,
    sort: () => options().sort,
    page: () => options().page,
    version: () => new URLSearchParams(location.search).get("version") ?? "",
    search: (value: string) => patch({ q: value, page: "" }),
    filterPlatform: (value: string) => patch({ platform: value, page: "" }),
    clearFilters: () => patch({ q: "", platform: "", page: "" }),
    order: (value: SortOrder) => patch({ sort: value === "relevance" ? "" : value, page: "" }),
    selectVersion: (value: string) => patch({ version: value }),
  };
}
