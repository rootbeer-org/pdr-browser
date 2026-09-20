import { Show } from "solid-js";
import type { CatalogPackage } from "../catalog/types.ts";
import { platform } from "../state/browser-state.ts";
import { packageHref, recipeHref, sourceHref } from "../state/links.ts";
import { createPackageView } from "../state/package-view.ts";
import MetadataPanel from "./MetadataPanel.tsx";
import UsagePanel from "./UsagePanel.tsx";
import VersionTable from "./VersionTable.tsx";

export default function PackageDetails(props: { pkg: CatalogPackage }) {
  const view = createPackageView(props.pkg);

  const permalink = () =>
    packageHref(view.pkg.name, view.isPinned() ? view.selectedVersion() : "", platform());
  const source = () => sourceHref(view.recipe());

  return (
    <div class="border-t border-edge px-3 py-3">
      <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label={`${view.pkg.name} links`}>
        <a class="link" href={view.pkg.homepage} target="_blank" rel="noopener noreferrer">
          Homepage ↗
        </a>
        <a class="link" href={recipeHref(view.pkg.name)} target="_blank" rel="noopener noreferrer">
          Package recipe ↗
        </a>
        <Show when={source()}>
          <a class="link" href={source()} target="_blank" rel="noopener noreferrer">
            {view.recipe().build ? "Source archive" : "Upstream release"} ↗
          </a>
        </Show>
        <a class="link" href={permalink()}>
          Link to this package
        </a>
      </nav>

      <div class="mt-4 grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <UsagePanel view={view} />
        <MetadataPanel view={view} />
      </div>

      <Show when={view.versions().length > 1}>
        <VersionTable view={view} />
      </Show>
    </div>
  );
}
