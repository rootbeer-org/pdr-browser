import { For, Show } from "solid-js";
import { cn } from "cn";
import { platforms, type CatalogPackage } from "../catalog/types.ts";
import { availableVersions, preferredVersion } from "../catalog/versions.ts";
import { expanded, platform, toggleExpanded } from "../state/browser-state.ts";
import PackageDetails from "./PackageDetails.tsx";

export default function PackageRow(props: { pkg: CatalogPackage }) {
  const version = () => preferredVersion(props.pkg, platform());
  const bins = () => props.pkg.versions[version()]?.bins ?? [];
  const isExpanded = () => expanded() === props.pkg.name;

  /** Nearly every package builds everywhere, so only the exceptions are worth a line. */
  const limitedTo = () => {
    const available = platforms.filter(({ id }) => availableVersions(props.pkg, id).length);
    return available.length === platforms.length
      ? ""
      : `${available.map(({ short }) => short).join(" · ")} only`;
  };

  return (
    <article class={cn("border-b border-edge last:border-b-0", isExpanded() && "bg-inset")}>
      <h2>
        <button
          type="button"
          aria-expanded={isExpanded()}
          aria-controls={`details-${props.pkg.name}`}
          class="flex w-full flex-wrap items-baseline gap-x-2 px-3 pt-3 pb-0.5 text-left hover:bg-hover"
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
          {bins().length ? "Commands" : "Library"}
          <For each={bins()}>{(bin) => <code class="ml-2">{bin}</code>}</For>
        </span>
        <Show when={limitedTo()}>
          <span class="ml-auto">{limitedTo()}</span>
        </Show>
      </div>
      <div id={`details-${props.pkg.name}`} hidden={!isExpanded()}>
        <Show when={isExpanded()}>
          <PackageDetails pkg={props.pkg} />
        </Show>
      </div>
    </article>
  );
}
