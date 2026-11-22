import { onCleanup } from "solid-js";
import { urlState } from "#/lib/url-state.ts";

export default function SearchField() {
  const { options, update } = urlState;
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer);
        update({ q: new FormData(event.currentTarget).get("q") as string });
      }}
    >
      <label class="sr-only" for="package-query">
        Search packages
      </label>
      <input
        id="package-query"
        name="q"
        type="search"
        value={options().query}
        maxlength={200}
        placeholder="Search by name, command, app, or description"
        autocomplete="off"
        class="field w-full"
        onInput={(event) => {
          const value = event.currentTarget.value;
          clearTimeout(timer);
          timer = setTimeout(() => update({ q: value }), 200);
        }}
      />
    </form>
  );
}
