import { availableVersions } from "./versions.ts";
import type { CatalogPackage } from "./types.ts";

export function matchesPackage(pkg: CatalogPackage, query: string, system: string): boolean {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const versions = availableVersions(pkg, system);
  const text = [
    pkg.name,
    ...pkg.aliases,
    pkg.description,
    ...versions.flatMap((version) => pkg.versions[version].bins),
  ]
    .join(" ")
    .toLowerCase();

  if (!terms.every((term) => text.includes(term))) return false;
  return versions.length > 0;
}

export function searchPackages(
  packages: CatalogPackage[],
  query: string,
  system = "",
): CatalogPackage[] {
  const term = query.trim().toLowerCase();
  const rank = (pkg: CatalogPackage) => {
    if (pkg.name === term) return 0;
    if (pkg.aliases.includes(term)) return 1;
    if (availableVersions(pkg, system).some((version) => pkg.versions[version].bins.includes(term)))
      return 2;
    if (pkg.name.startsWith(term)) return 3;
    return 4;
  };

  return packages
    .filter((pkg) => matchesPackage(pkg, query, system))
    .sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
