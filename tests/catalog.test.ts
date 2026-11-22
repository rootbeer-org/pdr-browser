import assert from "node:assert/strict";
import { test } from "node:test";
import { parseCatalog, summarize } from "#/catalog/source.ts";

const json = JSON.stringify({
  targets_version: 37,
  expires: "2027-01-01T00:00:00Z",
  packages: {
    example: {
      description: "Example tool",
      homepage: "",
      license: "",
      aliases: ["rg"],
      maintainers: [],
      default: { "aarch64-macos": "1.0.0" },
      versions: { "1.0.0": { "aarch64-macos": { key: "k", manifest: "m", bins: ["rg"] } } },
    },
  },
});

test("parsing names packages and fills outputs rb omits", () => {
  const catalog = parseCatalog(json);
  assert.equal(catalog.json, json);
  assert.equal(catalog.packages[0].name, "example");
  assert.deepEqual(catalog.packages[0].versions["1.0.0"]["aarch64-macos"].apps, {});
});

test("the search index keeps only default outputs and drops hashes", () => {
  const [pkg] = summarize(parseCatalog(json).packages);
  assert.deepEqual(pkg.outputs, { "aarch64-macos": { bins: ["rg"], apps: [] } });
  assert.equal("license" in pkg, false);
});
