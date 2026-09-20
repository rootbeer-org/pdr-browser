import { createSignal, onCleanup, onMount } from "solid-js";
import { platforms } from "../catalog/types.ts";

export type SortOrder = "relevance" | "name";
const [params, setParams] = createSignal(new URLSearchParams());
const read = (key: string) => params().get(key) ?? "";

function patch(changes: Record<string, string>): void {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(changes)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }

  window.history.replaceState(window.history.state, "", url);
  setParams(url.searchParams);
}

export const query = () => read("q");
export const expanded = () => read("show");
export const version = () => (expanded() ? read("version") : "");
export const sort = (): SortOrder => (read("sort") === "name" ? "name" : "relevance");
export const platform = () =>
  platforms.some(({ id }) => id === read("platform")) ? read("platform") : "";

export const search = (value: string) => patch({ q: value, show: "", version: "" });
export const filterPlatform = (value: string) => patch({ platform: value, show: "", version: "" });
export const clearFilters = () => patch({ q: "", platform: "", show: "", version: "" });

export const order = (value: SortOrder) => patch({ sort: value === "name" ? "name" : "" });
export const selectVersion = (value: string) => patch({ version: value });
export const toggleExpanded = (name: string) =>
  patch({ show: expanded() === name ? "" : name, version: "" });

export function syncUrlState(): void {
  const adopt = () => setParams(new URL(window.location.href).searchParams);

  adopt();
  onMount(() => {
    window.addEventListener("popstate", adopt);
    onCleanup(() => window.removeEventListener("popstate", adopt));
  });
}
