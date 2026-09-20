import { query, search } from "../state/browser-state.ts";

export default function SearchField() {
  return (
    <div>
      <label for="package-query">Search packages</label>
      <input
        id="package-query"
        type="search"
        value={query()}
        placeholder="Name, command, or description…"
        autocomplete="off"
        onInput={(event) => search(event.currentTarget.value)}
      />
    </div>
  );
}
