import { For } from "solid-js";
import { platforms } from "#/catalog/types.ts";
import { createClipboard } from "#/lib/clipboard.ts";
import type { PackageView } from "#/lib/package-view.ts";

export default function ProvenancePanel(props: { view: PackageView }) {
  const view = props.view;
  const published = () => platforms.filter(({ id }) => view.entry()[id]);
  return (
    <details class="min-w-0 text-xs">
      <summary class="w-fit cursor-pointer hover:text-accent">
        <span>Signed index · version {view.targets_version}</span>
        <span class="ml-2 underline decoration-edge underline-offset-4">Details</span>
      </summary>
      <p class="mt-3 opacity-80">rb verifies every download against the signed index.</p>
      <p class="mt-2 opacity-60">Index metadata expires {view.expires.slice(0, 10)}.</p>
      <For each={published()}>
        {(platform) => {
          const output = () => view.entry()[platform.id];
          return (
            <section class="mt-4 min-w-0" aria-label={`${platform.id} provenance`}>
              <h4 class="font-bold">
                {platform.short} · {view.selectedVersion()}
              </h4>
              <dl class="mt-3 grid min-w-0 gap-4 border-l border-edge pl-3">
                <VerificationValue label="Store key" value={output().key} />
                <VerificationValue label="Manifest digest" value={output().manifest} />
                <VerificationValue
                  label="OCI reference"
                  value={`ghcr.io/rootbeer-org/store/${view.pkg.name}:${output().key}`}
                />
              </dl>
            </section>
          );
        }}
      </For>
    </details>
  );
}

function VerificationValue(props: { label: string; value: string }) {
  const clipboard = createClipboard();
  const isCopied = () => clipboard.isCopied(props.value);
  const isFailed = () => clipboard.isFailed(props.value);

  return (
    <div class="min-w-0">
      <dt class="mb-1 flex items-baseline gap-3 text-xs">
        <span class="opacity-60">{props.label}</span>
        <button
          type="button"
          class="shrink-0 link"
          aria-label={`Copy ${props.label.toLowerCase()}`}
          onClick={() => clipboard.copy(props.value)}
        >
          {isCopied() ? "Copied" : "Copy"}
        </button>
      </dt>
      <dd>
        <code class="block overflow-x-auto pb-1 text-xs whitespace-nowrap">{props.value}</code>
        <span role="status" class={isFailed() ? "text-xs opacity-80" : "sr-only"}>
          {isFailed()
            ? "Could not copy. Select and copy the value above."
            : isCopied()
              ? "Copied to clipboard."
              : ""}
        </span>
      </dd>
    </div>
  );
}
