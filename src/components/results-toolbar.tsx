import { For, Show } from "solid-js";
import {
  ALL_PLATFORMS,
  KINDS,
  KIND_LABELS,
  platformLabel,
  type SearchResult,
} from "#/catalog/search.ts";
import { platforms } from "#/catalog/types.ts";
import { urlState } from "#/lib/url-state.ts";

const KIND_OPTIONS = [
  { id: "", label: "All types" },
  ...KINDS.map((id) => ({ id, label: KIND_LABELS[id] })),
];
const PLATFORM_OPTIONS = ["", ALL_PLATFORMS, ...platforms.map(({ id }) => id)].map((id) => ({
  id,
  label: platformLabel(id),
}));

export default function ResultsToolbar(props: { result: SearchResult }) {
  const { options, isFiltered, update } = urlState;

  return (
    <div class="mt-2 grid grid-flow-dense grid-cols-2 items-center gap-2 sm:flex">
      <select
        aria-label="Package type"
        class="select"
        value={options().kind}
        onChange={(event) => update({ kind: event.currentTarget.value })}
      >
        <For each={KIND_OPTIONS}>
          {({ id, label }) => (
            <option value={id}>
              {label} {id && props.result.kindCounts[id]}
            </option>
          )}
        </For>
      </select>
      <select
        aria-label="Platform"
        class="col-span-2 select"
        value={options().platform}
        onChange={(event) => update({ platform: event.currentTarget.value })}
      >
        <For each={PLATFORM_OPTIONS}>
          {({ id, label }) => (
            <option value={id}>
              {label} {id && props.result.platformCounts[id]}
            </option>
          )}
        </For>
      </select>
      <select
        aria-label="Sort"
        class="select"
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

      <div class="col-span-2 flex justify-end gap-2 sm:ml-auto">
        <p role="status" aria-live="polite" class="text-muted tabular-nums">
          {props.result.count === props.result.total
            ? `${props.result.total} packages`
            : `${props.result.count} of ${props.result.total}`}
        </p>
        <Show when={isFiltered()}>
          <button
            type="button"
            class="link"
            onClick={() => update({ q: "", platform: "", kind: "" })}
          >
            Clear
          </button>
        </Show>
      </div>
    </div>
  );
}
