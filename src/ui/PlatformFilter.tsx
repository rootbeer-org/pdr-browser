import { For } from "solid-js";
import { cn } from "cn";
import { platforms } from "../catalog/types.ts";
import { filterPlatform, platform } from "../state/browser-state.ts";
import { catalog, platformCounts, queryCount } from "../state/catalog-resource.ts";

export default function PlatformFilter() {
  const entries = () => [{ id: "", short: "All platforms" }, ...platforms];
  const count = (id: string) => (catalog.loading ? "—" : id ? platformCounts()[id] : queryCount());

  return (
    <fieldset>
      <legend class="heading">Platform</legend>
      <div class="flex flex-wrap gap-2 md:flex-col md:gap-0">
        <For each={entries()}>
          {(entry) => {
            const active = () => platform() === entry.id;
            return (
              <label
                class={cn(
                  "flex cursor-pointer items-baseline gap-x-2 border border-edge px-2 py-1",
                  "md:border-0 md:border-l-2 md:border-transparent md:px-2 md:py-1",
                  "hover:bg-hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
                  active() && "border-accent bg-accent-soft font-bold text-accent",
                )}
              >
                <input
                  type="radio"
                  name="platform"
                  class="sr-only"
                  value={entry.id}
                  checked={active()}
                  onChange={() => filterPlatform(entry.id)}
                />
                <span>{entry.short}</span>
                <span class="tabular-nums opacity-50 md:ml-auto">{count(entry.id)}</span>
              </label>
            );
          }}
        </For>
      </div>
    </fieldset>
  );
}
