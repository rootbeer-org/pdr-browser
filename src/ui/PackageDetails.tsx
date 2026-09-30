import { Show } from "solid-js";
import type { PackageData } from "../catalog/types.ts";
import { availableVersions, packagePlatform } from "../catalog/versions.ts";
import { useBrowserState } from "../state/browser-state.ts";
import { packageHref, recipeHref, sourceHref } from "../state/links.ts";
import { createPackageView } from "../state/package-view.ts";
import DependencyTree from "./DependencyTree.tsx";
import MetadataPanel from "./MetadataPanel.tsx";
import UsagePanel from "./UsagePanel.tsx";
import VersionTable from "./VersionTable.tsx";

export default function PackageDetails(props: PackageData) {
  const { platform, version } = useBrowserState();
  return (
    <div class="border-t border-edge px-3 py-3">
      <Show
        when={
          availableVersions(props.document, packagePlatform(props.document, platform(), version()))
            .length
        }
        fallback={<p class="opacity-80">No published versions for this platform.</p>}
      >
        <Details {...props} />
      </Show>
    </div>
  );
}

function Details(props: PackageData) {
  const view = createPackageView(props);

  const permalink = () =>
    packageHref(view.pkg.name, view.isPinned() ? view.selectedVersion() : "", view.system());
  const source = () => sourceHref(view.recipe());

  return (
    <>
      <div class="grid items-start gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <UsagePanel view={view} />
        <aside class="min-w-0 space-y-4" aria-label="Package information">
          <h3 class="font-bold uppercase">Package details</h3>
          <MetadataPanel view={view} />
          <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label={`${view.pkg.name} links`}>
            <a
              class="link"
              href={recipeHref(view.pkg.name)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Package recipe ↗
            </a>
            <Show when={source()}>
              <a class="link" href={source()} target="_blank" rel="noopener noreferrer">
                Source ↗
              </a>
            </Show>
            <a class="link" href={permalink()}>
              Link to this package
            </a>
          </nav>
        </aside>
      </div>

      <DependencyTree view={view} />

      <Show when={view.versions().length > 1}>
        <VersionTable view={view} />
      </Show>
    </>
  );
}
