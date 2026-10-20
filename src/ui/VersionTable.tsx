import { For, Show } from "solid-js";
import { platforms, type IndexEntry } from "../catalog/types.ts";
import { availableVersions } from "../catalog/versions.ts";
import { packageHref } from "../state/links.ts";

export default function VersionTable(props: { pkg: IndexEntry }) {
  const versions = () => availableVersions(props.pkg);
  return (
    <details class="mt-6 border-t border-edge pt-4" aria-label={`${props.pkg.name} versions`}>
      <summary class="w-fit cursor-pointer hover:text-accent">
        <span class="font-bold uppercase">Version history</span>
        <span class="ml-2 tabular-nums opacity-70">· {versions().length}</span>
      </summary>
      <p class="mt-3 mb-2 text-xs opacity-70">
        Newest releases first · Defaults marked per platform
      </p>
      <Show when={versions().some((version) => version.includes("+"))}>
        <p class="mb-2 text-xs opacity-70">
          Build hashes have no publication dates; equivalent releases show defaults first.
        </p>
      </Show>
      <div class="max-h-72 overflow-auto border border-edge">
        <table class="w-full border-collapse">
          <thead class="sticky top-0 bg-page uppercase">
            <tr class="border-b border-edge">
              <th class="border-r border-edge px-2 py-1 text-left font-bold">Version</th>
              <For each={platforms}>
                {(platform) => <th class="px-2 py-1 text-left font-bold">{platform.short}</th>}
              </For>
            </tr>
          </thead>
          <tbody>
            <For each={versions()}>
              {(version) => (
                <tr class="border-b border-edge last:border-b-0 hover:bg-hover">
                  <th
                    scope="row"
                    class="border-r border-edge px-2 py-1 text-left font-normal whitespace-nowrap"
                  >
                    <code>{version}</code>
                  </th>
                  <For each={platforms}>
                    {(platform) => (
                      <td class="px-2 py-1 whitespace-nowrap">
                        <Show
                          when={props.pkg.versions[version][platform.id]}
                          fallback={<span class="opacity-40">Unavailable</span>}
                        >
                          <a
                            class="link"
                            href={packageHref(props.pkg.name, version, platform.id)}
                            aria-label={`Use ${props.pkg.name} ${version} on ${platform.short}`}
                          >
                            Use version
                          </a>
                          <Show when={props.pkg.default[platform.id] === version}>
                            <span class="ml-2 border border-accent bg-accent-soft px-1 text-accent">
                              Default
                            </span>
                          </Show>
                        </Show>
                      </td>
                    )}
                  </For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </details>
  );
}
