import {
  For,
  Show,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  onMount,
} from "solid-js";
import { packageDependencies } from "../catalog/commands.ts";
import { dependencyTreeRows, loadDependencyGraph } from "../catalog/dependencies.ts";
import { platforms } from "../catalog/types.ts";
import { packageHref } from "../state/links.ts";
import type { PackageView } from "../state/package-view.ts";
import { findPackage } from "../state/queries.ts";

export default function DependencyTree(props: { view: PackageView }) {
  return (
    <details open class="mt-6 border-t border-edge pt-4" aria-label="Dependencies">
      <summary class="mb-3 w-fit cursor-pointer hover:text-accent">
        <span class="font-bold uppercase">Dependencies</span>
        <span class="ml-2 tabular-nums opacity-70">
          · {packageDependencies(props.view.recipe()).length} direct
        </span>
      </summary>
      <Show
        when={packageDependencies(props.view.recipe()).length}
        fallback={<p class="opacity-80">No dependencies declared.</p>}
      >
        <Show when={`${props.view.selectedVersion()}:${props.view.system()}`} keyed>
          {(_selection) => <DependencyGraph view={props.view} />}
        </Show>
      </Show>
    </details>
  );
}

function DependencyGraph(props: { view: PackageView }) {
  const [isReady, setIsReady] = createSignal(false);
  onMount(() => setIsReady(true));
  const [nodes, { refetch }] = createResource(isReady, () =>
    loadDependencyGraph(
      {
        name: props.view.pkg.name,
        version: props.view.selectedVersion(),
        recipe: props.view.recipe(),
      },
      props.view.system(),
      findPackage,
    ),
  );
  const label = () => platforms.find(({ id }) => id === props.view.system())?.short;
  const rootKey = () => `${props.view.pkg.name}@${props.view.selectedVersion()}`;
  const rows = createMemo(() => dependencyTreeRows(rootKey(), nodes() ?? []));
  const treeId = createUniqueId();
  const targetId = (key: string) => `${treeId}-${encodeURIComponent(key)}`;
  const hasErrors = () => nodes()?.some((node) => node.error);

  return (
    <>
      <p class="text-xs opacity-60">{label()} · Shared branches are shown once</p>
      <Show
        when={nodes() && !nodes.loading}
        fallback={
          <p role="status" class="mt-3 opacity-60">
            Loading dependencies…
          </p>
        }
      >
        <div
          class="mt-3 overflow-x-auto pb-2 leading-6"
          tabIndex={0}
          role="region"
          aria-label="Dependency tree"
        >
          <p class="font-bold">{rootKey()}</p>
          <ul class="grid w-max min-w-full grid-cols-[max-content_max-content_1fr] gap-x-3">
            <For each={rows()}>
              {(row) => (
                <li
                  id={row.isShared ? undefined : targetId(row.key)}
                  tabIndex={-1}
                  class="col-span-3 grid grid-cols-subgrid items-baseline target:bg-accent-soft"
                  aria-label={`${row.key}, dependency of ${row.parent}`}
                >
                  <span class="whitespace-nowrap">
                    <span aria-hidden="true" class="whitespace-pre text-ink opacity-40">
                      {row.prefix}
                    </span>
                    <a
                      class="text-accent hover:underline"
                      href={packageHref(row.node.name, row.node.version, props.view.system())}
                    >
                      {row.node.name}
                      <span class="text-ink opacity-60">@{row.node.version || "unknown"}</span>
                    </a>
                  </span>
                  <span class="whitespace-nowrap text-xs opacity-60">{row.kind.toLowerCase()}</span>
                  <span class="whitespace-nowrap text-xs">
                    <Show when={row.isShared}>
                      <a
                        class="link opacity-70 hover:opacity-100"
                        href={`#${encodeURIComponent(targetId(row.key))}`}
                        aria-label={`Jump to first occurrence of ${row.key}`}
                      >
                        ↩ shared
                      </a>
                    </Show>
                    <Show when={row.node.error}>
                      <span class="ml-2 opacity-80">{row.node.error}</span>
                    </Show>
                  </span>
                </li>
              )}
            </For>
          </ul>
        </div>
        <Show when={hasErrors()}>
          <p role="status" class="mt-3 text-xs opacity-80">
            Some dependencies could not be resolved; this list may be incomplete.
            <button type="button" class="link ml-2" onClick={() => refetch()}>
              Retry
            </button>
          </p>
        </Show>
      </Show>
    </>
  );
}
