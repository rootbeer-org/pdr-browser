import { For, Show } from "solid-js";
import { docs, recipesUrl } from "../config.ts";
import { useBrowserState, type KindFilter } from "../state/browser-state.ts";
import { KINDS, type SearchResult } from "../catalog/search-options.ts";
import { ALL_PLATFORMS } from "../catalog/search.ts";
import { platforms } from "../catalog/types.ts";
import FilterGroup from "./FilterGroup.tsx";
import { KIND_LABELS, platformLabel } from "./labels.ts";
import PackageList from "./PackageList.tsx";
import ResultsToolbar from "./ResultsToolbar.tsx";
import SearchField from "./SearchField.tsx";

const GUIDES = [
  [docs.runTool, "Run a tool"],
  [docs.keepInstalled, "Install for your user"],
  [docs.declareInConfig, "Manage with Lua"],
  [docs.packageLocks, "Updates and offline use"],
  [docs.packageSources, "Other package sources"],
];

/**
 * Narrow screens read search → filter → results → guides, so the sidebar
 * wrappers collapse to `contents` and each block takes its own order.
 */
export default function PackageBrowser(props: { result: SearchResult }) {
  const { query, platform, kind, filterPlatform, filterKind, clearFilters } = useBrowserState();
  const kindEntries = () =>
    (["", ...KINDS] as KindFilter[]).map((id) => ({
      id,
      label: id ? KIND_LABELS[id] : "All types",
      count: props.result.kindCounts[id],
    }));
  const platformEntries = () =>
    ["", ALL_PLATFORMS, ...platforms.map(({ id }) => id)].map((id) => ({
      id,
      label: platformLabel(id),
      count: props.result.platformCounts[id],
      hint: id === ALL_PLATFORMS ? "Packages that build on every platform" : undefined,
    }));

  return (
    <div class="flex flex-col gap-6 md:grid md:grid-cols-[13rem_minmax(0,1fr)] md:items-start md:gap-x-8">
      <div class="contents md:flex md:flex-col md:gap-y-6">
        <div class="order-2 flex flex-col gap-y-4 md:order-none md:gap-y-6">
          <FilterGroup
            legend="Type"
            name="kind"
            entries={kindEntries()}
            value={kind()}
            onSelect={(id) => filterKind(id as KindFilter)}
          />
          <FilterGroup
            legend="Platform"
            name="platform"
            entries={platformEntries()}
            value={platform()}
            onSelect={filterPlatform}
          />
        </div>

        <div class="order-4 flex flex-col gap-y-6 md:order-none">
          <nav aria-label="Package guides">
            <h2 class="heading">Using packages</h2>
            <For each={GUIDES}>
              {([href, label]) => (
                <a class="link block" href={href}>
                  {label}
                </a>
              )}
            </For>
          </nav>

          <nav aria-label="Package contributions">
            <h2 class="heading">The collection</h2>
            <a class="link block" href={docs.packaging}>
              Contribute a package ↗
            </a>
            <a class="link block" href={recipesUrl} target="_blank" rel="noopener noreferrer">
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
          <ResultsToolbar result={props.result} />
          <Show
            when={props.result.count}
            fallback={
              <div class="border border-edge p-4">
                <h2 class="heading">No matching packages</h2>
                <p class="opacity-80">
                  Try another name, command, or description, or loosen the type and platform
                  filters.
                </p>
                <div class="mt-3 flex flex-wrap items-center gap-x-4">
                  <Show when={query() || platform() || kind()}>
                    <button
                      type="button"
                      class="border border-edge px-2 py-1 hover:bg-hover"
                      onClick={clearFilters}
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
            <PackageList result={props.result} />
          </Show>
        </div>
      </div>
    </div>
  );
}
