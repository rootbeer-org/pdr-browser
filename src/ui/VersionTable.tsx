import { For, Show } from "solid-js";
import { platforms } from "../catalog/types.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { platform, selectVersion, version } from "../state/browser-state.ts";
import type { PackageView } from "../state/package-view.ts";

export default function VersionTable(props: { view: PackageView }) {
  const view = props.view;

  const systemLabel = () => platforms.find(({ id }) => id === platform())?.label ?? "";
  const hasPlatformDefaults = () =>
    !platform() && Object.keys(view.pkg.default_versions ?? {}).length > 0;

  const supportedOn = (entry: string) =>
    platforms
      .filter((platform) => view.pkg.versions[entry].systems.includes(platform.id))
      .map((platform) => platform.short)
      .join(" · ");

  return (
    <section aria-label={`${view.pkg.name} versions`}>
      <h3>
        Available versions{" "}
        <span>
          {view.versions().length} · newest first
          {platform() ? ` · ${systemLabel()}` : ""}
        </span>
      </h3>
      <table>
        <thead>
          <tr>
            <th scope="col">Version</th>
            <th scope="col">Available on</th>
            <th scope="col">
              <span>Select version</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <For each={view.versions()}>
            {(entry) => (
              <tr aria-current={view.selectedVersion() === entry ? "true" : undefined}>
                <th scope="row">
                  <code>{entry}</code>
                  <Show when={entry === defaultVersion(view.pkg, platform())}>
                    <span>Default{hasPlatformDefaults() ? "*" : ""}</span>
                  </Show>
                </th>
                <td>{supportedOn(entry)}</td>
                <td>
                  <button
                    type="button"
                    aria-label={`Use ${view.pkg.name} version ${entry}`}
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
      <Show when={hasPlatformDefaults()}>
        <p>* Some platforms use a different default; see the platform list above.</p>
      </Show>
    </section>
  );
}
