import { For, Show } from "solid-js";
import { platforms, type CatalogPackage } from "../catalog/types.ts";
import { availableVersions, preferredVersion } from "../catalog/versions.ts";
import { expanded, platform, toggleExpanded } from "../state/browser-state.ts";
import PackageDetails from "./PackageDetails.tsx";

export default function PackageRow(props: { pkg: CatalogPackage }) {
  const version = () => preferredVersion(props.pkg, platform());
  const bins = () => props.pkg.versions[version()]?.bins ?? [];
  const isExpanded = () => expanded() === props.pkg.name;

  const summaryPlatforms = () =>
    platforms
      .filter(({ id }) => availableVersions(props.pkg, id).length)
      .map(({ short }) => short)
      .join(" · ");

  return (
    <article>
      <h2>
        <button
          type="button"
          aria-expanded={isExpanded()}
          aria-controls={`details-${props.pkg.name}`}
          onClick={() => toggleExpanded(props.pkg.name)}
        >
          <span>{props.pkg.name}</span> <span>{version()}</span>{" "}
          <span aria-hidden="true">{isExpanded() ? "−" : "+"}</span>
        </button>
      </h2>
      <p>{props.pkg.description}</p>
      <div>
        <span>
          {bins().length ? "Commands" : "Library"}{" "}
          <For each={bins()}>{(bin) => <code>{bin}</code>}</For>
        </span>
        <span>{summaryPlatforms()}</span>
      </div>
      <div id={`details-${props.pkg.name}`} hidden={!isExpanded()}>
        <Show when={isExpanded()}>
          <PackageDetails pkg={props.pkg} />
        </Show>
      </div>
    </article>
  );
}
