import { catalogHost, docs, recipesUrl } from "../config.ts";
import type { ParentProps } from "solid-js";

export default function Layout(props: ParentProps) {
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
          <h1 class="font-bold tracking-wide">
            <a href="/">Rootbeer Packages</a>
          </h1>
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
          {props.children}
        </div>

        <hr class="mt-8 mb-3 border-edge" />
        <footer class="flex flex-wrap items-baseline gap-x-4 uppercase opacity-50">
          <span class="ml-auto">{catalogHost}</span>
        </footer>
      </main>
    </>
  );
}
