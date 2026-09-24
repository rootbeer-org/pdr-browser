import { Match, Show, Switch } from "solid-js";
import type { PackageDocument, RootPackage } from "../catalog/types.ts";
import { availableVersions } from "../catalog/versions.ts";
import { platform } from "../state/browser-state.ts";
import { createDocument } from "../state/document-resource.ts";
import { packageHref, recipeHref, sourceHref } from "../state/links.ts";
import { createPackageView } from "../state/package-view.ts";
import MetadataPanel from "./MetadataPanel.tsx";
import UsagePanel from "./UsagePanel.tsx";
import VersionTable from "./VersionTable.tsx";

export default function PackageDetails(props: { pkg: RootPackage }) {
  const [document, { refetch }] = createDocument(props.pkg);

  return (
    <div class="border-t border-edge px-3 py-3">
      <Switch>
        <Match when={document.error}>
          <div role="alert">
            <p class="opacity-80">
              {document.error instanceof Error
                ? document.error.message
                : "The package details could not be loaded."}
            </p>
            <button
              type="button"
              class="mt-2 border border-edge px-2 py-1 hover:bg-hover"
              onClick={() => refetch()}
            >
              Try again
            </button>
          </div>
        </Match>

        <Match when={document.loading}>
          <p class="opacity-50">Fetching package details…</p>
        </Match>

        <Match when={document()}>
          {(loaded) => (
            <Show
              when={availableVersions(loaded(), platform()).length}
              fallback={<p class="opacity-80">No published versions for this platform.</p>}
            >
              <Details pkg={props.pkg} document={loaded()} />
            </Show>
          )}
        </Match>
      </Switch>
    </div>
  );
}

function Details(props: { pkg: RootPackage; document: PackageDocument }) {
  const view = createPackageView(props.pkg, props.document);

  const permalink = () =>
    packageHref(view.pkg.name, view.isPinned() ? view.selectedVersion() : "", platform());
  const source = () => sourceHref(view.recipe());

  return (
    <>
      <nav class="flex flex-wrap gap-x-4 gap-y-1" aria-label={`${view.pkg.name} links`}>
        <a class="link" href={recipeHref(view.pkg.name)} target="_blank" rel="noopener noreferrer">
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

      <div class="mt-4 grid gap-x-8 gap-y-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <UsagePanel view={view} />
        <MetadataPanel view={view} />
      </div>

      <Show when={view.versions().length > 1}>
        <VersionTable view={view} />
      </Show>
    </>
  );
}
