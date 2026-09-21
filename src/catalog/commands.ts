import type { CatalogPackage, CatalogRecipe, DependencyKind } from "./types.ts";

export type UsageMode = "run" | "use" | "config";
export type DetailMode = UsageMode | "bootstrap";

export type PackageKind = "command" | "library" | "app";
export interface SnippetRequest {
  mode: DetailMode;
  version: string;
  isPinned: boolean;
  bin: string;
}

export interface PackageDependency {
  request: string;
  name: string;
  version: string;
  kind: string;
}

const BOOTSTRAP_SNIPPET =
  'sh -c "$(curl -fsSL https://rbpkg.com/rb.sh)"\nexport PATH="$HOME/.rootbeer/bin:$PATH"';

const DEPENDENCY_LABELS: Record<DependencyKind, string> = {
  all: "Build / link",
  build: "Build",
  link: "Link",
  runtime: "Runtime",
  link_runtime: "Link / runtime",
};

export function packageKind(recipe: CatalogRecipe): PackageKind {
  if (recipe.bins.length) return "command";
  if (recipe.build?.libraries?.length) return "library";
  return "app";
}

export function primaryCommand(pkg: CatalogPackage, version: string): string {
  const bins = pkg.versions[version]?.bins ?? [];
  return bins.includes(pkg.name) ? pkg.name : bins.length === 1 ? bins[0] : "";
}

export function usageModes(pkg: CatalogPackage, recipe: CatalogRecipe): [DetailMode, string][] {
  const isRootbeer = pkg.name === "rootbeer";
  return [
    ...(isRootbeer ? ([["bootstrap", "Install Rootbeer"]] as [DetailMode, string][]) : []),
    ["use", isRootbeer ? "Install with rb" : "Install"],
    // An app bundle has no command to run once.
    ...(recipe.bins.length ? ([["run", "Run once"]] as [DetailMode, string][]) : []),
    ["config", "Lua config"],
  ];
}

export function packageCommand(
  pkg: CatalogPackage,
  mode: UsageMode,
  version = "",
  bin = "",
): string {
  const request = version ? `${pkg.name}@${version}` : pkg.name;
  if (mode === "config") {
    return `local rb = require("rootbeer")\n\nrb.package(${JSON.stringify(request)})`;
  }

  const selectedBin =
    mode === "run" && bin && bin !== primaryCommand(pkg, version || pkg.default_version)
      ? ` --bin ${quote(bin)}`
      : "";
  return `rb ${mode}${selectedBin} ${quote(request)}`;
}

export function usageSnippet(
  pkg: CatalogPackage,
  recipe: CatalogRecipe,
  request: SnippetRequest,
): string {
  if (request.mode === "bootstrap") return BOOTSTRAP_SNIPPET;
  if (packageKind(recipe) === "library") {
    return `dependencies = { "${pkg.name}@${request.version}" }`;
  }

  const command = packageCommand(
    pkg,
    request.mode,
    request.isPinned ? request.version : "",
    request.mode === "run" ? request.bin : "",
  );

  // The eval line puts commands on PATH; an app bundle has none.
  const needsShell = request.mode === "use" && packageKind(recipe) === "command";
  return needsShell ? `${command}\neval "$(rb env)"` : command;
}

export function packageDependencies(recipe: CatalogRecipe): PackageDependency[] {
  return (recipe.build?.dependencies ?? []).map((dependency) => {
    const request = typeof dependency === "string" ? dependency : dependency.package;
    const kind = typeof dependency === "string" ? "all" : dependency.kind;
    const separator = request.indexOf("@");

    return {
      request,
      name: separator < 0 ? request : request.slice(0, separator),
      version: separator < 0 ? "" : request.slice(separator + 1),
      kind: DEPENDENCY_LABELS[kind],
    };
  });
}

function quote(value: string): string {
  return /^[a-zA-Z0-9._+@:/-]+$/.test(value) ? value : `'${value.replace(/'/g, "'\\''")}'`;
}
