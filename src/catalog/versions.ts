import type { PackageDocument, RootPackage } from "./types.ts";

const natural = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

const CALENDAR_PATTERN = /^\d{4}-\d{1,2}(?:-\d{1,2})?$/;
const SEMVER_PATTERN = /^v?(\d+(?:\.\d+)*)(?:-([\da-z.-]+))?(?:\+[\da-z.-]+)?$/i;

export function compareVersions(a: string, b: string): number {
  if (CALENDAR_PATTERN.test(a) && CALENDAR_PATTERN.test(b)) return natural.compare(a, b);

  const left = a.match(SEMVER_PATTERN);
  const right = b.match(SEMVER_PATTERN);
  if (!left || !right) return natural.compare(a, b);

  const coreA = left[1].split(".");
  const coreB = right[1].split(".");
  for (let i = 0; i < Math.max(coreA.length, coreB.length); i++) {
    const order = natural.compare(coreA[i] ?? "0", coreB[i] ?? "0");
    if (order) return order;
  }

  if (!left[2] || !right[2]) return Number(!left[2]) - Number(!right[2]);

  const preA = left[2].split(".");
  const preB = right[2].split(".");
  for (let i = 0; i < Math.max(preA.length, preB.length); i++) {
    if (preA[i] === undefined) return -1;
    if (preB[i] === undefined) return 1;

    const numericA = /^\d+$/.test(preA[i]);
    const numericB = /^\d+$/.test(preB[i]);
    if (numericA !== numericB) return numericA ? -1 : 1;

    const order = numericA
      ? natural.compare(preA[i], preB[i])
      : preA[i] < preB[i]
        ? -1
        : Number(preA[i] > preB[i]);
    if (order) return order;
  }
  return 0;
}

/** Without a platform, the newest default any platform ships. */
export function defaultVersion(pkg: RootPackage, system = ""): string {
  if (system) return pkg.platforms[system]?.version ?? "";
  return platformDefaults(pkg).sort((a, b) => compareVersions(b, a))[0] ?? "";
}

export function hasSplitDefaults(pkg: RootPackage): boolean {
  return new Set(platformDefaults(pkg)).size > 1;
}

export function availableVersions(document: PackageDocument, system = ""): string[] {
  return Object.keys(document.versions)
    .filter((version) => !system || Object.hasOwn(document.versions[version].platforms, system))
    .sort((a, b) => compareVersions(b, a) || b.localeCompare(a));
}

export function preferredVersion(pkg: RootPackage, document: PackageDocument, system = ""): string {
  const versions = availableVersions(document, system);
  const preferred = defaultVersion(pkg, system);
  return versions.includes(preferred) ? preferred : (versions[0] ?? "");
}

function platformDefaults(pkg: RootPackage): string[] {
  return Object.values(pkg.platforms).map(({ version }) => version);
}
