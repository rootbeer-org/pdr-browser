import type { RootPackage } from "./types.ts";

/** Commands of each platform's default version, as the root publishes them. */
export function packageCommands(pkg: RootPackage, system = ""): string[] {
  const entries = system ? [pkg.platforms[system]] : Object.values(pkg.platforms);
  return [...new Set(entries.flatMap((entry) => entry?.commands ?? []))];
}

export function matchesPackage(pkg: RootPackage, query: string, system: string): boolean {
  if (system && !pkg.platforms[system]) return false;

  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const text = [pkg.name, ...pkg.aliases, pkg.description, ...packageCommands(pkg, system)]
    .join(" ")
    .toLowerCase();
  return terms.every((term) => text.includes(term));
}

export function searchPackages(packages: RootPackage[], query: string, system = ""): RootPackage[] {
  const term = query.trim().toLowerCase();
  const rank = (pkg: RootPackage) => {
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
