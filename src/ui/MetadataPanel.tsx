import { For, Show } from "solid-js";
import { packageDependencies } from "../catalog/commands.ts";
import { platforms } from "../catalog/types.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { platform } from "../state/browser-state.ts";
import { packageHref } from "../state/links.ts";
import type { PackageView } from "../state/package-view.ts";

const GROUP_DESCRIPTIONS: Record<string, string> = {
  "Build / link": "Tools and libraries used to build this package.",
  Build: "Tools used during compilation.",
  Link: "Libraries linked during compilation.",
  Runtime: "Packages required when running this package.",
  "Link / runtime": "Libraries needed during compilation and at runtime.",
};

export default function MetadataPanel(props: { view: PackageView }) {
  const view = props.view;

  const dependencies = () => packageDependencies(view.recipe());
  const dependencyGroups = () =>
    [...new Set(dependencies().map((dependency) => dependency.kind))].map((kind) => ({
      kind,
      description: GROUP_DESCRIPTIONS[kind],
      entries: dependencies().filter((dependency) => dependency.kind === kind),
    }));

  const platformDefault = (system: string) => {
    const preferred = defaultVersion(view.pkg, system);
    return view.pkg.versions[preferred]?.systems.includes(system) ? preferred : "Not available";
  };

  return (
    <section class="flex flex-col gap-y-4" aria-label={`${view.pkg.name} package details`}>
      <div>
        <h3 class="heading">
          <span>{view.isLibrary() ? "Libraries provided" : "Commands provided"}</span>
          <span class="ml-auto opacity-50">{view.selectedVersion()}</span>
        </h3>
        <div class="flex flex-wrap gap-2">
          <For each={view.recipe().bins}>
            {(name) => (
              <button
                type="button"
                title={`Show how to run ${name}`}
                class="border border-edge px-2 py-0.5 hover:bg-hover"
                onClick={() => view.chooseCommand(name)}
              >
                <code>{name}</code>
              </button>
            )}
          </For>
        </div>
      </div>

      <Show when={view.recipe().build?.libraries?.length}>
        <div>
          <Show when={!view.isLibrary()}>
            <h3 class="heading">Libraries provided</h3>
          </Show>
          <p class="flex flex-wrap gap-x-3 opacity-80">
            <For each={view.recipe().build!.libraries}>{(library) => <code>{library}</code>}</For>
          </p>
        </div>
      </Show>

      <Show when={view.pkg.aliases.length}>
        <p class="opacity-80">
          Aliases:
          <For each={view.pkg.aliases}>{(alias) => <code class="ml-2">{alias}</code>}</For>
        </p>
      </Show>

      <Show when={Object.keys(view.recipe().apps ?? {}).length}>
        <div>
          <h3 class="heading">Apps provided</h3>
          <p class="flex flex-wrap gap-x-3 opacity-80">
            <For each={Object.keys(view.recipe().apps!)}>{(name) => <code>{name}</code>}</For>
          </p>
        </div>
      </Show>

      <div>
        <h3 class="heading">Dependencies</h3>
        <For each={dependencyGroups()}>
          {(group) => (
            <div class="mb-2">
              <p class="opacity-50">{group.description}</p>
              <ul class="mt-1 flex flex-col gap-y-1">
                <For each={group.entries}>
                  {(dependency) => (
                    <li>
                      <a
                        class="text-accent hover:underline"
                        href={packageHref(dependency.name, dependency.version, platform())}
                      >
                        <code>{dependency.request}</code>
                      </a>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          )}
        </For>
        <Show when={!dependencies().length}>
          <p class="opacity-50">No package dependencies declared.</p>
        </Show>
      </div>

      <div>
        <h3 class="heading">Platform defaults</h3>
        <dl class="border border-edge">
          <For each={platforms}>
            {(entry) => (
              <div class="flex items-baseline justify-between gap-x-4 border-b border-edge px-2 py-1 last:border-b-0">
                <dt class={entry.id === platform() ? "font-bold text-accent" : "opacity-80"}>
                  {entry.label}
                </dt>
                <dd class="tabular-nums">{platformDefault(entry.id)}</dd>
              </div>
            )}
          </For>
        </dl>
      </div>
    </section>
  );
}
