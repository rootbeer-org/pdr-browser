import type { CatalogSource } from "./catalog/types.ts";

export const catalogSource: CatalogSource = {
  url: import.meta.env.VITE_CATALOG_URL,
  publicKey: import.meta.env.VITE_CATALOG_PUBLIC_KEY,
};

export const catalogHost = new URL(catalogSource.url).hostname;
export const indexRepositoryUrl = "https://github.com/tale/rootbeer-index";
const docsEndpoint = "https://rbpkg.com";

export const docs = {
  gettingStarted: `${docsEndpoint}/guide/getting-started`,
  packages: `${docsEndpoint}/guide/packages`,
  runTool: `${docsEndpoint}/guide/packages#run-a-tool`,
  keepInstalled: `${docsEndpoint}/guide/packages#keep-tools-installed`,
  declareInConfig: `${docsEndpoint}/guide/packages#declare-tools-in-your-configuration`,
  packageLocks: `${docsEndpoint}/guide/package-locks`,
  packageSources: `${docsEndpoint}/guide/package-sources`,
  packaging: `${docsEndpoint}/contributing/packaging`,
  libraryDependencies: `${docsEndpoint}/contributing/packaging#library-dependencies`,
  home: docsEndpoint,
};
