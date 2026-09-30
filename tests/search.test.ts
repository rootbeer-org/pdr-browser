import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { readSearch, searchHref, searchPage } from "../src/catalog/search-options.ts";
import { validateRoot } from "../src/catalog/validate.ts";

const published = JSON.parse(
  readFileSync(new URL("./fixtures/openssl.json", import.meta.url), "utf8"),
);
const packages = validateRoot(published.root);

test("search parameters normalize invalid pages, platforms, and sort orders", () => {
  for (const page of ["-1", "0", "1.2", "Infinity", "bad", "9007199254740992"]) {
    assert.equal(readSearch(new URLSearchParams({ page })).page, 1);
  }
  assert.deepEqual(readSearch(new URLSearchParams("q=ssl&platform=unknown&sort=invalid")), {
    query: "ssl",
    platform: "",
    sort: "relevance",
    page: 1,
  });
  assert.equal(readSearch(new URLSearchParams({ q: "a".repeat(300) })).query.length, 200);
});

test("pagination sends at most 25 rows and clamps an out-of-range page", () => {
  const repeated = Array.from({ length: 10000 }, () => packages[0]!);
  const first = searchPage(repeated, readSearch(new URLSearchParams()));
  const last = searchPage(repeated, readSearch(new URLSearchParams("page=99999")));
  assert.equal(first.packages.length, 25);
  assert.equal(first.count, 10000);
  assert.equal(last.page, 400);
  assert.equal(last.start, 9975);
  assert.equal(last.end, 10000);
  assert.equal(last.packages.length, 25);
});

test("search and platform counts agree with the published OpenSSL entry", () => {
  const result = searchPage(
    packages,
    readSearch(new URLSearchParams("q=openssl&platform=aarch64-linux")),
  );
  assert.equal(result.count, 1);
  assert.equal(result.packages[0]!.name, "openssl");
  assert.equal(result.platformCounts["aarch64-macos"], 1);
  const empty = searchPage(
    packages,
    readSearch(new URLSearchParams("q=not-a-published-package&page=12")),
  );
  assert.equal(empty.count, 0);
  assert.equal(empty.page, 1);
  assert.deepEqual(empty.packages, []);
});

test("pagination links preserve search, platform, and sort", () => {
  const options = readSearch(
    new URLSearchParams("q=ssl&platform=aarch64-linux&sort=name-desc&page=3"),
  );
  assert.equal(searchHref(options, 2), "/?q=ssl&platform=aarch64-linux&sort=name-desc&page=2");
  assert.equal(searchHref(readSearch(new URLSearchParams())), "/");
});
