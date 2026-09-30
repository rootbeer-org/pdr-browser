import { Meta, Title } from "@solidjs/meta";
import { createAsync, useParams } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";
import { For, Show } from "solid-js";
import { platforms } from "../../catalog/types.ts";
import { availableVersions } from "../../catalog/versions.ts";
import { useBrowserState } from "../../state/browser-state.ts";
import { findPackage } from "../../state/queries.ts";
import PackageDetails from "../../ui/PackageDetails.tsx";

export default function PackagePage() {
  const params = useParams<{ name: string }>();
  const { platform, filterPlatform, version } = useBrowserState();
  const data = createAsync(() => findPackage(params.name));
  const isUnavailable = () => {
    const loaded = data();
    if (!loaded) return true;
    const versions = availableVersions(loaded.document, platform());
    return !versions.length || (Boolean(version()) && !versions.includes(version()));
  };

  return (
    <>
      <Title>
        {params.name}
        {version() ? ` ${version()}` : ""} · Rootbeer Packages
      </Title>
      <a class="link" href="/">
        Search packages
      </a>
      <Show when={data() !== undefined}>
        <Show
          when={data()}
          keyed
          fallback={
            <div class="mt-4 border border-edge p-4">
              <HttpStatusCode code={404} />
              <h2 class="heading">Package not found</h2>
              <p>“{params.name}” is not in the published collection.</p>
            </div>
          }
        >
          {(loaded) => (
            <article class="mt-4 border border-edge">
              <HttpStatusCode code={isUnavailable() ? 404 : 200} />
              <Meta name="description" content={loaded.pkg.description} />
              <header class="flex flex-wrap items-start gap-x-6 gap-y-3 p-3">
                <div class="min-w-0 flex-1">
                  <h2 class="flex flex-wrap items-baseline gap-x-3 font-bold">
                    <span class="break-all text-lg text-accent">{loaded.pkg.name}</span>
                    <Show when={version()}>
                      <span class="font-normal opacity-80">{version()}</span>
                    </Show>
                  </h2>
                  <p class="mt-1 opacity-80">{loaded.pkg.description}</p>
                  <a
                    class="link mt-2 inline-block"
                    href={loaded.pkg.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Homepage ↗
                  </a>
                </div>
                <label class="flex flex-col gap-y-1">
                  <span class="uppercase opacity-50">Platform</span>
                  <select
                    class="field"
                    value={platform()}
                    onChange={(event) => filterPlatform(event.currentTarget.value)}
                  >
                    <option value="">All platforms</option>
                    <For each={platforms}>
                      {(entry) => <option value={entry.id}>{entry.short}</option>}
                    </For>
                  </select>
                </label>
              </header>
              <PackageDetails pkg={loaded.pkg} document={loaded.document} />
            </article>
          )}
        </Show>
      </Show>
    </>
  );
}
