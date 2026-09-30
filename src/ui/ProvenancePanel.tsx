import { For, Match, Show, Switch, createSignal } from "solid-js";
import { cn } from "cn";
import { platforms } from "../catalog/types.ts";
import { useBrowserState } from "../state/browser-state.ts";
import { createRecord } from "../state/record-resource.ts";
import type { PackageView } from "../state/package-view.ts";

export default function ProvenancePanel(props: { view: PackageView }) {
  const { platform } = useBrowserState();
  const view = props.view;
  const [chosen, setChosen] = createSignal("");

  const published = view.systems;
  const system = () => {
    const preferred = chosen() || platform();
    return published().includes(preferred) ? preferred : published()[0];
  };
  const label = (id: string) => platforms.find((entry) => entry.id === id)?.short ?? id;

  const [record] = createRecord(() =>
    system()
      ? {
          name: view.pkg.name,
          version: view.selectedVersion(),
          system: system(),
          digest: view.entry().platforms[system()].record,
        }
      : undefined,
  );

  return (
    <section class="mt-6 border-t border-edge pt-4" aria-label="Published build signature">
      <h3 class="heading">Published build</h3>
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
            {record.error instanceof Error ? record.error.message : "The record is unavailable."}
          </p>
        </Match>

        <Match when={record()}>
          {(entry) => (
            <dl class="border border-edge">
              <div class="flex items-baseline justify-between gap-x-4 border-b border-edge px-2 py-1">
                <dt class="opacity-80">Ed25519 signature</dt>
                <dd class="text-accent">Verified for {label(entry().system)}</dd>
              </div>
              <div class="border-b border-edge px-2 py-3">
                <dt class="sr-only">Signature</dt>
                <dd class="min-w-0 break-all">
                  <code>{entry().signature}</code>
                </dd>
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
              <div class="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-edge px-2 py-1">
                <dt class="opacity-80">Build receipt</dt>
                <dd class="min-w-0 break-all">
                  <code>{entry().receiptSha256}</code>
                </dd>
              </div>
              <div class="flex flex-wrap items-baseline justify-between gap-x-4 px-2 py-1">
                <dt class="opacity-80">Signed</dt>
                <dd class="tabular-nums">
                  {new Date(entry().published * 1000).toISOString().slice(0, 10)}
                </dd>
              </div>
            </dl>
          )}
        </Match>
      </Switch>
    </section>
  );
}
