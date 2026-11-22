import { For } from "solid-js";

interface FilterEntry {
  id: string;
  label: string;
  count: number;
  hint?: string;
}

export default function FilterGroup(props: {
  legend: string;
  name: string;
  entries: FilterEntry[];
  value: string;
  onSelect: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend class="heading">{props.legend}</legend>
      <div class="flex flex-wrap gap-2 md:flex-col md:gap-0">
        <For each={props.entries}>
          {(entry) => {
            const isActive = () => props.value === entry.id;
            return (
              <label
                title={entry.hint}
                class="flex cursor-pointer items-baseline gap-x-2 border px-2 py-1 hover:bg-hover has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent md:border-0 md:border-l-2 md:border-transparent"
                classList={{
                  "border-edge": !isActive(),
                  "border-accent bg-accent-soft font-bold text-accent": isActive(),
                  "opacity-40": !entry.count && !isActive(),
                }}
              >
                <input
                  type="radio"
                  name={props.name}
                  class="sr-only"
                  value={entry.id}
                  checked={isActive()}
                  onChange={() => props.onSelect(entry.id)}
                />
                <span>{entry.label}</span>
                <span class="tabular-nums opacity-50 md:ml-auto">{entry.count}</span>
              </label>
            );
          }}
        </For>
      </div>
    </fieldset>
  );
}
