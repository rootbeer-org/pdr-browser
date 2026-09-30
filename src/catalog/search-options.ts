import { platforms, type RootPackage } from "./types.ts";
import { matchesPackage, searchPackages } from "./search.ts";

export type SortOrder = "relevance" | "name" | "name-desc";
export const PAGE_SIZE = 25;

export function readSearch(params: URLSearchParams) {
  const query = (params.get("q") ?? "").slice(0, 200);
  const system = params.get("platform") ?? "";
  const order = params.get("sort");
  const requested = Number(params.get("page"));
  const sort: SortOrder =
    order === "name" || order === "name-desc" ? order : query ? "relevance" : "name";
  return {
    query,
    platform: platforms.some(({ id }) => id === system) ? system : "",
    sort,
    page: Number.isSafeInteger(requested) && requested > 0 ? requested : 1,
  };
}

export type SearchOptions = ReturnType<typeof readSearch>;
export type SearchResult = ReturnType<typeof searchPage>;

export function searchPage(packages: RootPackage[], options: SearchOptions) {
  const matched = searchPackages(packages, options.query, options.platform);
  if (options.sort === "name") matched.sort((a, b) => a.name.localeCompare(b.name));
  if (options.sort === "name-desc") matched.sort((a, b) => b.name.localeCompare(a.name));

  const pages = Math.max(1, Math.ceil(matched.length / PAGE_SIZE));
  const page = Math.min(options.page, pages);
  const start = (page - 1) * PAGE_SIZE;
  const queryMatches = packages.filter((pkg) => matchesPackage(pkg, options.query, ""));
  return {
    packages: matched.slice(start, start + PAGE_SIZE),
    total: packages.length,
    count: matched.length,
    queryCount: queryMatches.length,
    platformCounts: Object.fromEntries(
      platforms.map(({ id }) => [id, queryMatches.filter((pkg) => pkg.platforms[id]).length]),
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
  if (options.sort !== (options.query ? "relevance" : "name")) params.set("sort", options.sort);
  if (page > 1) params.set("page", String(page));
  return params.size ? `/?${params}` : "/";
}
