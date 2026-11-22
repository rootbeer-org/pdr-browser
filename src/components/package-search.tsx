import { Show, createSignal, onMount } from "solid-js";
import { searchPage, type SearchResult } from "#/catalog/search.ts";
import type { CatalogSnapshot, PackageSummary } from "#/catalog/types.ts";
import { syncUrlState, urlState } from "#/lib/url-state.ts";
import { docs } from "#/site.ts";
import PackageList from "./package-list.tsx";
import ResultsToolbar from "./results-toolbar.tsx";
import SearchField from "./search-field.tsx";

export default function PackageSearch(props: { initial: SearchResult; indexHref: string }) {
  const { options, isFiltered, update, limit } = urlState;
  const [packages, setPackages] = createSignal<PackageSummary[]>();
  const [isFailed, setIsFailed] = createSignal(false);
  const result = () => {
    const loaded = packages();
    return loaded ? searchPage(loaded, options(), limit()) : props.initial;
  };

  let request: Promise<void> | undefined;
  const loadIndex = () => {
    request ??= load();
  };

  async function load(): Promise<void> {
    setIsFailed(false);
    try {
      const response = await fetch(props.indexHref);
      if (!response.ok) throw new Error(response.statusText);
      const index: CatalogSnapshot = await response.json();
      setPackages(index.packages);
    } catch {
      setIsFailed(true);
    }
  }

  syncUrlState();
  onMount(() => {
    if (location.search) loadIndex();
  });

  return (
    <div onPointerOver={loadIndex} onFocusIn={loadIndex}>
      <SearchField />
      <ResultsToolbar result={result()} />

      <Show when={isFailed()}>
        <p role="alert" class="mt-2 border border-accent bg-accent-bg px-2 py-2">
          Could not load the package index, so results may not match your search.{" "}
          <button type="button" class="link" onClick={() => (request = load())}>
            Try again
          </button>
        </p>
      </Show>

      <Show
        when={result().count}
        fallback={
          <div class="mt-2 border-t border-border py-6">
            <p>No matching packages.</p>
            <p class="mt-2 flex flex-wrap gap-x-4 text-muted">
              <Show when={isFiltered()}>
                <button
                  type="button"
                  class="link"
                  onClick={() => update({ q: "", platform: "", kind: "" })}
                >
                  Show all packages
                </button>
              </Show>
              <a class="link" href={docs.packageSources}>
                Other package sources
              </a>
              <a class="link" href={docs.packaging}>
                Contribute a package
              </a>
            </p>
          </div>
        }
      >
        <PackageList result={result()} />
      </Show>
    </div>
  );
}
