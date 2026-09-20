import { Match, Show, Switch } from "solid-js";
import { docs, indexRepositoryUrl } from "../config.ts";
import { clearFilters, platform, query, syncUrlState } from "../state/browser-state.ts";
import { catalog, error, refetch, results } from "../state/catalog-resource.ts";
import PackageList from "./PackageList.tsx";
import PlatformFilter from "./PlatformFilter.tsx";
import ResultsToolbar from "./ResultsToolbar.tsx";
import SearchField from "./SearchField.tsx";

export default function PackageBrowser() {
  syncUrlState();

  return (
    <div>
      <aside>
        <PlatformFilter />
        <nav aria-label="Package guides">
          <h2>Using packages</h2>
          <a href={docs.runTool}>Run a tool</a>
          <a href={docs.keepInstalled}>Install for your user</a>
          <a href={docs.declareInConfig}>Manage with Lua</a>
          <a href={docs.packageLocks}>Updates and offline use</a>
          <a href={docs.packageSources}>Other package sources</a>
        </nav>
        <nav aria-label="Package contributions">
          <h2>The collection</h2>
          <a href={docs.packaging}>Contribute a package ↗</a>
          <a href={indexRepositoryUrl} target="_blank" rel="noopener noreferrer">
            Browse recipes ↗
          </a>
        </nav>
      </aside>

      <div>
        <SearchField />
        <ResultsToolbar />

        <Switch>
          <Match when={error()}>
            <div role="alert">
              <h2>Could not load packages</h2>
              <p>{error()}</p>
              <button type="button" onClick={() => refetch()}>
                Try again
              </button>
              <a href={docs.packages}>Read the package guide →</a>
            </div>
          </Match>
          <Match when={catalog.loading}>
            <p>Fetching the published package collection.</p>
          </Match>
          <Match when={!results().length}>
            <div>
              <h2>No matching packages</h2>
              <p>Try another command name or description, or clear the platform filter.</p>
              <Show when={query() || platform()}>
                <button type="button" onClick={clearFilters}>
                  Show all packages
                </button>
              </Show>
              <a href={docs.packageSources}>Install from another source →</a>
            </div>
          </Match>
          <Match when={results().length}>
            <PackageList />
          </Match>
        </Switch>
      </div>
    </div>
  );
}
