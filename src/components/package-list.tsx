import { For, Show } from "solid-js";
import type { SearchResult } from "#/catalog/search.ts";
import { urlState } from "#/lib/url-state.ts";
import PackageRow from "./package-row.tsx";

export default function PackageList(props: { result: SearchResult }) {
  return (
    <>
      <ul class="mt-2 border-t border-border">
        <For each={props.result.packages}>{(pkg) => <PackageRow pkg={pkg} />}</For>
      </ul>
      <Show when={props.result.packages.length < props.result.count}>
        <button type="button" class="mt-2 button w-full justify-center" onClick={urlState.showMore}>
          Show more
        </button>
      </Show>
    </>
  );
}
