import { For, createEffect, on } from "solid-js";
import { platforms } from "../catalog/types.ts";
import { createClipboard } from "../state/clipboard.ts";
import type { PackageView } from "../state/package-view.ts";

export default function ProvenancePanel(props: { view: PackageView }) {
  const view = props.view;
  return (
    <details class="min-w-0 text-xs">
      <summary class="w-fit cursor-pointer hover:text-accent">
        <span>Signed index · version {view.targets_version}</span>
        <span class="ml-2 underline decoration-edge underline-offset-4">Details</span>
      </summary>
      <p class="mt-3 opacity-80">rb verifies every download against the signed index.</p>
      <p class="mt-2 opacity-60">
        Index metadata expires {new Date(view.expires).toISOString().slice(0, 10)}.
      </p>
      <For each={view.systems()}>
        {(system) => (
          <section class="mt-4 min-w-0" aria-label={`${system} provenance`}>
            <h4 class="font-bold">
              {platforms.find(({ id }) => id === system)?.short} · {view.selectedVersion()}
            </h4>
            <dl class="mt-3 grid min-w-0 gap-4 border-l border-edge pl-3">
              <VerificationValue label="Store key" value={view.entry()[system].key} />
              <VerificationValue label="Manifest digest" value={view.entry()[system].manifest} />
              <VerificationValue
                label="OCI reference"
                value={`ghcr.io/rootbeer-org/store/${view.pkg.name}:${view.entry()[system].key}`}
              />
            </dl>
          </section>
        )}
      </For>
    </details>
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
