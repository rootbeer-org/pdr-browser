import { query, search } from "../state/browser-state.ts";

export default function SearchField() {
  return (
    <div>
      <label class="heading" for="package-query">
        Search packages
      </label>
      <input
        id="package-query"
        type="search"
        value={query()}
        placeholder="name, command, or description…"
        autocomplete="off"
        class="w-full border border-edge bg-page px-2 py-1 placeholder:opacity-40"
        onInput={(event) => search(event.currentTarget.value)}
      />
    </div>
  );
}
