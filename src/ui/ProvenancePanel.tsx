import { For, Show, createEffect, createSignal, on } from "solid-js";
import { cn } from "cn";
import { platforms } from "../catalog/types.ts";
import { useBrowserState } from "../state/browser-state.ts";
import { createClipboard } from "../state/clipboard.ts";
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

  const record = () => view.records[view.entry().platforms[system()].record];

  return (
    <section class="mt-6 border-t border-edge pt-4" aria-label="Published build">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h3 class="font-bold uppercase">Published build</h3>
        <Show when={published().length > 1}>
          <div class="flex flex-wrap gap-1" role="group" aria-label="Build platform">
            <For each={published()}>
              {(id) => (
                <button
                  type="button"
                  aria-pressed={system() === id}
                  class={cn(
                    "border px-2 py-1 hover:bg-hover",
                    system() === id
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-transparent",
                  )}
                  onClick={() => setChosen(id)}
                >
                  {label(id)}
                </button>
              )}
            </For>
          </div>
        </Show>
      </div>

      <Show when={record()}>
        {(entry) => (
          <div class="mt-4">
            <p class="text-base font-bold">Signature verified</p>
            <p class="mt-1 opacity-80">{label(entry().system)} · Ed25519</p>
            <dl class="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs">
              <div class="flex gap-x-2">
                <dt class="opacity-60">Recipe revision</dt>
                <dd class="tabular-nums">{entry().revision}</dd>
              </div>
              <div class="flex gap-x-2">
                <dt class="opacity-60">Signed</dt>
                <dd class="tabular-nums">
                  {new Date(entry().published * 1000).toISOString().slice(0, 10)}
                </dd>
              </div>
            </dl>

            <details class="mt-4">
              <summary class="w-fit cursor-pointer hover:text-accent">Verification details</summary>
              <dl class="mt-3 grid min-w-0 gap-4 border-l border-edge pl-3">
                <VerificationValue label="Ed25519 signature" value={entry().signature} />
                <Show when={entry().source}>
                  <VerificationValue label="Artifact" value={entry().source} />
                </Show>
                <VerificationValue label="Build receipt SHA-256" value={entry().receiptSha256} />
              </dl>
            </details>
          </div>
        )}
      </Show>
    </section>
  );
}

function VerificationValue(props: { label: string; value: string }) {
  const clipboard = createClipboard();

  createEffect(on(() => props.value, clipboard.reset));

  return (
    <div class="min-w-0">
      <dt class="mb-1 flex items-baseline gap-3 text-xs">
        <span class="opacity-60">{props.label}</span>
        <button
          type="button"
          class="link shrink-0"
          aria-label={`Copy ${props.label.toLowerCase()}`}
          onClick={() => clipboard.copy(props.value)}
        >
          {clipboard.copied() ? "Copied" : "Copy"}
        </button>
      </dt>
      <dd>
        <code class="block overflow-x-auto whitespace-nowrap pb-1 text-xs">{props.value}</code>
        <span role="status" class={clipboard.failed() ? "text-xs opacity-80" : "sr-only"}>
          {clipboard.failed()
            ? "Could not copy. Select and copy the value above."
            : clipboard.copied()
              ? "Copied to clipboard."
              : ""}
        </span>
      </dd>
    </div>
  );
}
