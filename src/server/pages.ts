import { readSearch, searchHref } from "../catalog/search-options.ts";
import { platforms } from "../catalog/types.ts";
import { createCache } from "./cache.ts";

export const pageCache = createCache(8 * 1024 * 1024);

export function canonicalPageUrl(url: URL): URL | undefined {
  const name = url.pathname === "/" ? url.searchParams.get("show") : undefined;
  if (name) {
    const target = new URL(`/packages/${encodeURIComponent(name)}`, url);
    for (const key of ["version", "platform"]) {
      const value = url.searchParams.get(key);
      if (value) target.searchParams.set(key, value);
    }
    return target;
  }
  if (url.pathname === "/") return new URL(searchHref(readSearch(url.searchParams)), url);
  if (!/^\/packages\/[^/]+\/?$/.test(url.pathname)) return;

  const target = new URL(url.pathname.replace(/\/$/, ""), url);
  const version = url.searchParams.get("version")?.slice(0, 128);
  const platform = url.searchParams.get("platform");
  if (version) target.searchParams.set("version", version);
  if (platforms.some(({ id }) => id === platform)) target.searchParams.set("platform", platform!);
  return target;
}

export async function renderPage(
  request: Request,
  render: (request: Request) => Promise<Response>,
  build: string,
): Promise<Response> {
  const url = new URL(request.url);
  const canonical =
    request.method === "GET" || request.method === "HEAD" ? canonicalPageUrl(url) : undefined;
  if (canonical && canonical.href !== url.href) return Response.redirect(canonical.href, 302);

  const canCache =
    Boolean(build) &&
    Boolean(canonical) &&
    request.method === "GET" &&
    request.headers.get("accept")?.includes("text/html") &&
    !request.headers.has("cookie") &&
    !request.headers.has("authorization");
  const key = new URL(url);
  key.searchParams.set("__build", build);
  const hit = canCache ? pageCache.get(key.href) : undefined;
  if (hit) {
    const cached = JSON.parse(hit) as { body: string; headers: [string, string][] };
    return new Response(cached.body, { headers: cached.headers });
  }

  const response = await render(request);
  if (
    !canCache ||
    response.status !== 200 ||
    response.headers.has("set-cookie") ||
    !response.headers.get("content-type")?.includes("text/html")
  ) {
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  response.headers.set("Cache-Control", "public, max-age=0, s-maxage=60");
  pageCache.set(
    key.href,
    JSON.stringify({
      body: await response.clone().text(),
      headers: [...response.headers],
    }),
    60,
  );
  return response;
}
