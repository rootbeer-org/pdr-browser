import { Show } from "solid-js";
import { KIND_LABELS, platformLabel, type SearchResult } from "#/catalog/search.ts";
import { urlState } from "#/lib/url-state.ts";

export default function ResultsToolbar(props: { result: SearchResult }) {
  const { options, isFiltered, update } = urlState;
  const status = () => `${props.result.count} ${props.result.count === 1 ? "package" : "packages"}`;
  const filters = () => {
    const { kind, platform } = options();
    return [kind && KIND_LABELS[kind], platform && platformLabel(platform)]
      .filter(Boolean)
      .join(" · ");
  };

  return (
    <div class="my-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <p role="status" aria-live="polite" class="tabular-nums">
        {status()}
        <Show when={props.result.count !== props.result.total}>
          <span class="opacity-50"> of {props.result.total}</span>
        </Show>
        <Show when={filters()}>
          <span class="opacity-50"> · {filters()}</span>
        </Show>
      </p>

      <Show when={isFiltered()}>
        <button
          type="button"
          class="link"
          onClick={() => update({ q: "", platform: "", kind: "" })}
        >
          Clear filters
        </button>
      </Show>

      <label class="ml-auto flex items-baseline gap-x-2 opacity-80">
        Sort
        <select
          aria-label="Sort packages"
          class="field"
          value={options().sort}
          onChange={(event) => {
            const sort = event.currentTarget.value;
            update({ sort: sort === "relevance" ? "" : sort });
          }}
        >
          <Show when={options().query}>
            <option value="relevance">Relevance</option>
          </Show>
          <option value="name">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="added">Recently added</option>
          <option value="updated">Recently updated</option>
        </select>
      </label>
    </div>
  );
}
