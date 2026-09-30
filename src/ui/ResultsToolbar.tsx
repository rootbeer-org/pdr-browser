import { Show } from "solid-js";
import { platforms } from "../catalog/types.ts";
import { useBrowserState, type SortOrder } from "../state/browser-state.ts";
import type { SearchResult } from "../catalog/search-options.ts";

export default function ResultsToolbar(props: { result: SearchResult }) {
  const { clearFilters, order, platform, query, sort } = useBrowserState();
  const platformLabel = () => platforms.find(({ id }) => id === platform())?.short ?? "";

  const status = () => `${props.result.count} ${props.result.count === 1 ? "package" : "packages"}`;

  return (
    <div class="my-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <p role="status" aria-live="polite" class="tabular-nums">
        {status()}
        <Show when={platform()}>
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
          onChange={(event) => order(event.currentTarget.value as SortOrder)}
        >
          <Show when={query()}>
            <option value="relevance">Relevance</option>
          </Show>
          <option value="name">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
        </select>
      </label>
    </div>
  );
}
