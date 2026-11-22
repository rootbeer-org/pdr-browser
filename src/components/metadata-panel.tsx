import { For, Show } from "solid-js";
import type { PackageView } from "#/lib/package-view.ts";

const day = (seconds?: number) =>
  seconds === undefined ? "" : new Date(seconds * 1000).toISOString().slice(0, 10);

export default function MetadataPanel(props: { view: PackageView }) {
  const view = props.view;
  const facts = [
    ["License", view.pkg.license],
    ["Maintainers", view.pkg.maintainers.join(", ")],
    ["Updated", day(view.pkg.updated)],
    ["Added", day(view.pkg.added)],
  ].filter(([, value]) => value);

  return (
    <section class="flex flex-col gap-y-4" aria-label={`${view.pkg.name} package details`}>
      <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
        <For each={facts}>
          {([label, value]) => (
            <>
              <dt class="opacity-50">{label}</dt>
              <dd class="tabular-nums">{value}</dd>
            </>
          )}
        </For>
      </dl>
      <Show when={view.apps().length}>
        <div>
          <h3 class="heading">Apps provided</h3>
          <p class="flex flex-wrap gap-x-3 opacity-80">
            <For each={view.apps()}>{(name) => <code>{name}</code>}</For>
          </p>
        </div>
      </Show>
      <Show when={view.output().bins.length}>
        <div>
          <h3 class="heading">Commands provided</h3>
          <p class="flex flex-wrap gap-x-3 opacity-80">
            <For each={view.output().bins}>{(name) => <code>{name}</code>}</For>
          </p>
        </div>
      </Show>
      <Show when={view.pkg.aliases.length}>
        <p class="opacity-80">
          Aliases:<For each={view.pkg.aliases}>{(alias) => <code class="ml-2">{alias}</code>}</For>
        </p>
      </Show>
    </section>
  );
}
