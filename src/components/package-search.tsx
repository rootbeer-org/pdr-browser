import { For, Show, createSignal, onMount } from "solid-js";
import {
  ALL_PLATFORMS,
  KINDS,
  KIND_LABELS,
  platformLabel,
  searchPage,
  type KindFilter,
  type SearchResult,
} from "#/catalog/search.ts";
import { platforms, type CatalogSnapshot, type PackageSummary } from "#/catalog/types.ts";
import { syncUrlState, urlState } from "#/lib/url-state.ts";
import { docs, recipesUrl } from "#/site.ts";
import FilterGroup from "./filter-group.tsx";
import PackageList from "./package-list.tsx";
import ResultsToolbar from "./results-toolbar.tsx";
import SearchField from "./search-field.tsx";

const GUIDES = [
  [docs.runTool, "Run a tool"],
  [docs.keepInstalled, "Install for your user"],
  [docs.declareInConfig, "Manage with Lua"],
  [docs.packageLocks, "Updates and offline use"],
  [docs.packageSources, "Other package sources"],
];

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

  const kindEntries = () =>
    (["", ...KINDS] as KindFilter[]).map((id) => ({
      id,
      label: id ? KIND_LABELS[id] : "All types",
      count: result().kindCounts[id],
    }));
  const platformEntries = () =>
    ["", ALL_PLATFORMS, ...platforms.map(({ id }) => id)].map((id) => ({
      id,
      label: platformLabel(id),
      count: result().platformCounts[id],
      hint: id === ALL_PLATFORMS ? "Packages that build on every platform" : undefined,
    }));

  return (
    <div
      onPointerOver={loadIndex}
      onFocusIn={loadIndex}
      class="flex flex-col gap-6 md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:items-start md:gap-x-8"
    >
      <div class="contents md:flex md:flex-col md:gap-y-6">
        <div class="order-2 flex flex-col gap-y-4 md:order-none md:gap-y-6">
          <FilterGroup
            legend="Type"
            name="kind"
            entries={kindEntries()}
            value={options().kind}
            onSelect={(id) => update({ kind: id })}
          />
          <FilterGroup
            legend="Platform"
            name="platform"
            entries={platformEntries()}
            value={options().platform}
            onSelect={(id) => update({ platform: id })}
          />
        </div>

        <div class="order-4 flex flex-col gap-y-6 md:order-none">
          <nav aria-label="Package guides">
            <h2 class="heading">Using packages</h2>
            <For each={GUIDES}>
              {([href, label]) => (
                <a class="block link" href={href}>
                  {label}
                </a>
              )}
            </For>
          </nav>

          <nav aria-label="Package contributions">
            <h2 class="heading">The collection</h2>
            <a class="block link" href={docs.packaging}>
              Contribute a package ↗
            </a>
            <a class="block link" href={recipesUrl} target="_blank" rel="noopener noreferrer">
              Browse recipes ↗
            </a>
          </nav>
        </div>
      </div>

      <div class="contents md:block md:min-w-0">
        <div class="order-1 md:order-none">
          <SearchField />
        </div>

        <div class="order-3 min-w-0 md:order-none">
          <Show when={isFailed()}>
            <div role="alert" class="mt-3 border border-edge p-4">
              <h2 class="heading">Could not load packages</h2>
              <p class="opacity-80">
                The package index is unavailable, so results may not match your search.
              </p>
              <button type="button" class="mt-3 link" onClick={() => (request = load())}>
                Try again
              </button>
            </div>
          </Show>
          <ResultsToolbar result={result()} />
          <Show
            when={result().count}
            fallback={
              <div class="border border-edge p-4">
                <h2 class="heading">No matching packages</h2>
                <p class="opacity-80">
                  Try another name, command, or description, or loosen the type and platform
                  filters.
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-x-4">
                  <Show when={isFiltered()}>
                    <button
                      type="button"
                      class="border border-edge px-2 py-1 hover:bg-hover"
                      onClick={() => update({ q: "", platform: "", kind: "" })}
                    >
                      Show all packages
                    </button>
                  </Show>
                  <a class="link" href={docs.packageSources}>
                    Install from another source →
                  </a>
                </div>
              </div>
            }
          >
            <PackageList result={result()} />
          </Show>
        </div>
      </div>
    </div>
  );
}
