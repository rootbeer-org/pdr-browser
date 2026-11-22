import { For } from "solid-js";
import { platforms } from "#/catalog/types.ts";
import { createClipboard } from "#/lib/clipboard.ts";
import type { PackageView } from "#/lib/package-view.ts";

export default function ProvenancePanel(props: { view: PackageView }) {
  const view = props.view;
  const published = () => platforms.filter(({ id }) => view.entry()[id]);
  return (
    <details class="mt-8 text-xs text-muted">
      <summary class="w-fit cursor-pointer hover:text-accent">Verification details</summary>
      <p class="mt-2">
        rb checks every download against these values from the signed index, version{" "}
        {view.targets_version}, which expires {view.expires.slice(0, 10)}.
      </p>
      <dl class="mt-2 grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-4 gap-y-1">
        <For each={published()}>
          {(platform) => {
            const output = () => view.entry()[platform.id];
            return (
              <>
                <dt class="col-span-3 mt-2 font-bold text-fg">
                  {platform.short} {view.selectedVersion()}
                </dt>
                <Value label="Store key" value={output().key} />
                <Value label="Manifest digest" value={output().manifest} />
                <Value
                  label="OCI reference"
                  value={`ghcr.io/rootbeer-org/store/${view.pkg.name}:${output().key}`}
                />
              </>
            );
          }}
        </For>
      </dl>
    </details>
  );
}

function Value(props: { label: string; value: string }) {
  const clipboard = createClipboard();
  return (
    <>
      <dt>{props.label}</dt>
      <dd class="min-w-0 overflow-x-auto whitespace-nowrap">
        <code class="text-fg">{props.value}</code>
      </dd>
      <dd>
        <button
          type="button"
          class="link"
          aria-label={`Copy ${props.label.toLowerCase()}`}
          onClick={() => clipboard.copy(props.value)}
        >
          {clipboard.isCopied(props.value) ? "Copied" : "Copy"}
        </button>
        <span role="status" class="sr-only">
          {clipboard.isFailed(props.value) ? "Could not copy." : ""}
        </span>
      </dd>
    </>
  );
}
