import { For, Show } from "solid-js";
import { docs } from "#/site.ts";
import type { SearchResult } from "#/catalog/search.ts";
import { urlState } from "#/lib/url-state.ts";
import PackageRow from "./package-row.tsx";

export default function PackageList(props: { result: SearchResult }) {
  const { showMore } = urlState;
  return (
    <>
      <div class="border border-edge">
        <For each={props.result.packages}>{(pkg) => <PackageRow pkg={pkg} />}</For>
      </div>
      <Show when={props.result.packages.length < props.result.count}>
        <button
          type="button"
          class="mt-3 border border-edge px-2 py-1 hover:bg-hover"
          onClick={showMore}
        >
          Show more
        </button>
      </Show>
      <p class="mt-3 opacity-80">
        <a class="link" href={docs.packaging} target="_blank" rel="noopener noreferrer">
          Missing a tool? Contribute a package →
        </a>
      </p>
    </>
  );
}
