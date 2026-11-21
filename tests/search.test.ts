import assert from "node:assert/strict";
import { test } from "node:test";
import { readSearch, searchHref, searchPage } from "../src/catalog/search-options.ts";
import type { PackageSummary } from "../src/catalog/types.ts";
import { output } from "./catalog-fixture.ts";

const app = { ...output, bins: [], apps: { "Tool.app": "Tool.app" } };
const library = { ...output, bins: [] };

function summary(name: string, outputs: PackageSummary["outputs"], added = 0): PackageSummary {
  return {
    name,
    description: `${name} package`,
    homepage: "",
    license: "",
    aliases: [],
    maintainers: [],
    added,
    updated: added,
    default: Object.fromEntries(Object.keys(outputs).map((system) => [system, "1.0.0"])),
    outputs,
  };
}

const everywhere = {
  "aarch64-macos": output,
  "aarch64-linux": output,
  "x86_64-linux": output,
};
const packages = [
  summary("cli", everywhere, 3),
  summary("mac-app", { "aarch64-macos": app }, 1),
  summary("hybrid", { "aarch64-macos": app, "x86_64-linux": output }, 2),
  summary("lib", { "aarch64-macos": library, "aarch64-linux": library, "x86_64-linux": library }),
];
const search = (query: string) => searchPage(packages, readSearch(new URLSearchParams(query)));
const names = (query: string) => search(query).packages.map(({ name }) => name);

test("all platforms means packages available on every platform, not the union", () => {
  const result = search("");
  assert.equal(result.platformCounts[""], 4);
  assert.equal(result.platformCounts.all, 2);
  assert.deepEqual(names("platform=all"), ["cli", "lib"]);
});

test("kind filters count packages that are both an app and a command under each", () => {
  const result = search("");
  assert.deepEqual(result.kindCounts, { "": 4, command: 2, app: 2, library: 1 });
  assert.deepEqual(names("kind=app"), ["hybrid", "mac-app"]);
  assert.deepEqual(names("kind=command"), ["cli", "hybrid"]);
});

test("kind follows the selected platform's outputs", () => {
  assert.deepEqual(names("kind=app&platform=x86_64-linux"), []);
  assert.deepEqual(names("kind=command&platform=x86_64-linux"), ["cli", "hybrid"]);
  assert.equal(search("kind=app").platformCounts["x86_64-linux"], 0);
});

test("date sorts put the newest first", () => {
  assert.deepEqual(names("sort=added"), ["cli", "hybrid", "mac-app", "lib"]);
});

test("search matches app bundle names and keeps filters in links", () => {
  assert.deepEqual(names("q=tool.app"), ["hybrid", "mac-app"]);
  const options = readSearch(new URLSearchParams("kind=app&platform=all&sort=updated&bogus=1"));
  assert.equal(searchHref(options, 2), "/?platform=all&kind=app&sort=updated&page=2");
  assert.equal(readSearch(new URLSearchParams("kind=nope&platform=nope")).kind, "");
});
