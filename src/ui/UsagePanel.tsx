import { For, Match, Show, Switch, createEffect } from "solid-js";
import { cn } from "cn";
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
    <section class="flex flex-col gap-y-3" aria-label={`Use ${view.pkg.name}`}>
      <Show when={!view.isLibrary()}>
        <fieldset>
          <legend class="sr-only">Use this package</legend>
          <div class="flex flex-wrap">
            <For each={usageModes(view.pkg)}>
              {([id, label]) => (
                <label
                  class={cn(
                    "-ml-px cursor-pointer border border-edge px-2 py-1 first:ml-0 hover:bg-hover",
                    "has-[:focus-visible]:relative has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent",
                    view.mode() === id &&
                      "relative border-accent bg-accent-soft font-bold text-accent",
                  )}
                >
                  <input
                    type="radio"
                    name={`usage-${view.pkg.name}`}
                    class="sr-only"
                    value={id}
                    checked={view.mode() === id}
                    onChange={() => view.setMode(id)}
                  />
                  {label}
                </label>
              )}
            </For>
          </div>
        </fieldset>
      </Show>

      <Show when={view.mode() !== "bootstrap"}>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <label class="flex flex-1 flex-col gap-y-1">
            <span class="uppercase opacity-50">Version</span>
            <select
              class="field w-full"
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
            <label class="flex flex-1 flex-col gap-y-1">
              <span class="uppercase opacity-50">Command</span>
              <select
                class="field w-full"
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
          <p class="opacity-80">
            Install the latest Rootbeer nightly. Requires <code>curl</code> and <code>unzip</code>.
          </p>
        </Match>
        <Match when={view.isLibrary()}>
          <p class="opacity-80">
            Add to your recipe's <code>build</code> table to make this library available during
            compilation.
          </p>
        </Match>
        <Match when={view.mode() === "run"}>
          <p class="opacity-80">
            Run <code>{view.bin()}</code> without adding it to your shell. Append <code>--</code>{" "}
            followed by any arguments for the command.
          </p>
        </Match>
        <Match when={view.mode() === "use"}>
          <p class="opacity-80">
            Install <code>{view.pkg.name}</code> for your user. The second line makes its commands
            available in your current shell.
          </p>
        </Match>
        <Match when={view.mode() === "config"}>
          <p class="opacity-80">
            Add to <code>init.lua</code>, then run <code>rb apply</code>.
          </p>
        </Match>
      </Switch>

      <Show
        when={view.mode() === "bootstrap" || !view.isInvalidVersion()}
        fallback={
          <p role="alert" class="border border-edge px-2 py-1 opacity-80">
            Version {version()} is not available{platform() ? " on this platform" : ""}. Choose an
            available version to see its install command.
          </p>
        }
      >
        <div class="border border-edge bg-inset">
          <div class="flex items-baseline justify-between border-b border-edge px-2 py-1 uppercase opacity-50">
            <span>{snippetLabel()}</span>
            <button
              type="button"
              class="hover:text-accent hover:underline"
              aria-label={`Copy ${view.isLibrary() ? "build dependency" : view.mode()} instructions for ${view.pkg.name}`}
              onClick={() => clipboard.copy(view.snippet())}
            >
              {clipboard.copied() ? "Copied" : "Copy"}
            </button>
          </div>
          <pre class="overflow-x-auto px-2 py-2 leading-relaxed">
            <code>{view.snippet()}</code>
          </pre>
        </div>
      </Show>

      <Show when={clipboard.failed()}>
        <p role="status" class="opacity-80">
          Could not copy. Select and copy the command below.
        </p>
      </Show>

      <a class="link" href={guide()[0]} target="_blank" rel="noopener noreferrer">
        {guide()[1]} →
      </a>
    </section>
  );
}
