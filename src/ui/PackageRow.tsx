import { For, Show } from "solid-js";
import { cn } from "cn";
import { platforms, type CatalogPackage } from "../catalog/types.ts";
import { packageKind } from "../catalog/commands.ts";
import { availableVersions, preferredVersion } from "../catalog/versions.ts";
import { expanded, platform, toggleExpanded } from "../state/browser-state.ts";
import { sourceHref } from "../state/links.ts";
import PackageDetails from "./PackageDetails.tsx";

export default function PackageRow(props: { pkg: CatalogPackage }) {
  const version = () => preferredVersion(props.pkg, platform());
  const recipe = () => props.pkg.versions[version()];
  const outputs = () => {
    const entry = recipe();
    if (!entry) return { label: "", names: [] as string[] };
    const kind = packageKind(entry);
    if (kind === "command") return { label: "Commands", names: entry.bins };
    if (kind === "app") return { label: "Apps", names: Object.keys(entry.apps ?? {}) };
    return { label: "Libraries", names: entry.build?.libraries ?? [] };
  };
  const isExpanded = () => expanded() === props.pkg.name;

  /** Nearly every package builds everywhere, so only the exceptions are worth a line. */
  const limitedTo = () => {
    const available = platforms.filter(({ id }) => availableVersions(props.pkg, id).length);
    return available.length === platforms.length
      ? ""
      : `${available.map(({ short }) => short).join(" · ")} only`;
  };

  const source = () => sourceHref(props.pkg.versions[version()]);

  return (
    <article class={cn("border-b border-edge last:border-b-0", isExpanded() && "bg-inset")}>
      <h2>
        <button
          type="button"
          aria-expanded={isExpanded()}
          aria-controls={`details-${props.pkg.name}`}
          class="flex w-full flex-wrap items-baseline gap-x-2 px-3 pt-3 pb-0.5 text-left hover:bg-hover focus-visible:-outline-offset-2"
          onClick={() => toggleExpanded(props.pkg.name)}
        >
          <span aria-hidden="true" class="opacity-50">
            {isExpanded() ? "▾" : "▸"}
          </span>
          <span class="font-bold text-accent">{props.pkg.name}</span>
          <span class="opacity-80">{version()}</span>
        </button>
      </h2>
      <p class="px-3 pl-8 opacity-80">{props.pkg.description}</p>
      <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 pt-0.5 pb-3 pl-8 opacity-50">
        <span>
          {outputs().label}
          <For each={outputs().names}>{(name) => <code class="ml-2">{name}</code>}</For>
        </span>
        <Show when={limitedTo()}>
          <span>{limitedTo()}</span>
        </Show>
        <span class="ml-auto flex flex-wrap gap-x-3">
          <a class="link" href={props.pkg.homepage} target="_blank" rel="noopener noreferrer">
            Homepage ↗
          </a>
          <Show when={source()}>
            <a class="link" href={source()} target="_blank" rel="noopener noreferrer">
              Source ↗
            </a>
          </Show>
        </span>
      </div>
      <div id={`details-${props.pkg.name}`} hidden={!isExpanded()}>
        <Show when={isExpanded()}>
          <PackageDetails pkg={props.pkg} />
        </Show>
      </div>
    </article>
  );
}
