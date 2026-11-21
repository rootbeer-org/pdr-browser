import { platforms, type PackageKind, type PackageSummary } from "./types.ts";
import { ALL_PLATFORMS, isOnPlatform, packageKinds, searchPackages } from "./search.ts";

export type SortOrder = "relevance" | "name" | "name-desc" | "added" | "updated";
export type KindFilter = "" | PackageKind;

export const PAGE_SIZE = 25;
export const KINDS: PackageKind[] = ["command", "app", "library"];
const SORTS: SortOrder[] = ["name", "name-desc", "added", "updated"];

export function readSearch(params: URLSearchParams) {
  const query = (params.get("q") ?? "").slice(0, 200);
  const platform = params.get("platform") ?? "";
  const kind = params.get("kind") ?? "";
  const order = params.get("sort") as SortOrder;
  const requested = Number(params.get("page"));
  const isKnownPlatform = platform === ALL_PLATFORMS || platforms.some(({ id }) => id === platform);
  return {
    query,
    platform: isKnownPlatform ? platform : "",
    kind: (KINDS as string[]).includes(kind) ? (kind as KindFilter) : "",
    sort: SORTS.includes(order) ? order : query ? "relevance" : ("name" as SortOrder),
    page: Number.isSafeInteger(requested) && requested > 0 ? requested : 1,
  };
}

export type SearchOptions = ReturnType<typeof readSearch>;
export type SearchResult = ReturnType<typeof searchPage>;

/** The concrete platform whose outputs describe a package; empty when filtering across platforms. */
export function platformSystem(platform: string): string {
  return platform === ALL_PLATFORMS ? "" : platform;
}

export function searchPage(packages: PackageSummary[], options: SearchOptions) {
  const system = platformSystem(options.platform);
  const isKind = (pkg: PackageSummary, kind: KindFilter, on = system) =>
    !kind || packageKinds(pkg, on).includes(kind);

  // Each facet counts against the other active filters, so the numbers predict the click.
  const queryMatches = searchPackages(packages, options.query, system);
  const onPlatform = queryMatches.filter((pkg) => isOnPlatform(pkg, options.platform));
  const matched = onPlatform.filter((pkg) => isKind(pkg, options.kind));
  const platformCount = (platform: string) =>
    queryMatches.filter(
      (pkg) => isOnPlatform(pkg, platform) && isKind(pkg, options.kind, platformSystem(platform)),
    ).length;

  const newest = (key: "added" | "updated") => (a: PackageSummary, b: PackageSummary) =>
    (b[key] ?? 0) - (a[key] ?? 0) || a.name.localeCompare(b.name);
  if (options.sort === "name") matched.sort((a, b) => a.name.localeCompare(b.name));
  if (options.sort === "name-desc") matched.sort((a, b) => b.name.localeCompare(a.name));
  if (options.sort === "added") matched.sort(newest("added"));
  if (options.sort === "updated") matched.sort(newest("updated"));

  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(options.page, pages);
  const start = (page - 1) * PAGE_SIZE;
  return {
    packages: matched.slice(start, start + PAGE_SIZE),
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
    page,
    pages,
    start,
    end: Math.min(start + PAGE_SIZE, matched.length),
  };
}

export function searchHref(options: SearchOptions, page = options.page): string {
  const params = new URLSearchParams();
  if (options.query) params.set("q", options.query);
  if (options.platform) params.set("platform", options.platform);
  if (options.kind) params.set("kind", options.kind);
  if (options.sort !== (options.query ? "relevance" : "name")) params.set("sort", options.sort);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/?${params}` : "/";
}
