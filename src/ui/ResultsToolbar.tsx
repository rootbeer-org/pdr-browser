import { Show } from "solid-js";
import { platforms } from "../catalog/types.ts";
import { clearFilters, order, platform, query, sort } from "../state/browser-state.ts";
import { catalog, error, results } from "../state/catalog-resource.ts";

export default function ResultsToolbar() {
  const platformLabel = () => platforms.find(({ id }) => id === platform())?.label ?? "";

  const status = () => {
    if (catalog.loading) return "Loading packages…";
    if (error()) return "Catalog unavailable";
    return `${results().length} ${results().length === 1 ? "package" : "packages"}`;
  };

  return (
    <>
      <div>
        <p role="status" aria-live="polite">
          {status()}
          <Show when={!catalog.loading && !error() && platform()}>
            <span> · {platformLabel()}</span>
          </Show>
        </p>
        <label>
          Sort
          <select
            aria-label="Sort packages"
            value={sort()}
            onChange={(event) => order(event.currentTarget.value === "name" ? "name" : "relevance")}
          >
            <option value="relevance">Relevance</option>
            <option value="name">Name A–Z</option>
          </select>
        </label>
      </div>

      <Show when={query() || platform()}>
        <div>
          <Show when={query()}>
            <span>“{query()}”</span>
          </Show>
          <Show when={platform()}>
            <span>{platformLabel()}</span>
          </Show>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      </Show>
    </>
  );
}
