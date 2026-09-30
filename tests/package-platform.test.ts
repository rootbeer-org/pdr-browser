import assert from "node:assert/strict";
import { test } from "node:test";
import { availableVersions, packagePlatform, preferredVersion } from "../src/catalog/versions.ts";
import type { PackageDocument, RootPackage } from "../src/catalog/types.ts";

const entry = { recipe: {}, record: "", published: 0 };
const document: PackageDocument = {
  name: "example",
  versions: {
    "1": { license: "", revision: 1, platforms: { "aarch64-macos": entry } },
    "2": { license: "", revision: 1, platforms: { "aarch64-linux": entry } },
  },
};

test("an unspecified platform selects a supported platform consistently", () => {
  assert.equal(packagePlatform(document), "aarch64-macos");
  assert.deepEqual(availableVersions(document, packagePlatform(document)), ["1"]);
});

test("a pinned version chooses a platform that publishes it", () => {
  assert.equal(packagePlatform(document, "", "2"), "aarch64-linux");
});

test("explicit unsupported platforms stay selected so availability is honest", () => {
  const system = packagePlatform(document, "x86_64-linux", "1");
  assert.equal(system, "x86_64-linux");
  assert.deepEqual(availableVersions(document, system), []);
});

test("an unavailable pinned version retains a usable platform for version recovery", () => {
  const system = packagePlatform(document, "", "missing");
  assert.equal(system, "aarch64-macos");
  assert.deepEqual(availableVersions(document, system), ["1"]);
});

test("split defaults resolve against the displayed platform", () => {
  const pkg = {
    platforms: { "aarch64-macos": { version: "1" }, "aarch64-linux": { version: "2" } },
  } as RootPackage;
  const system = packagePlatform(document);
  assert.equal(preferredVersion(pkg, document, system), "1");
  assert.equal(preferredVersion(pkg, document, packagePlatform(document, "aarch64-linux")), "2");
});
