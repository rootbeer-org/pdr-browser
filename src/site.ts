export const recipesUrl = "https://github.com/rootbeer-org/pdr";
const docsEndpoint = "https://rbpkg.com";

export const docs = {
  runTool: `${docsEndpoint}/guide/packages#run-a-tool`,
  keepInstalled: `${docsEndpoint}/guide/packages#keep-tools-installed`,
  declareInConfig: `${docsEndpoint}/guide/packages#declare-tools-in-your-configuration`,
  packageLocks: `${docsEndpoint}/guide/package-locks`,
  packageSources: `${docsEndpoint}/guide/package-sources`,
  packaging: `${docsEndpoint}/contributing/packaging`,
  home: docsEndpoint,
};

export function packageHref(name: string, version = "", system = ""): string {
  const params = new URLSearchParams();
  if (version) params.set("version", version);
  if (system) params.set("platform", system);
  const path = `/packages/${encodeURIComponent(name)}/`;
  return params.size ? `${path}?${params}` : path;
}
