import { For, Match, Show, Switch, createSignal } from "solid-js";
import { cn } from "cn";
import { platforms } from "../catalog/types.ts";
import { platform } from "../state/browser-state.ts";
import { createRecord } from "../state/record-resource.ts";
import type { PackageView } from "../state/package-view.ts";

/**
 * Provenance is audit material, not something most visitors need, so the
 * record is neither shown nor fetched until it is asked for.
 */
export default function ProvenancePanel(props: { view: PackageView }) {
  const view = props.view;
  const [open, setOpen] = createSignal(false);
  const [chosen, setChosen] = createSignal("");

  const region = () => `provenance-${view.pkg.name}`;
  const published = () => view.recipe().systems;
  const system = () => {
    const preferred = chosen() || platform();
    return published().includes(preferred) ? preferred : published()[0];
  };
  const label = (id: string) => platforms.find((entry) => entry.id === id)?.short ?? id;

  const [record] = createRecord(() =>
    open() && system()
      ? { name: view.pkg.name, version: view.selectedVersion(), system: system() }
      : undefined,
  );

  return (
    <div>
      <button
        type="button"
        aria-expanded={open()}
        aria-controls={region()}
        class="heading w-full text-left hover:text-accent"
        onClick={() => setOpen(!open())}
      >
        <span aria-hidden="true" class="opacity-50">
          {open() ? "▾" : "▸"}
        </span>
        <span>Published build</span>
        <Show when={!open()}>
          <span class="ml-auto normal-case opacity-50">verify signature</span>
        </Show>
      </button>

      <div id={region()} hidden={!open()}>
        <Show when={open()}>
          <Show when={published().length > 1}>
            <div class="mb-2 flex flex-wrap gap-x-3">
              <For each={published()}>
                {(id) => (
                  <button
                    type="button"
                    class={cn(
                      "hover:underline",
                      system() === id ? "font-bold text-accent" : "opacity-50",
                    )}
                    onClick={() => setChosen(id)}
                  >
                    {label(id)}
                  </button>
                )}
              </For>
            </div>
          </Show>

          <Switch>
            <Match when={record.loading}>
              <p class="opacity-50">Verifying the signed record…</p>
            </Match>

            <Match when={record.error}>
              <p class="opacity-80">
                {record.error instanceof Error
                  ? record.error.message
                  : "The record is unavailable."}
              </p>
            </Match>

            <Match when={record()}>
              {(entry) => (
                <dl class="border border-edge">
                  <div class="flex items-baseline justify-between gap-x-4 border-b border-edge px-2 py-1">
                    <dt class="opacity-80">Signature</dt>
                    <dd class="text-accent">Verified for {label(entry().system)}</dd>
                  </div>
                  <div class="flex items-baseline justify-between gap-x-4 border-b border-edge px-2 py-1">
                    <dt class="opacity-80">Recipe revision</dt>
                    <dd class="tabular-nums">{entry().revision}</dd>
                  </div>
                  <div class="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-edge px-2 py-1">
                    <dt class="opacity-80">Artifact</dt>
                    <dd class="min-w-0 break-all">
                      <code>{entry().source || "—"}</code>
                    </dd>
                  </div>
                  <div class="flex flex-wrap items-baseline justify-between gap-x-4 px-2 py-1">
                    <dt class="opacity-80">Build receipt</dt>
                    <dd class="min-w-0 break-all">
                      <Show
                        when={entry().receiptUrl}
                        fallback={<code>{entry().receiptSha256.slice(0, 16)}…</code>}
                      >
                        <a
                          class="link"
                          href={entry().receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <code>{entry().receiptSha256.slice(0, 16)}…</code>
                        </a>
                      </Show>
                    </dd>
                  </div>
                  <Show when={entry().approvalSequence}>
                    <div class="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-edge px-2 py-1">
                      <dt class="opacity-80">Approved in</dt>
                      <dd class="min-w-0 break-all">
                        <a
                          class="link"
                          href={entry().approvalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          snapshot <span class="tabular-nums">{entry().approvalSequence}</span>
                        </a>
                      </dd>
                    </div>
                  </Show>
                </dl>
              )}
            </Match>
          </Switch>
        </Show>
      </div>
    </div>
  );
}
