import { For, Show, type JSX } from "solid-js";
import type { PackageView } from "#/lib/package-view.ts";
import { packageHref, recipesUrl } from "#/site.ts";

const day = (seconds?: number) =>
  seconds === undefined ? "" : new Date(seconds * 1000).toISOString().slice(0, 10);

function Names(props: { names: string[]; href?: (name: string) => string }) {
  return (
    <span class="flex flex-wrap gap-x-2">
      <For each={props.names}>
        {(name) => (
          <Show when={props.href} fallback={<code>{name}</code>}>
            {(href) => (
              <a class="link" href={href()(name)}>
                {name}
              </a>
            )}
          </Show>
        )}
      </For>
    </span>
  );
}

export default function MetadataPanel(props: { view: PackageView; usedBy: string[] }) {
  const view = props.view;
  const packageLink = (name: string) => packageHref(name, "", view.system());
  const built = () => {
    const build = view.output().build;
    if (!build) return "";
    if (build === "prebuilt") return "upstream binary";
    return build === "custom" ? "from source" : `from source with ${build}`;
  };
  const releaseNotes = () => {
    const { repository } = view.pkg;
    const { tag } = view.output();
    if (!tag || !repository?.startsWith("https://github.com/")) return "";
    return `${repository}/releases/tag/${encodeURIComponent(tag)}`;
  };

  const facts = (): [string, JSX.Element][] =>
    [
      ["License", view.pkg.license.replace(/^LicenseRef-/, "")],
      ["Built", built()],
      ["Apps", view.apps().length && <Names names={view.apps()} />],
      ["Commands", view.output().bins.length && <Names names={view.output().bins} />],
      ["Aliases", view.pkg.aliases.length && <Names names={view.pkg.aliases} />],
      [
        "Requires",
        view.output().runtime_dependencies.length && (
          <Names names={view.output().runtime_dependencies} href={packageLink} />
        ),
      ],
      ["Used by", props.usedBy.length && <Names names={props.usedBy} href={packageLink} />],
      ["Host needs", view.output().host.length && <Names names={view.output().host} />],
      ["Updated", day(view.pkg.updated)],
      ["Added", day(view.pkg.added)],
    ].filter((fact): fact is [string, JSX.Element] => Boolean(fact[1]));

  return (
    <section aria-label={`${view.pkg.name} details`}>
      <h2 class="heading">Details</h2>
      <dl class="mt-2 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
        <For each={facts()}>
          {([label, value]) => (
            <>
              <dt class="text-muted">{label}</dt>
              <dd class="tabular-nums">{value}</dd>
            </>
          )}
        </For>
      </dl>
      <p class="mt-3 flex flex-wrap gap-x-4">
        <Show when={view.pkg.homepage}>
          <a class="link" href={view.pkg.homepage}>
            Homepage
          </a>
        </Show>
        <Show when={view.pkg.repository}>
          <a class="link" href={view.pkg.repository}>
            Source
          </a>
        </Show>
        <Show when={releaseNotes()}>
          <a class="link" href={releaseNotes()}>
            Release notes
          </a>
        </Show>
        <a class="link" href={`${recipesUrl}/blob/main/packages/${view.pkg.name}.lua`}>
          Recipe
        </a>
        <a class="link" href={`/packages/${view.pkg.name}/data.json`}>
          JSON
        </a>
      </p>
    </section>
  );
}
