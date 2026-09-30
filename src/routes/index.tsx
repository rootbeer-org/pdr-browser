import { Title } from "@solidjs/meta";
import { createAsync, useLocation } from "@solidjs/router";
import { Show } from "solid-js";
import { findPackages } from "../state/queries.ts";
import PackageBrowser from "../ui/PackageBrowser.tsx";

export default function SearchPage() {
  const location = useLocation();
  const result = createAsync(() => findPackages(location.search));
  return (
    <>
      <Title>Rootbeer Packages</Title>
      <Show when={result()}>{(data) => <PackageBrowser result={data()} />}</Show>
    </>
  );
}
