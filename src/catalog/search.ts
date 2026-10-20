import type { PackageSummary } from "./types.ts";

/** Commands of each platform's default version, as the root publishes them. */
export function packageCommands(pkg: PackageSummary, system = ""): string[] {
  const entries = system ? [pkg.outputs[system]] : Object.values(pkg.outputs);
  return [...new Set(entries.flatMap((entry) => entry?.bins ?? []))];
}

export function matchesPackage(pkg: PackageSummary, query: string, system: string): boolean {
  if (system && !pkg.default[system]) return false;

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [pkg.name, ...pkg.aliases, pkg.description, ...packageCommands(pkg, system)]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => text.includes(term));
}

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
    .filter((pkg) => matchesPackage(pkg, query, system))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
