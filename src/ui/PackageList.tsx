import { For, Show } from "solid-js";
import { docs } from "../config.ts";
import { expanded } from "../state/browser-state.ts";
import { packages, results } from "../state/catalog-resource.ts";
import PackageRow from "./PackageRow.tsx";

export default function PackageList() {
  const isMissing = () => expanded() && !packages().some((pkg) => pkg.name === expanded());

  return (
    <>
      <Show when={isMissing()}>
        <p>“{expanded()}” is not in the published collection.</p>
      </Show>
      <div>
        <For each={results()}>{(pkg) => <PackageRow pkg={pkg} />}</For>
      </div>
      <p>
        <a href={docs.packaging} target="_blank" rel="noopener noreferrer">
          Missing a tool? Contribute a package →
        </a>
      </p>
    </>
  );
}
