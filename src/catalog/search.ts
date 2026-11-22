import { platforms, type PackageKind, type PackageSummary } from "./types.ts";

export type SortOrder = "relevance" | "name" | "name-desc" | "added" | "updated";
export type KindFilter = "" | PackageKind;
type SearchOptions = ReturnType<typeof readSearch>;
export type SearchResult = ReturnType<typeof searchPage>;

export const ALL_PLATFORMS = "all";
export const KINDS: PackageKind[] = ["command", "app", "library"];
export const KIND_LABELS: Record<PackageKind, string> = {
  command: "Commands",
  app: "Apps",
  library: "Libraries",
};

export const PAGE_SIZE = 25;
const collator = new Intl.Collator("en");
const SORTS: SortOrder[] = ["name", "name-desc", "added", "updated"];

export function platformLabel(id: string): string {
  if (!id) return "Any platform";
  if (id === ALL_PLATFORMS) return "Every platform";
  return platforms.find((platform) => platform.id === id)?.short ?? id;
}

export function platformSystem(platform: string): string {
  return platform === ALL_PLATFORMS ? "" : platform;
}

function outputsFor(pkg: PackageSummary, system: string): PackageSummary["outputs"][string][] {
  const entries = system ? [pkg.outputs[system]] : Object.values(pkg.outputs);
  return entries.filter((entry) => entry !== undefined);
}

export function packageCommands(pkg: PackageSummary, system = ""): string[] {
  return [...new Set(outputsFor(pkg, system).flatMap((entry) => entry.bins))];
}

export function packageApps(pkg: PackageSummary, system = ""): string[] {
  return [...new Set(outputsFor(pkg, system).flatMap((entry) => entry.apps))];
}

function packageKinds(pkg: PackageSummary, system: string): PackageKind[] {
  const kinds: PackageKind[] = [];
  if (packageApps(pkg, system).length) kinds.push("app");
  if (packageCommands(pkg, system).length) kinds.push("command");
  return kinds.length ? kinds : ["library"];
}

const derived = new WeakMap<
  PackageSummary,
  { text: string; kinds: Record<string, PackageKind[]> }
>();

function derive(pkg: PackageSummary) {
  let value = derived.get(pkg);
  if (value) return value;

  value = {
    text: [pkg.name, ...pkg.aliases, pkg.description, ...packageCommands(pkg), ...packageApps(pkg)]
      .join(" ")
      .toLowerCase(),
    kinds: Object.fromEntries(
      ["", ...platforms.map(({ id }) => id)].map((system) => [system, packageKinds(pkg, system)]),
    ),
  };
  derived.set(pkg, value);
  return value;
}

function isOnPlatform(pkg: PackageSummary, platform: string): boolean {
  if (!platform) return true;
  if (platform === ALL_PLATFORMS) return platforms.every(({ id }) => pkg.default[id]);
  return Boolean(pkg.default[platform]);
}

export function readSearch(params: URLSearchParams) {
  const query = (params.get("q") ?? "").slice(0, 200);
  const platform = params.get("platform") ?? "";
  const kind = params.get("kind") ?? "";
  const order = params.get("sort") as SortOrder;
  const isKnownPlatform = platform === ALL_PLATFORMS || platforms.some(({ id }) => id === platform);
  return {
    query,
    platform: isKnownPlatform ? platform : "",
    kind: (KINDS as string[]).includes(kind) ? (kind as KindFilter) : "",
    sort: SORTS.includes(order) ? order : query ? "relevance" : ("name" as SortOrder),
  };
}

export function searchPage(packages: PackageSummary[], options: SearchOptions, limit = PAGE_SIZE) {
  const system = platformSystem(options.platform);
  const term = options.query.trim().toLowerCase();
  const terms = term.split(/\s+/).filter(Boolean);
  const isKind = (pkg: PackageSummary, kind: KindFilter, on = system) =>
    !kind || derive(pkg).kinds[on].includes(kind);

  const queryMatches = terms.length
    ? packages.filter((pkg) => terms.every((word) => derive(pkg).text.includes(word)))
    : packages;
  const onPlatform = queryMatches.filter((pkg) => isOnPlatform(pkg, options.platform));
  const matched = onPlatform.filter((pkg) => isKind(pkg, options.kind));
  const platformCount = (platform: string) =>
    queryMatches.filter(
      (pkg) => isOnPlatform(pkg, platform) && isKind(pkg, options.kind, platformSystem(platform)),
    ).length;

  const rank = (pkg: PackageSummary) => {
    if (pkg.name === term) return 0;
    if (pkg.aliases.includes(term)) return 1;
    if (packageCommands(pkg, system).includes(term)) return 2;
    if (pkg.name.startsWith(term)) return 3;
    return 4;
  };
  const byName = (a: PackageSummary, b: PackageSummary) => collator.compare(a.name, b.name);
  const newest = (key: "added" | "updated") => (a: PackageSummary, b: PackageSummary) =>
    (b[key] ?? 0) - (a[key] ?? 0) || byName(a, b);
  if (options.sort === "relevance") {
    const ranks = new Map(matched.map((pkg) => [pkg, rank(pkg)]));
    matched.sort((a, b) => (ranks.get(a) ?? 4) - (ranks.get(b) ?? 4) || byName(a, b));
  }
  if (options.sort === "name") matched.sort(byName);
  if (options.sort === "name-desc") matched.sort((a, b) => byName(b, a));
  if (options.sort === "added") matched.sort(newest("added"));
  if (options.sort === "updated") matched.sort(newest("updated"));

  return {
    packages: matched.slice(0, limit),
    total: packages.length,
    count: matched.length,
    platformCounts: Object.fromEntries(
      ["", ALL_PLATFORMS, ...platforms.map(({ id }) => id)].map((id) => [id, platformCount(id)]),
    ),
    kindCounts: Object.fromEntries(
      (["", ...KINDS] as KindFilter[]).map((kind) => [
        kind,
        onPlatform.filter((pkg) => isKind(pkg, kind)).length,
      ]),
    ),
  };
}
