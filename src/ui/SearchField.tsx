import { createEffect, createSignal, onCleanup } from "solid-js";
import { useBrowserState } from "../state/browser-state.ts";

export default function SearchField() {
  const { query, search, platform, sort } = useBrowserState();
  const [draft, setDraft] = createSignal(query());
  const [timer, setTimer] = createSignal<ReturnType<typeof setTimeout>>();
  createEffect(() => setDraft(query()));
  onCleanup(() => clearTimeout(timer()));

  return (
    <form
      action="/"
      method="get"
      onSubmit={(event) => {
        event.preventDefault();
        clearTimeout(timer());
        search(draft());
      }}
    >
      <label class="heading" for="package-query">
        Search packages
      </label>
      <input type="hidden" name="platform" value={platform()} />
      <input type="hidden" name="sort" value={sort()} />
      <input
        id="package-query"
        name="q"
        type="search"
        value={draft()}
        maxlength={200}
        placeholder="name, command, or description…"
        autocomplete="off"
        class="w-full border border-edge bg-page px-2 py-1 placeholder:opacity-40"
        onInput={(event) => {
          setDraft(event.currentTarget.value);
          clearTimeout(timer());
          setTimer(setTimeout(() => search(draft()), 200));
        }}
      />
    </form>
  );
}
