import { Show } from "solid-js";
import { platforms } from "../catalog/types.ts";
import { clearFilters, order, platform, query, sort } from "../state/browser-state.ts";
import { catalog, error, results } from "../state/catalog-resource.ts";

export default function ResultsToolbar() {
  const platformLabel = () => platforms.find(({ id }) => id === platform())?.short ?? "";

  const status = () => {
    if (catalog.loading) return "Loading packages…";
    if (error()) return "Catalog unavailable";
    return `${results().length} ${results().length === 1 ? "package" : "packages"}`;
  };

  return (
    <div class="my-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <p role="status" aria-live="polite" class="tabular-nums">
        {status()}
        <Show when={!catalog.loading && !error() && platform()}>
          <span class="opacity-50"> · {platformLabel()}</span>
        </Show>
      </p>

      <Show when={query() || platform()}>
        <button type="button" class="link" onClick={clearFilters}>
          Clear filters
        </button>
      </Show>

      <label class="ml-auto flex items-baseline gap-x-2 opacity-80">
        Sort
        <select
          aria-label="Sort packages"
          class="field"
          value={sort()}
          onChange={(event) => order(event.currentTarget.value === "name" ? "name" : "relevance")}
        >
          <option value="relevance">Relevance</option>
          <option value="name">Name A–Z</option>
        </select>
      </label>
    </div>
  );
}
