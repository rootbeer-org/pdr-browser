import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { cachedData, createCache, dataCache } from "../src/server/cache.ts";
import { canonicalPageUrl, pageCache, renderPage } from "../src/server/pages.ts";

afterEach(() => {
  dataCache.clear();
  pageCache.clear();
});

const request = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://search.rbpkg.com${path}`, {
    headers: { Accept: "text/html", ...headers },
  });
const html = () => new Response("<h1>Packages</h1>", { headers: { "Content-Type": "text/html" } });

test("legacy links redirect before rendering and preserve version and platform", async () => {
  const response = await renderPage(
    request("/?show=openssl&version=4.0.2&platform=aarch64-macos"),
    async () => {
      assert.fail("Legacy links must redirect without rendering");
    },
    "build",
  );
  assert.equal(response.status, 302);
  assert.equal(
    response.headers.get("location"),
    "https://search.rbpkg.com/packages/openssl?version=4.0.2&platform=aarch64-macos",
  );
});

test("canonical URLs remove irrelevant parameters and keep cache keys bounded", () => {
  assert.equal(
    canonicalPageUrl(new URL("https://search.rbpkg.com/?sort=name&page=0&utm_source=test"))?.href,
    "https://search.rbpkg.com/",
  );
  assert.equal(
    canonicalPageUrl(
      new URL("https://search.rbpkg.com/packages/openssl/?q=ssl&platform=unknown&version=4.0.2"),
    )?.href,
    "https://search.rbpkg.com/packages/openssl?version=4.0.2",
  );
  assert.equal(canonicalPageUrl(new URL("https://search.rbpkg.com/_server/query")), undefined);
});

test("HTML cache separates query variants and deployment builds", async () => {
  let renders = 0;
  const render = async () => {
    renders++;
    return html();
  };
  await renderPage(request("/?q=openssl"), render, "first");
  await renderPage(request("/?q=openssl"), render, "first");
  assert.equal(renders, 1);
  await renderPage(request("/?q=curl"), render, "first");
  await renderPage(request("/?q=openssl"), render, "second");
  assert.equal(renders, 3);
});

test("errors, authenticated requests, cookies, and server functions are never HTML-cached", async () => {
  for (const status of [404, 500, 503]) {
    const response = await renderPage(
      request("/packages/missing"),
      async () => new Response("Unavailable", { status }),
      "build",
    );
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  await renderPage(request("/", { Cookie: "session=private" }), async () => html(), "build");
  await renderPage(request("/", { Authorization: "Bearer test" }), async () => html(), "build");
  await renderPage(request("/_server/query"), async () => html(), "build");
  await renderPage(
    new Request("https://search.rbpkg.com/", { method: "POST" }),
    async () => html(),
    "build",
  );
  await renderPage(
    request("/"),
    async () =>
      new Response("Private", {
        headers: { "Content-Type": "text/html", "Set-Cookie": "session=private" },
      }),
    "build",
  );
  assert.equal(pageCache.get("https://search.rbpkg.com/?__build=build"), undefined);
});

test("data caching stores successful verified loads and retries failed loads", async () => {
  let loads = 0;
  const load = async () => {
    loads++;
    return { sequence: 3 };
  };
  assert.deepEqual(await cachedData("catalog", 60, load), { sequence: 3 });
  assert.deepEqual(await cachedData("catalog", 60, load), { sequence: 3 });
  assert.equal(loads, 1);
  assert.equal(dataCache.get("invalid"), undefined);
  await assert.rejects(
    cachedData("invalid", 60, async () => {
      throw new Error("Signature invalid");
    }),
    /Signature invalid/,
  );
  assert.equal(dataCache.get("invalid"), undefined);
  assert.deepEqual(await cachedData("invalid", 60, load), { sequence: 3 });
});

test("cache expiry and memory limits evict entries", (context) => {
  context.mock.timers.enable({ apis: ["Date"], now: 1000 });
  const cache = createCache(12);
  cache.set("a", "12", 60);
  cache.set("b", "34", 60);
  assert.equal(cache.get("a"), "12");
  cache.set("c", "56", 60);
  assert.equal(cache.get("b"), undefined);
  cache.set("huge", "a large value", 60);
  assert.equal(cache.get("huge"), undefined);
  context.mock.timers.tick(60001);
  assert.equal(cache.get("a"), undefined);
  assert.equal(cache.get("c"), undefined);
});
