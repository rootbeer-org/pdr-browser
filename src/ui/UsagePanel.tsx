import { For, Match, Show, Switch, createEffect } from "solid-js";
import { cn } from "cn";
import { usageModes } from "../catalog/commands.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { docs } from "../config.ts";
import { useBrowserState } from "../state/browser-state.ts";
import { createClipboard } from "../state/clipboard.ts";
import ProvenancePanel from "./ProvenancePanel.tsx";
import type { PackageView } from "../state/package-view.ts";

export default function UsagePanel(props: { view: PackageView }) {
  const { selectVersion, version } = useBrowserState();
  const view = props.view;
  const clipboard = createClipboard();

  createEffect(() => {
    view.snippet();
    clipboard.reset();
  });

  return (
    <section class="min-w-0 flex flex-col gap-y-3" aria-label={`Use ${view.pkg.name}`}>
      <h3 class="font-bold uppercase">
        {view.isLibrary() ? "Use this library" : "Use this package"}
      </h3>
      <fieldset>
        <legend class="sr-only">Use this package</legend>
        <div class="flex flex-wrap">
          <For each={usageModes(view.pkg.name, view.output())}>
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

      <Show when={view.mode() !== "bootstrap"}>
        <div class="flex flex-wrap gap-x-4 gap-y-2">
          <label class="flex min-w-0 flex-1 flex-col gap-y-1">
            <span class="text-xs uppercase opacity-80">Version</span>
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
                <option value="">Default ({defaultVersion(view.pkg, view.system())})</option>
              </Show>
              <For each={view.versions()}>{(entry) => <option value={entry}>{entry}</option>}</For>
            </select>
          </label>
          <Show when={view.mode() === "run" && view.runTargets().length > 1}>
            <label class="flex min-w-0 flex-1 flex-col gap-y-1">
              <span class="text-xs uppercase opacity-80">Command or app</span>
              <select
                class="field w-full"
                value={view.runTarget()}
                onChange={(event) => view.selectRunTarget(event.currentTarget.value)}
              >
                <For each={view.runTargets()}>
                  {(entry) => (
                    <option value={entry.value}>
                      {entry.name} · {entry.kind}
                    </option>
                  )}
                </For>
              </select>
            </label>
          </Show>
        </div>
      </Show>

      <Show when={!view.isInvalidVersion()}>
        <ProvenancePanel view={view} />
      </Show>
      <Show
        when={view.mode() === "bootstrap" || !view.isInvalidVersion()}
        fallback={
          <p role="alert" class="border border-edge px-2 py-1 opacity-80">
            Version {version()} is not available on this platform. Choose an available version to
            see its install command.
          </p>
        }
      >
        <div class="border border-edge bg-inset">
          <div class="flex items-center justify-between gap-3 border-b border-edge px-3 py-2">
            <span class="text-xs uppercase opacity-80">
              {view.mode() === "config" ? "init.lua" : "Terminal"}
            </span>
            <button
              type="button"
              class="shrink-0 border border-accent bg-accent-soft px-3 py-1.5 font-bold text-accent hover:bg-hover"
              aria-label={`Copy ${view.mode()} instructions for ${view.pkg.name}`}
              onClick={() => clipboard.copy(view.snippet())}
            >
              {clipboard.copied() ? "Copied" : "Copy"}
            </button>
          </div>
          <pre class="overflow-x-auto p-4 text-base leading-relaxed">
            <code>{view.snippet()}</code>
          </pre>
        </div>
      </Show>
      <span role="status" class="sr-only">
        {clipboard.copied() ? "Copied to clipboard." : ""}
      </span>
      <Show when={clipboard.failed()}>
        <p role="status" class="opacity-80">
          Could not copy. Select and copy the command above.
        </p>
      </Show>

      <Switch>
        <Match when={view.mode() === "bootstrap"}>
          <p class="opacity-80">Install the latest Rootbeer nightly.</p>
        </Match>
        <Match when={view.mode() === "config"}>
          <p class="opacity-80">
            Add to <code>init.lua</code>, then run <code>rb apply</code>.
          </p>
        </Match>
        <Match when={view.mode() === "run" && view.app()}>
          <p class="opacity-80">
            Open <code>{view.app()}</code> from the verified package store without creating an
            Applications link.
          </p>
        </Match>
        <Match when={view.mode() === "run"}>
          <p class="opacity-80">
            Run <code>{view.bin()}</code> without adding it to your shell. Append <code>--</code>{" "}
            followed by any arguments for the command.
          </p>
        </Match>
        <Match when={view.isApp()}>
          <p class="opacity-80">
            Install this package's app bundles for your user. Rootbeer links them into your
            Applications folder.
          </p>
        </Match>
        <Match when={view.isLibrary()}>
          <p class="opacity-80">This library exports no commands or app bundles.</p>
        </Match>
        <Match when={view.mode() === "use"}>
          <p class="opacity-80">
            Install <code>{view.pkg.name}</code> for your user. Run <code>eval "$(rb env)"</code> to
            make its commands available in your current shell.
          </p>
        </Match>
      </Switch>
      <a class="link" href={view.mode() === "bootstrap" ? docs.gettingStarted : docs.packages}>
        Usage guide →
      </a>
    </section>
  );
}
