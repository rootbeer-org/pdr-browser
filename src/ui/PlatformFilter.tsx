import { For } from "solid-js";
import { platforms } from "../catalog/types.ts";
import { filterPlatform, platform } from "../state/browser-state.ts";
import { catalog, platformCounts, queryCount } from "../state/catalog-resource.ts";

export default function PlatformFilter() {
  const count = (value: number) => (catalog.loading ? "—" : value);

  return (
    <fieldset>
      <legend>Platform</legend>
      <label>
        <input
          type="radio"
          name="platform"
          value=""
          checked={!platform()}
          onChange={() => filterPlatform("")}
        />
        <span>All platforms</span>
        <span>{count(queryCount())}</span>
      </label>
      <For each={platforms}>
        {(entry) => (
          <label>
            <input
              type="radio"
              name="platform"
              value={entry.id}
              checked={platform() === entry.id}
              onChange={() => filterPlatform(entry.id)}
            />
            <span>{entry.label}</span>
            <span>{count(platformCounts()[entry.id])}</span>
          </label>
        )}
      </For>
    </fieldset>
  );
}
