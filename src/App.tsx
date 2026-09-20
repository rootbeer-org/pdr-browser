import { docs } from "./config.ts";
import PackageBrowser from "./ui/PackageBrowser.tsx";

export default function App() {
  return (
    <>
      <a href="#catalog-content">Skip to packages</a>
      <header>
        <a href={import.meta.env.BASE_URL}>
          Rootbeer <span>Packages</span>
        </a>
        <nav aria-label="Site">
          <a href={docs.gettingStarted}>Documentation</a>
        </nav>
      </header>
      <main id="catalog-content" tabindex="-1">
        <h1>Package catalog</h1>
        <PackageBrowser />
      </main>
    </>
  );
}
