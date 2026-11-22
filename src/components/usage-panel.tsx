import { For, Show } from "solid-js";
import { usageModes } from "#/catalog/commands.ts";
import { defaultVersion } from "#/catalog/versions.ts";
import { createClipboard } from "#/lib/clipboard.ts";
import type { PackageView } from "#/lib/package-view.ts";
import { urlState } from "#/lib/url-state.ts";

export default function UsagePanel(props: { view: PackageView }) {
  const { update, version } = urlState;
  const view = props.view;
  const clipboard = createClipboard();

  return (
    <section class="flex min-w-0 flex-col gap-3" aria-label={`Use ${view.pkg.name}`}>
      <h2 class="heading">Usage</h2>
      <fieldset>
        <legend class="sr-only">Usage</legend>
        <div class="flex flex-wrap">
          <For each={usageModes(view.pkg.name, view.output())}>
            {([id, label]) => (
              <label class="toggle">
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
        <div class="flex flex-wrap gap-2">
          <label class="flex min-w-0 flex-1 flex-col gap-1">
            <span class="heading">Version</span>
            <select
              class="select w-full"
              value={version()}
              onChange={(event) => update({ version: event.currentTarget.value })}
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
            <label class="flex min-w-0 flex-1 flex-col gap-1">
              <span class="heading">Command or app</span>
              <select
                class="select w-full"
                value={view.runTarget()?.id}
                onChange={(event) => view.selectRunTarget(event.currentTarget.value)}
              >
                <For each={view.runTargets()}>
                  {(entry) => (
                    <option value={entry.id}>
                      {entry.name} · {entry.isApp ? "App" : "Command"}
                    </option>
                  )}
                </For>
              </select>
            </label>
          </Show>
        </div>
      </Show>

      <Show
        when={view.mode() === "bootstrap" || !view.isInvalidVersion()}
        fallback={
          <p role="alert" class="border border-accent bg-accent-bg px-2 py-2">
            Version {version()} is not available on this platform. Choose an available version to
            see its install command.
          </p>
        }
      >
        <div class="flex items-start border border-border bg-surface">
          <pre class="min-w-0 flex-1 overflow-x-auto p-3">
            <code>{view.snippet()}</code>
          </pre>
          <button
            type="button"
            class="m-1 button bg-bg"
            aria-label={`Copy ${view.mode()} instructions for ${view.pkg.name}`}
            onClick={() => clipboard.copy(view.snippet())}
          >
            {clipboard.isCopied(view.snippet()) ? "Copied" : "Copy"}
          </button>
        </div>
      </Show>
      <span role="status" class="sr-only">
        {clipboard.isCopied(view.snippet()) ? "Copied to clipboard." : ""}
      </span>
      <Show when={clipboard.isFailed(view.snippet())}>
        <p role="status" class="text-muted">
          Could not copy. Select and copy the command above.
        </p>
      </Show>
    </section>
  );
}
