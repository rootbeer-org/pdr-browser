import { For, Show } from "solid-js";
import { platforms, type PackageSummary } from "#/catalog/types.ts";
import { packageApps, packageCommands } from "#/catalog/search.ts";
import { defaultVersion } from "#/catalog/versions.ts";
import { urlState } from "#/lib/url-state.ts";
import { packageHref } from "#/site.ts";

const day = (seconds: number) => new Date(seconds * 1000).toISOString().slice(0, 10);
const MAX_NAMES = 8;

export default function PackageRow(props: { pkg: PackageSummary }) {
  const { system, options } = urlState;
  const version = () => defaultVersion(props.pkg, system());
  const commands = () => packageCommands(props.pkg, system());
  const apps = () => packageApps(props.pkg, system());

  const shown = (names: string[]) => {
    const terms = options().query.toLowerCase().split(/\s+/).filter(Boolean);
    const isMatch = (name: string) => terms.some((term) => name.toLowerCase().includes(term));
    return [...names.filter(isMatch), ...names.filter((name) => !isMatch(name))];
  };

  const limitedTo = () => {
    const available = platforms.filter(({ id }) => props.pkg.default[id]);
    return available.length === platforms.length
      ? ""
      : `${available.map(({ short }) => short).join(" · ")} only`;
  };

  const date = () => {
    if (options().sort === "added" && props.pkg.added) return `Added ${day(props.pkg.added)}`;
    if (options().sort === "updated" && props.pkg.updated)
      return `Updated ${day(props.pkg.updated)}`;
    return "";
  };

  return (
    <article class="border-b border-edge last:border-b-0">
      <h2>
        <a
          href={packageHref(props.pkg.name, "", system())}
          class="flex w-full flex-wrap items-baseline gap-x-2 px-3 pt-3 pb-0.5 text-left hover:bg-hover focus-visible:-outline-offset-2"
        >
          <span class="font-bold text-accent">{props.pkg.name}</span>
          <span class="opacity-80">{version()}</span>
          <Show when={date()}>
            <span class="ml-auto text-xs tabular-nums opacity-50">{date()}</span>
          </Show>
        </a>
      </h2>
      <p class="px-3 opacity-80">{props.pkg.description}</p>
      <div class="flex flex-wrap items-baseline gap-x-4 gap-y-1 px-3 pt-0.5 pb-3 opacity-50">
        <Show when={apps().length}>
          <span class="flex flex-wrap gap-x-2">
            {apps().length === 1 ? "App" : "Apps"}
            <For each={shown(apps()).slice(0, MAX_NAMES)}>{(name) => <code>{name}</code>}</For>
            <Show when={apps().length > MAX_NAMES}>
              <span>+{apps().length - MAX_NAMES} more apps</span>
            </Show>
          </span>
        </Show>
        <Show when={commands().length}>
          <span class="flex flex-wrap gap-x-2">
            {commands().length === 1 ? "Command" : "Commands"}
            <For each={shown(commands()).slice(0, MAX_NAMES)}>{(name) => <code>{name}</code>}</For>
            <Show when={commands().length > MAX_NAMES}>
              <span>+{commands().length - MAX_NAMES} more commands</span>
            </Show>
          </span>
        </Show>
        <Show when={!apps().length && !commands().length}>
          <span>Library</span>
        </Show>
        <Show when={limitedTo()}>
          <span>{limitedTo()}</span>
        </Show>
        <Show when={props.pkg.homepage}>
          <a
            class="ml-auto link"
            href={props.pkg.homepage}
            target="_blank"
            rel="noopener noreferrer"
          >
            Homepage ↗
          </a>
        </Show>
      </div>
    </article>
  );
}
