import { For, Show, type JSX } from "solid-js";
import { platforms, type PackageSnapshot } from "#/catalog/types.ts";
import { createPackageView } from "#/lib/package-view.ts";
import { syncUrlState, urlState } from "#/lib/url-state.ts";
import MetadataPanel from "./metadata-panel.tsx";
import ProvenancePanel from "./provenance-panel.tsx";
import UsagePanel from "./usage-panel.tsx";

export default function PackageDetails(
  props: PackageSnapshot & { usedBy: string[]; children?: JSX.Element },
) {
  const view = createPackageView(props);

  syncUrlState();

  return (
    <>
      <header class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1">
          <h1 class="flex flex-wrap items-baseline gap-x-2 text-base">
            <strong class="break-all text-accent">{view.pkg.name}</strong>
            <span class="text-muted">{view.selectedVersion()}</span>
          </h1>
          <p>{view.pkg.description}</p>
        </div>
        <select
          aria-label="Platform"
          class="select"
          value={view.system()}
          onChange={(event) => urlState.update({ platform: event.currentTarget.value })}
        >
          <For each={platforms}>{(entry) => <option value={entry.id}>{entry.short}</option>}</For>
        </select>
      </header>

      <Show
        when={view.versions().length}
        fallback={<p class="mt-6 text-muted">No published versions for this platform.</p>}
      >
        <div class="mt-6 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <UsagePanel view={view} />
          <aside class="min-w-0" aria-label="Package details">
            <MetadataPanel view={view} usedBy={props.usedBy} />
          </aside>
        </div>
      </Show>
      {props.children}
      <Show when={view.versions().length && !view.isInvalidVersion()}>
        <ProvenancePanel view={view} />
      </Show>
    </>
  );
}
