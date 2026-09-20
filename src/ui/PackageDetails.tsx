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
    <div>
      <nav aria-label={`${view.pkg.name} links`}>
        <a href={view.pkg.homepage} target="_blank" rel="noopener noreferrer">
          Homepage ↗
        </a>
        <a href={recipeHref(view.pkg.name)} target="_blank" rel="noopener noreferrer">
          Package recipe ↗
        </a>
        <Show when={source()}>
          <a href={source()} target="_blank" rel="noopener noreferrer">
            {view.recipe().build ? "Source archive" : "Upstream release"} ↗
          </a>
        </Show>
        <a href={permalink()}>Link to this package</a>
      </nav>

      <UsagePanel view={view} />
      <MetadataPanel view={view} />

      <Show when={view.versions().length > 1}>
        <VersionTable view={view} />
      </Show>
    </div>
  );
}
