import { createSignal, onMount } from "solid-js";
import { PAGE_SIZE, platformSystem, readSearch } from "#/catalog/search.ts";

const [params, setParams] = createSignal(new URLSearchParams());
const [limit, setLimit] = createSignal(PAGE_SIZE);

export function syncUrlState(): void {
  onMount(() => setParams(new URLSearchParams(location.search)));
}

function update(changes: Record<string, string>): void {
  const next = new URLSearchParams(params());
  for (const [key, value] of Object.entries(changes)) {
    if (value) next.set(key, value);
    else next.delete(key);
  }

  const search = next.size ? `?${next}` : "";
  history.replaceState(history.state, "", `${location.pathname}${search}${location.hash}`);
  setParams(next);
  setLimit(PAGE_SIZE);
}

const options = () => readSearch(params());

export const urlState = {
  options,
  isFiltered: () => Boolean(options().query || options().platform || options().kind),
  system: () => platformSystem(options().platform),
  version: () => params().get("version") ?? "",
  update,
  limit,
  showMore: () => setLimit(limit() + PAGE_SIZE),
};
