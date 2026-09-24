import { catalogHost, docs, recipesUrl } from "./config.ts";
import { catalog, packages } from "./state/catalog-resource.ts";
import PackageBrowser from "./ui/PackageBrowser.tsx";

export default function App() {
  const count = () => (catalog.loading ? "loading" : `${packages().length} packages`);

  return (
    <>
      <a
        href="#catalog-content"
        class="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:border focus:border-edge focus:bg-panel focus:px-2 focus:py-1"
      >
        Skip to packages
      </a>
      <main class="mx-auto my-4 w-full max-w-6xl flex-1 border border-edge bg-panel p-4">
        <header class="flex flex-col gap-x-4 uppercase sm:flex-row sm:items-baseline">
          <h1 class="font-bold tracking-wide">Rootbeer Packages</h1>
          <nav class="flex flex-wrap gap-x-4 sm:ml-auto" aria-label="Site">
            <a class="link" href={docs.home}>
              Docs
            </a>
            <a class="link" href={recipesUrl} target="_blank" rel="noopener noreferrer">
              PDR
            </a>
          </nav>
        </header>
        <hr class="my-3 border-edge" />

        <div id="catalog-content" tabindex="-1">
          <PackageBrowser />
        </div>

        <hr class="mt-8 mb-3 border-edge" />
        <footer class="flex flex-wrap items-baseline gap-x-4 uppercase opacity-50">
          <span class="tabular-nums">{count()}</span>
          <span class="ml-auto">{catalogHost}</span>
        </footer>
      </main>
    </>
  );
}
