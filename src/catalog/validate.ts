import { hex, webUrl } from "./transport.ts";
import {
  platforms,
  type CatalogRecipe,
  type DocumentVersion,
  type PackageDocument,
  type RootPackage,
  type RootPlatform,
} from "./types.ts";

const NAME_PATTERN = /^[a-z0-9][a-z0-9+._-]*$/;
const LIBRARY_PATTERN = /^(lib|lib64)\/.+\.a$/;
const KINDS = ["command", "library", "app"];

/**
 * Entries are decoded one at a time: one this browser cannot read is dropped
 * rather than costing the whole repository. The signature already covers it.
 */
export function validateRoot(root: any): RootPackage[] {
  if (!isObject(root.packages)) {
    throw new Error("Package search is temporarily unavailable. Please try again later.");
  }

  return Object.entries(root.packages).flatMap(([name, entry]) => {
    try {
      return [validatePackage(name, entry)];
    } catch {
      return [];
    }
  });
}

export function validateDocument(document: any, expect: RootPackage): PackageDocument {
  if (document?.name !== expect.name || !isObject(document.versions)) {
    throw new Error("The package document does not match the package requested.");
  }

  const versions: Record<string, DocumentVersion> = {};
  for (const [version, entry] of Object.entries<any>(document.versions)) {
    if (!isObject(entry?.platforms) || !Number.isSafeInteger(entry.revision)) continue;

    const published = Object.entries<any>(entry.platforms).filter(
      ([system, platform]) => isKnownSystem(system) && isValidPlatform(system, platform),
    );
    if (!published.length) continue;

    versions[version] = { ...entry, platforms: Object.fromEntries(published) };
  }
  return { name: document.name, versions };
}

function validatePackage(name: string, entry: any): RootPackage {
  const aliases = entry.aliases ?? [];
  if (
    !NAME_PATTERN.test(name) ||
    typeof entry.description !== "string" ||
    !Array.isArray(aliases) ||
    !aliases.every((alias) => typeof alias === "string") ||
    !isObject(entry.platforms)
  ) {
    throw new Error("The package repository contains an invalid package.");
  }
  hex(entry.document, 32);

  const available = Object.entries<any>(entry.platforms).filter(
    ([system, platform]) => isKnownSystem(system) && isValidRootPlatform(platform),
  );

  return {
    name,
    aliases,
    description: entry.description,
    homepage: webUrl(entry.homepage),
    license: typeof entry.license === "string" ? entry.license : "",
    added: Number(entry.added) || 0,
    updated: Number(entry.updated) || 0,
    platforms: Object.fromEntries(
      available.map(([system, platform]) => [
        system,
        { version: platform.version, kind: platform.kind, commands: platform.commands ?? [] },
      ]),
    ),
    document: entry.document,
  };
}

function isValidRootPlatform(platform: any): platform is RootPlatform {
  const commands = platform?.commands ?? [];
  return (
    typeof platform?.version === "string" &&
    KINDS.includes(platform.kind) &&
    Array.isArray(commands) &&
    commands.every((command) => typeof command === "string" && NAME_PATTERN.test(command))
  );
}

function isValidPlatform(system: string, platform: any): boolean {
  if (!isObject(platform?.recipe) || !Number.isSafeInteger(platform.published)) return false;
  try {
    hex(platform.record, 32);
    validateRecipe(system, platform.recipe);
    return true;
  } catch {
    return false;
  }
}

function validateRecipe(system: string, recipe: CatalogRecipe): void {
  const libraries = recipe.build?.libraries ?? [];
  if (!Array.isArray(libraries) || !libraries.every(isSafeLibraryPath)) {
    throw new Error("The package contains invalid library exports.");
  }

  const bins = recipe.bins ?? [];
  const names = Array.isArray(bins) ? bins : isObject(bins) ? Object.keys(bins) : [];
  // A recipe earns its place by shipping commands, libraries, or app bundles.
  const outputs = names.length + libraries.length + Object.keys(recipe.apps ?? {}).length;

  if (
    !outputs ||
    !names.every((bin) => typeof bin === "string" && NAME_PATTERN.test(bin)) ||
    (!Array.isArray(bins) && !Object.values(bins).every(isContainedString))
  ) {
    throw new Error("The package contains invalid commands.");
  }

  if (recipe.apps !== undefined) validateApps(system, recipe.apps);
}

function validateApps(system: string, apps: unknown): void {
  if (
    !isObject(apps) ||
    (Object.keys(apps).length > 0 && !system.endsWith("-macos")) ||
    !Object.entries(apps).every(
      ([name, path]) =>
        name.endsWith(".app") &&
        name !== ".app" &&
        !/[/\\\0]/.test(name) &&
        typeof path === "string" &&
        path.endsWith(".app") &&
        isContainedString(path),
    )
  ) {
    throw new Error("The package contains invalid app exports.");
  }
}

function isKnownSystem(system: string): boolean {
  return platforms.some(({ id }) => id === system);
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeLibraryPath(path: unknown): boolean {
  return typeof path === "string" && LIBRARY_PATTERN.test(path) && isContainedString(path);
}

function isContainedString(path: unknown): boolean {
  return (
    typeof path === "string" &&
    !/[\\\0]/.test(path) &&
    path.split("/").every((part) => part && part !== "." && part !== "..")
  );
}
