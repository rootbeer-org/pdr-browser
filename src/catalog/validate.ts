import { hex, webUrl } from "./transport.ts";
import {
  platforms,
  type CatalogPackage,
  type CatalogRecipe,
  type PackageRecords,
} from "./types.ts";

const NAME_PATTERN = /^[a-z0-9][a-z0-9+._-]*$/;
const LIBRARY_PATTERN = /^(lib|lib64)\/.+\.a$/;

export function validateManifest(manifest: any): CatalogPackage[] {
  if (manifest.catalog?.schema !== 1 || !manifest.catalog.packages || !manifest.records) {
    throw new Error("Package search is temporarily unavailable. Please try again later.");
  }

  const packages = Object.values(manifest.catalog.packages) as CatalogPackage[];
  for (const pkg of packages) {
    validatePackage(pkg);
    pkg.homepage = webUrl(pkg.homepage);
    for (const recipe of Object.values(pkg.versions)) validateRecipe(recipe);
  }

  const records = manifest.records as PackageRecords;
  const byName = new Map(packages.map((pkg) => [pkg.name, pkg]));
  for (const [id, systems] of Object.entries(records)) {
    validateRecord(id, systems, byName);
  }

  for (const pkg of packages) {
    for (const [version, recipe] of Object.entries(pkg.versions)) {
      const published = records[`${pkg.name}@${version}`] ?? {};
      recipe.systems = recipe.systems.filter((system) => Object.hasOwn(published, system));
    }
  }
  return packages;
}

function validateRecord(
  id: string,
  systems: Record<string, { url: string; sha256: string }>,
  byName: Map<string, CatalogPackage>,
): void {
  const separator = id.lastIndexOf("@");
  const recipe = byName.get(id.slice(0, separator))?.versions[id.slice(separator + 1)];

  if (separator < 0 || !recipe || !Object.keys(systems).length) {
    throw new Error("The catalog contains an invalid package record.");
  }

  for (const [system, pin] of Object.entries(systems)) {
    if (!recipe.systems.includes(system)) {
      throw new Error("The catalog publishes a record for an unapproved platform.");
    }

    webUrl(pin.url);
    hex(pin.sha256, 32);
  }
}

function validatePackage(pkg: CatalogPackage): void {
  if (
    !NAME_PATTERN.test(pkg.name) ||
    typeof pkg.description !== "string" ||
    !Array.isArray(pkg.aliases) ||
    !pkg.versions?.[pkg.default_version]
  ) {
    throw new Error("The catalog contains an invalid package.");
  }
}

function validateRecipe(recipe: CatalogRecipe): void {
  const libraries = recipe.build?.libraries ?? [];
  if (!Array.isArray(libraries) || !libraries.every(isSafeLibraryPath)) {
    throw new Error("The catalog contains invalid library exports.");
  }

  if (
    !Array.isArray(recipe.systems) ||
    !recipe.systems.every((system) => platforms.some(({ id }) => id === system)) ||
    !Array.isArray(recipe.bins) ||
    (!recipe.bins.length && !libraries.length) ||
    !recipe.bins.every((bin) => typeof bin === "string" && NAME_PATTERN.test(bin))
  ) {
    throw new Error("The catalog contains invalid package commands or platforms.");
  }

  if (recipe.apps !== undefined) validateApps(recipe);
}

function validateApps(recipe: CatalogRecipe): void {
  const apps = recipe.apps!;
  const isMacOnly = recipe.systems.every((system) => system.endsWith("-macos"));
  if (
    !apps ||
    typeof apps !== "object" ||
    Array.isArray(apps) ||
    (Object.keys(apps).length > 0 && !isMacOnly) ||
    !Object.entries(apps).every(
      ([name, path]) =>
        name.endsWith(".app") &&
        name !== ".app" &&
        !/[/\\\0]/.test(name) &&
        typeof path === "string" &&
        path.endsWith(".app") &&
        !path.includes("\0") &&
        isContainedPath(path),
    )
  ) {
    throw new Error("The catalog contains invalid app exports.");
  }
}

function isSafeLibraryPath(path: unknown): boolean {
  return (
    typeof path === "string" &&
    LIBRARY_PATTERN.test(path) &&
    !/[\\\0]/.test(path) &&
    isContainedPath(path)
  );
}

function isContainedPath(path: string): boolean {
  return path.split("/").every((part) => part && part !== "." && part !== "..");
}
