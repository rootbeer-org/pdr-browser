import { For, Show } from "solid-js";
import { cn } from "cn";
import { platforms } from "../catalog/types.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { useBrowserState } from "../state/browser-state.ts";
import type { PackageView } from "../state/package-view.ts";

export default function VersionTable(props: { view: PackageView }) {
  const { selectVersion } = useBrowserState();
  const view = props.view;
  const platform = view.system;

  const systemLabel = () => platforms.find(({ id }) => id === platform())?.short ?? "";
  return (
    <details class="mt-6 border-t border-edge pt-4" aria-label={`${view.pkg.name} versions`}>
      <summary class="w-fit cursor-pointer hover:text-accent">
        <span class="font-bold uppercase">Version history</span>
        <span class="ml-2 tabular-nums opacity-70">· {view.versions().length}</span>
      </summary>
      <p class="mt-3 mb-2 text-xs opacity-70">Newest first · {systemLabel()}</p>

      <div class="max-h-72 overflow-auto border border-edge">
        <table class="w-full border-collapse">
          <thead class="sticky top-0 bg-page uppercase">
            <tr class="border-b border-edge">
              <th class="border-r border-edge px-2 py-1 text-left font-bold">Version</th>
              <th class="px-2 py-1 text-right font-bold">
                <span class="sr-only">Select version</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <For each={view.versions()}>
              {(entry) => (
                <tr
                  aria-current={view.selectedVersion() === entry ? "true" : undefined}
                  class={cn(
                    "border-b border-edge last:border-b-0 hover:bg-hover",
                    view.selectedVersion() === entry && "bg-inset",
                  )}
                >
                  <th
                    scope="row"
                    class="border-r border-edge px-2 py-1 text-left font-normal whitespace-nowrap"
                  >
                    <code>{entry}</code>
                    <Show when={entry === defaultVersion(view.pkg, platform())}>
                      <span class="ml-2 border border-accent bg-accent-soft px-1 text-accent">
                        Default
                      </span>
                    </Show>
                  </th>
                  <td class="px-2 py-1 text-right whitespace-nowrap">
                    <button
                      type="button"
                      aria-label={`Use ${view.pkg.name} version ${entry}`}
                      class="text-accent hover:underline"
                      onClick={() => selectVersion(entry)}
                    >
                      {view.selectedVersion() === entry ? "Selected" : "Use version"}
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </details>
  );
}
