import { Title } from "@solidjs/meta";
import { createAsync } from "@solidjs/router";
import { Show } from "solid-js";
import { findPackages } from "../state/queries.ts";
import { useBrowserState } from "../state/browser-state.ts";
import PackageBrowser from "../ui/PackageBrowser.tsx";

export default function SearchPage() {
  const { searchParams } = useBrowserState();
  const result = createAsync(() => findPackages(searchParams()));
  return (
    <>
      <Title>Rootbeer Packages</Title>
      <Show when={result()}>{(data) => <PackageBrowser result={data()} />}</Show>
    </>
  );
}
