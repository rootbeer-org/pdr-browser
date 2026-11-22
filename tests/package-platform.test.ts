import assert from "node:assert/strict";
import { test } from "node:test";
import { availableVersions, packagePlatform, preferredVersion } from "#/catalog/versions.ts";
import { output, packageEntry } from "./catalog-fixture.ts";

const pkg = {
  ...packageEntry(),
  default: { "aarch64-macos": "1", "aarch64-linux": "2" },
  versions: {
    "1": { "aarch64-macos": output },
    "2": { "aarch64-linux": output },
  },
};

test("a pinned version chooses a platform that publishes it", () => {
  assert.equal(packagePlatform(pkg, "", "2"), "aarch64-linux");
});

test("explicit unsupported platforms stay selected so availability is honest", () => {
  const system = packagePlatform(pkg, "x86_64-linux", "1");
  assert.equal(system, "x86_64-linux");
  assert.deepEqual(availableVersions(pkg, system), []);
});

test("split defaults resolve against the displayed platform", () => {
  assert.equal(preferredVersion(pkg, packagePlatform(pkg)), "1");
  assert.equal(preferredVersion(pkg, packagePlatform(pkg, "aarch64-linux")), "2");
});
