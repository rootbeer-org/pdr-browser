import { For, Show } from "solid-js";
import { packageDependencies } from "../catalog/commands.ts";
import { platform } from "../state/browser-state.ts";
import { packageHref } from "../state/links.ts";
import type { PackageView } from "../state/package-view.ts";
import ProvenancePanel from "./ProvenancePanel.tsx";

const KIND_LABELS: Record<string, string> = {
  "Build / link": "build/link",
  Build: "build",
  Link: "link",
  Runtime: "runtime",
  "Link / runtime": "link/runtime",
};

export default function MetadataPanel(props: { view: PackageView }) {
  const view = props.view;

  const dependencies = () => packageDependencies(view.recipe());
  const day = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0, 10);
  const facts = () =>
    [
      ["License", view.pkg.license],
      ["Maintainers", view.pkg.maintainers.join(", ")],
      ["Updated", view.pkg.updated ? day(view.pkg.updated) : ""],
      ["Added", view.pkg.added ? day(view.pkg.added) : ""],
    ].filter(([, value]) => value);
  const backend = () => view.recipe().build?.backend ?? (view.recipe().source ? "prebuilt" : "");

  return (
    <section class="flex flex-col gap-y-4" aria-label={`${view.pkg.name} package details`}>
      <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4">
        <For each={facts()}>
          {([label, value]) => (
            <>
              <dt class="opacity-50">{label}</dt>
              <dd class="tabular-nums">{value}</dd>
            </>
          )}
        </For>
      </dl>

      <Show when={backend()}>
        <p class="opacity-80">
          {backend() === "prebuilt" ? (
            <>Repackaged from an upstream release.</>
          ) : (
            <>
              Built from source by Rootbeer · <code>{backend()}</code>
            </>
          )}
        </p>
      </Show>

      <Show when={view.recipe().build?.libraries?.length}>
        <div>
          <h3 class="heading">Libraries provided</h3>
          <p class="flex flex-wrap gap-x-3 opacity-80">
            <For each={view.recipe().build!.libraries}>{(library) => <code>{library}</code>}</For>
          </p>
        </div>
      </Show>

      <Show when={Object.keys(view.recipe().apps ?? {}).length}>
        <div>
          <h3 class="heading">Apps provided</h3>
          <p class="flex flex-wrap gap-x-3 opacity-80">
            <For each={Object.keys(view.recipe().apps!)}>{(name) => <code>{name}</code>}</For>
          </p>
        </div>
      </Show>

      <Show when={view.pkg.aliases.length}>
        <p class="opacity-80">
          Aliases:
          <For each={view.pkg.aliases}>{(alias) => <code class="ml-2">{alias}</code>}</For>
        </p>
      </Show>

      <Show when={dependencies().length}>
        <div>
          <h3 class="heading">
            <span>Dependencies</span>
            <span class="ml-auto tabular-nums opacity-50">{dependencies().length}</span>
          </h3>
          <ul class="flex flex-col gap-y-1">
            <For each={dependencies()}>
              {(dependency) => (
                <li class="flex flex-wrap items-baseline justify-between gap-x-3">
                  <a
                    class="text-accent hover:underline"
                    href={packageHref(dependency.name, dependency.version, platform())}
                  >
                    <code>{dependency.request}</code>
                  </a>
                  <span class="opacity-50">{KIND_LABELS[dependency.kind] ?? dependency.kind}</span>
                </li>
              )}
            </For>
          </ul>
        </div>
      </Show>

      <ProvenancePanel view={view} />
    </section>
  );
}
