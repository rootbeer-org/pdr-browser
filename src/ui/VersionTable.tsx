import { For, Show } from "solid-js";
import { cn } from "cn";
import { platforms } from "../catalog/types.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { platform, selectVersion, version } from "../state/browser-state.ts";
import type { PackageView } from "../state/package-view.ts";

export default function VersionTable(props: { view: PackageView }) {
  const view = props.view;

  const systemLabel = () => platforms.find(({ id }) => id === platform())?.short ?? "";
  /** Every version of a package publishes the same platforms, so state it once. */
  const coverage = () =>
    platform()
      ? systemLabel()
      : platforms
          .filter(({ id }) => view.pkg.versions[view.selectedVersion()].systems.includes(id))
          .map(({ short }) => short)
          .join(" · ");

  const hasPlatformDefaults = () =>
    !platform() && Object.keys(view.pkg.default_versions ?? {}).length > 0;

  return (
    <section class="mt-6" aria-label={`${view.pkg.name} versions`}>
      <h3 class="heading">
        <span>Available versions</span>
        <span class="ml-auto normal-case tabular-nums opacity-50">
          {view.versions().length} · newest first · {coverage()}
        </span>
      </h3>

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
                        Default{hasPlatformDefaults() ? "*" : ""}
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
                      {version() === entry ? "Selected" : "Use version"}
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>

      <Show when={hasPlatformDefaults()}>
        <p class="mt-2 opacity-50">
          * Some platforms use a different default; see the platform list above.
        </p>
      </Show>
    </section>
  );
}
