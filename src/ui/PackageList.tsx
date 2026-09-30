import { For, Show } from "solid-js";
import { docs } from "../config.ts";
import { searchHref, type SearchResult } from "../catalog/search-options.ts";
import { useBrowserState } from "../state/browser-state.ts";
import PackageRow from "./PackageRow.tsx";

export default function PackageList(props: { result: SearchResult }) {
  const { options } = useBrowserState();
  return (
    <>
      <div class="border border-edge">
        <For each={props.result.packages}>{(pkg) => <PackageRow pkg={pkg} />}</For>
      </div>
      <Show when={props.result.pages > 1}>
        <nav class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Results pages">
          <Show when={props.result.page > 1} fallback={<span class="opacity-40">Previous</span>}>
            <a class="link" href={searchHref(options(), props.result.page - 1)} rel="prev">
              Previous
            </a>
          </Show>
          <span class="tabular-nums opacity-80">
            Page {props.result.page} of {props.result.pages} · {props.result.start + 1}–
            {props.result.end} of {props.result.count}
          </span>
          <Show
            when={props.result.page < props.result.pages}
            fallback={<span class="opacity-40">Next</span>}
          >
            <a class="link" href={searchHref(options(), props.result.page + 1)} rel="next">
              Next
            </a>
          </Show>
        </nav>
      </Show>
      <p class="mt-3 opacity-80">
        <a class="link" href={docs.packaging} target="_blank" rel="noopener noreferrer">
          Missing a tool? Contribute a package →
        </a>
      </p>
    </>
  );
}
