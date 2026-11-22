import { For, Show } from "solid-js";
import { platforms, type PackageSnapshot } from "#/catalog/types.ts";
import { createPackageView } from "#/lib/package-view.ts";
import { syncUrlState, urlState } from "#/lib/url-state.ts";
import { packageHref, recipesUrl } from "#/site.ts";
import MetadataPanel from "./metadata-panel.tsx";
import UsagePanel from "./usage-panel.tsx";

export default function PackageDetails(props: PackageSnapshot) {
  const { update, version } = urlState;
  const view = createPackageView(props);
  const permalink = () =>
    packageHref(view.pkg.name, view.isPinned() ? view.selectedVersion() : "", view.system());

  syncUrlState();

  return (
    <>
      <header class="flex flex-wrap items-start gap-x-6 gap-y-3 p-3">
        <div class="min-w-0 flex-1">
          <h2 class="flex flex-wrap items-baseline gap-x-3 font-bold">
            <span class="text-lg break-all text-accent">{view.pkg.name}</span>
            <Show when={version()}>
              <span class="font-normal opacity-80">{version()}</span>
            </Show>
          </h2>
          <p class="mt-1 opacity-80">{view.pkg.description}</p>
          <Show when={view.pkg.homepage}>
            <a
              class="mt-2 inline-block link"
              href={view.pkg.homepage}
              target="_blank"
              rel="noopener noreferrer"
            >
              Homepage ↗
            </a>
          </Show>
        </div>
        <label class="flex flex-col gap-y-1">
          <span class="text-xs uppercase opacity-80">Platform</span>
          <select
            class="field"
            value={view.system()}
            onChange={(event) => update({ platform: event.currentTarget.value })}
          >
            <For each={platforms}>{(entry) => <option value={entry.id}>{entry.short}</option>}</For>
          </select>
        </label>
      </header>

      <div class="border-t border-edge p-3">
        <Show
          when={view.versions().length}
          fallback={<p class="opacity-80">No published versions for this platform.</p>}
        >
          <div class="grid items-start gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <UsagePanel view={view} />
            <aside class="min-w-0 space-y-4" aria-label="Package information">
              <h3 class="font-bold uppercase">Package details</h3>
              <MetadataPanel view={view} />
              <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label={`${view.pkg.name} links`}>
                <a
                  class="link"
                  href={`${recipesUrl}/blob/main/packages/${view.pkg.name}.lua`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Package recipe ↗
                </a>
                <a class="link" href={permalink()}>
                  Link to this package
                </a>
                <a
                  class="link"
                  href={`/packages/${view.pkg.name}/data.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Package JSON ↗
                </a>
              </nav>
            </aside>
          </div>
        </Show>
      </div>
    </>
  );
}
