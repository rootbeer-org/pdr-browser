import { Show, createEffect, on } from "solid-js";
import { platforms } from "../catalog/types.ts";
import { createClipboard } from "../state/clipboard.ts";
import type { PackageView } from "../state/package-view.ts";

export default function ProvenancePanel(props: { view: PackageView }) {
  const view = props.view;
  const label = (id: string) => platforms.find((entry) => entry.id === id)?.short ?? id;

  const record = () => view.records[view.entry().platforms[view.system()].record];

  return (
    <Show when={record()}>
      {(entry) => (
        <details class="min-w-0 text-xs">
          <summary class="w-fit cursor-pointer hover:text-accent">
            <span>Signature verified</span>
            <span class="ml-2 opacity-70">
              · {label(entry().system)} · {view.selectedVersion()}
            </span>
            <span class="ml-2 underline decoration-edge underline-offset-4">Details</span>
          </summary>
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

          <dl class="mt-3 grid min-w-0 gap-4 border-l border-edge pl-3">
            <VerificationValue label="Ed25519 signature" value={entry().signature} />
            <Show when={entry().source}>
              <VerificationValue label="Artifact" value={entry().source} />
            </Show>
            <VerificationValue label="Build receipt SHA-256" value={entry().receiptSha256} />
          </dl>
        </details>
      )}
    </Show>
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
