import { For, Match, Show, Switch, createEffect } from "solid-js";
import { primaryCommand, usageModes } from "../catalog/commands.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { docs } from "../config.ts";
import { platform, selectVersion, version } from "../state/browser-state.ts";
import { createClipboard } from "../state/clipboard.ts";
import type { PackageView } from "../state/package-view.ts";

export default function UsagePanel(props: { view: PackageView }) {
  const view = props.view;
  const clipboard = createClipboard();

  createEffect(() => {
    view.snippet();
    clipboard.reset();
  });

  const defaultBin = () =>
    primaryCommand(view.pkg, view.selectedVersion()) || view.recipe().bins[0];
  const otherBins = () => view.recipe().bins.filter((name) => name !== defaultBin());

  const guide = () => {
    if (view.mode() === "bootstrap") return [docs.gettingStarted, "Installation guide"];
    if (view.isLibrary()) return [docs.libraryDependencies, "Building with dependencies"];
    return [docs.packages, "Usage and updates"];
  };

  const snippetLabel = () =>
    view.isLibrary() ? "Package recipe" : view.mode() === "config" ? "init.lua" : "Terminal";

  return (
    <section aria-label={`Use ${view.pkg.name}`}>
      <Show when={!view.isLibrary()}>
        <fieldset>
          <legend>Use this package</legend>
          <For each={usageModes(view.pkg)}>
            {([id, label]) => (
              <label>
                <input
                  type="radio"
                  name={`usage-${view.pkg.name}`}
                  value={id}
                  checked={view.mode() === id}
                  onChange={() => view.setMode(id)}
                />
                {label}
              </label>
            )}
          </For>
        </fieldset>
      </Show>

      <Show when={view.mode() !== "bootstrap"}>
        <div>
          <label>
            Version
            <select
              value={version()}
              onChange={(event) => selectVersion(event.currentTarget.value)}
            >
              <Show when={view.isInvalidVersion()}>
                <option value={version()} disabled>
                  {version()} · unavailable
                </option>
              </Show>
              <Show
                when={view.isDefaultAvailable()}
                fallback={<option value="">{view.selectedVersion()}</option>}
              >
                <option value="">Latest ({defaultVersion(view.pkg, platform())})</option>
              </Show>
              <For each={view.versions()}>{(entry) => <option value={entry}>{entry}</option>}</For>
            </select>
          </label>

          <Show when={view.mode() === "run" && view.recipe().bins.length > 1}>
            <label>
              Command
              <select
                value={view.selectedBin()}
                onChange={(event) => view.selectBin(event.currentTarget.value)}
              >
                <option value="">{defaultBin()}</option>
                <For each={otherBins()}>{(name) => <option value={name}>{name}</option>}</For>
              </select>
            </label>
          </Show>
        </div>
      </Show>

      <Switch>
        <Match when={view.mode() === "bootstrap"}>
          <p>
            Install the latest Rootbeer nightly. Requires <code>curl</code> and <code>unzip</code>.
          </p>
        </Match>
        <Match when={view.isLibrary()}>
          <p>
            Add to your recipe's <code>build</code> table to make this library available during
            compilation.
          </p>
        </Match>
        <Match when={view.mode() === "run"}>
          <p>
            Run <code>{view.bin()}</code> without adding it to your shell. Append <code>--</code>{" "}
            followed by any arguments for the command.
          </p>
        </Match>
        <Match when={view.mode() === "use"}>
          <p>
            Install <code>{view.pkg.name}</code> for your user. The second line makes its commands
            available in your current shell.
          </p>
        </Match>
        <Match when={view.mode() === "config"}>
          <p>
            Add to <code>init.lua</code>, then run <code>rb apply</code>.
          </p>
        </Match>
      </Switch>

      <Show
        when={view.mode() === "bootstrap" || !view.isInvalidVersion()}
        fallback={
          <p role="alert">
            Version {version()} is not available{platform() ? " on this platform" : ""}. Choose an
            available version to see its install command.
          </p>
        }
      >
        <div>
          <div>
            <span>{snippetLabel()}</span>
            <button
              type="button"
              aria-label={`Copy ${view.isLibrary() ? "build dependency" : view.mode()} instructions for ${view.pkg.name}`}
              onClick={() => clipboard.copy(view.snippet())}
            >
              {clipboard.copied() ? "Copied" : "Copy"}
            </button>
          </div>
          <pre>
            <code>{view.snippet()}</code>
          </pre>
        </div>
      </Show>

      <Show when={clipboard.failed()}>
        <p role="status">Could not copy. Select and copy the command below.</p>
      </Show>

      <a href={guide()[0]} target="_blank" rel="noopener noreferrer">
        {guide()[1]} →
      </a>
    </section>
  );
}
