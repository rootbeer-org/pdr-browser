import { useLocation, useSearchParams } from "@solidjs/router";
import { createSignal, onMount } from "solid-js";
import {
  platformSystem,
  readSearch,
  type KindFilter,
  type SortOrder,
} from "../catalog/search-options.ts";

export type { KindFilter, SortOrder } from "../catalog/search-options.ts";

export function useBrowserState() {
  const location = useLocation();
  const [, setParams] = useSearchParams();
  const [isMounted, setIsMounted] = createSignal(false);
  onMount(() => setIsMounted(true));
  const searchParams = () => (isMounted() ? location.search : "");
  const options = () => readSearch(new URLSearchParams(searchParams()));
  const patch = (changes: Record<string, string>) =>
    setParams(changes, { replace: true, scroll: false });

  return {
    options,
    searchParams,
    query: () => options().query,
    platform: () => options().platform,
    system: () => platformSystem(options().platform),
    kind: () => options().kind,
    sort: () => options().sort,
    page: () => options().page,
    version: () => new URLSearchParams(searchParams()).get("version") ?? "",
    search: (value: string) => patch({ q: value, page: "" }),
    filterPlatform: (value: string) => patch({ platform: value, page: "" }),
    filterKind: (value: KindFilter) => patch({ kind: value, page: "" }),
    clearFilters: () => patch({ q: "", platform: "", kind: "", page: "" }),
    order: (value: SortOrder) => patch({ sort: value === "relevance" ? "" : value, page: "" }),
    selectVersion: (value: string) => patch({ version: value }),
  };
}
