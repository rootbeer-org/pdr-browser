import { For, Show } from "solid-js";
import { platforms, type RootPackage } from "../catalog/types.ts";
import { packageCommands } from "../catalog/search.ts";
import { defaultVersion } from "../catalog/versions.ts";
import { useBrowserState } from "../state/browser-state.ts";
import { packageHref } from "../state/links.ts";

const KIND_LABELS = { command: "Command", library: "Library", app: "App" };

export default function PackageRow(props: { pkg: RootPackage }) {
  const { platform } = useBrowserState();
  const version = () => defaultVersion(props.pkg, platform());
  const commands = () => packageCommands(props.pkg, platform());
  const kind = () =>
    (props.pkg.platforms[platform()] ?? Object.values(props.pkg.platforms)[0]).kind;

  /** Nearly every package builds everywhere, so only the exceptions are worth a line. */
  const limitedTo = () => {
    const available = platforms.filter(({ id }) => props.pkg.platforms[id]);
    return available.length === platforms.length
      ? ""
      : `${available.map(({ short }) => short).join(" · ")} only`;
  };

  return (
    <article class="border-b border-edge last:border-b-0">
      <h2>
        <a
          href={packageHref(props.pkg.name, "", platform())}
          class="flex w-full flex-wrap items-baseline gap-x-2 px-3 pt-3 pb-0.5 text-left hover:bg-hover focus-visible:-outline-offset-2"
        >
          <span class="font-bold text-accent">{props.pkg.name}</span>
          <span class="opacity-80">{version()}</span>
        </a>
      </h2>
      <p class="px-3 opacity-80">{props.pkg.description}</p>
      <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 pt-0.5 pb-3 opacity-50">
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
    </article>
  );
}
