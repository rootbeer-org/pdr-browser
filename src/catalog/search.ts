import { platforms, type IndexOutput, type PackageKind, type PackageSummary } from "./types.ts";

/** Platform filter value for packages that build on every platform. */
export const ALL_PLATFORMS = "all";

function outputsFor(pkg: PackageSummary, system: string): IndexOutput[] {
  const entries = system ? [pkg.outputs[system]] : Object.values(pkg.outputs);
  return entries.filter((entry) => entry !== undefined);
}

/** Commands of each platform's default version, as the root publishes them. */
export function packageCommands(pkg: PackageSummary, system = ""): string[] {
  return [...new Set(outputsFor(pkg, system).flatMap((entry) => entry.bins))];
}

export function packageApps(pkg: PackageSummary, system = ""): string[] {
  return [...new Set(outputsFor(pkg, system).flatMap((entry) => Object.keys(entry.apps)))];
}

/** A package can be both an app and a command, e.g. an app bundle on macOS and a binary on Linux. */
export function packageKinds(pkg: PackageSummary, system = ""): PackageKind[] {
  const kinds: PackageKind[] = [];
  if (packageApps(pkg, system).length) kinds.push("app");
  if (packageCommands(pkg, system).length) kinds.push("command");
  return kinds.length ? kinds : ["library"];
}

export function isOnPlatform(pkg: PackageSummary, platform: string): boolean {
  if (!platform) return true;
  if (platform === ALL_PLATFORMS) return platforms.every(({ id }) => pkg.default[id]);
  return Boolean(pkg.default[platform]);
}

export function matchesQuery(pkg: PackageSummary, query: string, system = ""): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [
    pkg.name,
    ...pkg.aliases,
    pkg.description,
    ...packageCommands(pkg, system),
    ...packageApps(pkg, system),
  ]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => text.includes(term));
}

/** Text matches ranked by relevance; platform and kind filters are applied by the caller. */
export function searchPackages(
  packages: PackageSummary[],
  query: string,
  system = "",
): PackageSummary[] {
  const term = query.trim().toLowerCase();
  const rank = (pkg: PackageSummary) => {
    if (pkg.name === term) return 0;
    if (pkg.aliases.includes(term)) return 1;
    if (packageCommands(pkg, system).includes(term)) return 2;
    if (pkg.name.startsWith(term)) return 3;
    return 4;
  };

  return packages
    .filter((pkg) => matchesQuery(pkg, query, system))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
