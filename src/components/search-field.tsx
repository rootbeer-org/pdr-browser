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
      <label class="heading" for="package-query">
        Search packages
      </label>
      <input
        id="package-query"
        name="q"
        type="search"
        value={options().query}
        maxlength={200}
        placeholder="name, command, app, or description…"
        autocomplete="off"
        class="w-full border border-edge bg-page px-2 py-1 placeholder:opacity-40"
        onInput={(event) => {
          const value = event.currentTarget.value;
          clearTimeout(timer);
          timer = setTimeout(() => update({ q: value }), 200);
        }}
      />
    </form>
  );
}
