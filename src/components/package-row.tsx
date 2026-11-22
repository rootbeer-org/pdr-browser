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
  const names = () => {
    const all = [...packageApps(props.pkg, system()), ...packageCommands(props.pkg, system())];
    const terms = options().query.toLowerCase().split(/\s+/).filter(Boolean);
    const isMatch = (name: string) => terms.some((term) => name.toLowerCase().includes(term));
    return [...all.filter(isMatch), ...all.filter((name) => !isMatch(name))];
  };

  const note = () => {
    if (options().sort === "added" && props.pkg.added) return `added ${day(props.pkg.added)}`;
    if (options().sort === "updated" && props.pkg.updated) {
      return `updated ${day(props.pkg.updated)}`;
    }
    const available = platforms.filter(({ id }) => props.pkg.default[id]);
    if (available.length === platforms.length) return "";
    return `${available.map(({ short }) => short).join(", ")} only`;
  };

  return (
    <li class="border-b border-border">
      <a
        href={packageHref(props.pkg.name, "", system())}
        class="block px-2 py-2 hover:bg-surface focus-visible:-outline-offset-2"
      >
        <span class="flex flex-wrap items-baseline gap-x-2">
          <strong class="text-accent">{props.pkg.name}</strong>
          <span class="text-muted">{defaultVersion(props.pkg, system())}</span>
          <Show when={note()}>
            <span class="ml-auto text-xs text-muted">{note()}</span>
          </Show>
        </span>
        <span class="block">{props.pkg.description}</span>
        <span class="flex flex-wrap gap-x-2 text-xs text-muted">
          <Show when={names().length} fallback="library">
            <For each={names().slice(0, MAX_NAMES)}>{(name) => <code>{name}</code>}</For>
            <Show when={names().length > MAX_NAMES}>
              <span>+{names().length - MAX_NAMES} more</span>
            </Show>
          </Show>
        </span>
      </a>
    </li>
  );
}
