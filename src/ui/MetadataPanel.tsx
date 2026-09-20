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
    <section aria-label={`${view.pkg.name} package details`}>
      <h3>
        {view.isLibrary() ? "Libraries provided" : "Commands provided"}{" "}
        <span>{view.selectedVersion()}</span>
      </h3>
      <div>
        <For each={view.recipe().bins}>
          {(name) => (
            <button
              type="button"
              title={`Show how to run ${name}`}
              onClick={() => view.chooseCommand(name)}
            >
              <code>{name}</code>
            </button>
          )}
        </For>
      </div>

      <Show when={view.recipe().build?.libraries?.length}>
        <Show when={!view.isLibrary()}>
          <h3>Libraries provided</h3>
        </Show>
        <p>
          <For each={view.recipe().build!.libraries}>{(library) => <code>{library}</code>}</For>
        </p>
      </Show>

      <Show when={view.pkg.aliases.length}>
        <p>
          Package aliases: <For each={view.pkg.aliases}>{(alias) => <code>{alias}</code>}</For>
        </p>
      </Show>

      <Show when={Object.keys(view.recipe().apps ?? {}).length}>
        <h3>Apps provided</h3>
        <p>
          <For each={Object.keys(view.recipe().apps!)}>{(name) => <code>{name}</code>}</For>
        </p>
      </Show>

      <h3>Dependencies</h3>
      <For each={dependencyGroups()}>
        {(group) => (
          <div>
            <p>{group.description}</p>
            <ul>
              <For each={group.entries}>
                {(dependency) => (
                  <li>
                    <a href={packageHref(dependency.name, dependency.version, platform())}>
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
        <p>No package dependencies declared.</p>
      </Show>

      <h3>Platform defaults</h3>
      <p>The version installed on each platform unless you choose a specific version.</p>
      <dl>
        <For each={platforms}>
          {(entry) => (
            <div>
              <dt>{entry.label}</dt>
              <dd>{platformDefault(entry.id)}</dd>
            </div>
          )}
        </For>
      </dl>
    </section>
  );
}
