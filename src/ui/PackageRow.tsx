import { For, Show } from "solid-js";
import { cn } from "cn";
import { platforms, type RootPackage } from "../catalog/types.ts";
import { packageCommands } from "../catalog/search.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { expanded, platform, toggleExpanded } from "../state/browser-state.ts";
import PackageDetails from "./PackageDetails.tsx";

const KIND_LABELS = { command: "Command", library: "Library", app: "App" };

export default function PackageRow(props: { pkg: RootPackage }) {
  const version = () => defaultVersion(props.pkg, platform());
  const commands = () => packageCommands(props.pkg, platform());
  const kind = () =>
    (props.pkg.platforms[platform()] ?? Object.values(props.pkg.platforms)[0]).kind;
  const isExpanded = () => expanded() === props.pkg.name;

  /** Nearly every package builds everywhere, so only the exceptions are worth a line. */
  const limitedTo = () => {
    const available = platforms.filter(({ id }) => props.pkg.platforms[id]);
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
        <Show when={commands().length} fallback={<span>{KIND_LABELS[kind()]}</span>}>
          <span>
            Commands
            <For each={commands()}>{(name) => <code class="ml-2">{name}</code>}</For>
          </span>
        </Show>
        <Show when={limitedTo()}>
          <span>{limitedTo()}</span>
        </Show>
        <a class="link ml-auto" href={props.pkg.homepage} target="_blank" rel="noopener noreferrer">
          Homepage ↗
        </a>
      </div>
      <div id={`details-${props.pkg.name}`} hidden={!isExpanded()}>
        <Show when={isExpanded()}>
          <PackageDetails pkg={props.pkg} />
        </Show>
      </div>
    </article>
  );
}
