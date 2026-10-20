import assert from "node:assert/strict";
import { test } from "node:test";
import { availableVersions } from "../src/catalog/versions.ts";
import { output, packageEntry } from "./catalog-fixture.ts";

test("release precedence is numeric and releases precede prereleases", () => {
  const pkg = packageEntry(["1.9.0", "1.10.0", "1.10.0-rc.2", "1.10.0-rc.10"]);
  assert.deepEqual(availableVersions(pkg), ["1.10.0", "1.10.0-rc.10", "1.10.0-rc.2", "1.9.0"]);
});

test("calendar versions and non-semver labels use natural order", () => {
  assert.deepEqual(availableVersions(packageEntry(["2026-9-1", "2026-10-1", "2025-12-1"])), [
    "2026-10-1",
    "2026-9-1",
    "2025-12-1",
  ]);
  assert.deepEqual(availableVersions(packageEntry(["release2", "release10"])), [
    "release10",
    "release2",
  ]);
});

test("equal-precedence builds prefer the selected platform's default without inventing dates", () => {
  const pkg = packageEntry(["0.1.0-main+aaaa", "0.1.0-main+ffff", "0.1.0-main+9999"]);
  pkg.default["aarch64-linux"] = "0.1.0-main+9999";
  for (const entry of Object.values(pkg.versions)) entry["aarch64-linux"] = output;
  assert.deepEqual(availableVersions(pkg, "aarch64-macos"), [
    "0.1.0-main+aaaa",
    "0.1.0-main+ffff",
    "0.1.0-main+9999",
  ]);
  assert.equal(availableVersions(pkg, "aarch64-linux")[0], "0.1.0-main+9999");
});

test("retained versions remain visible even when they are not defaults", () => {
  const pkg = packageEntry(["1.0", "2.0"]);
  pkg.versions["3.0"] = { "x86_64-linux": output };
  assert.deepEqual(availableVersions(pkg), ["3.0", "2.0", "1.0"]);
  assert.deepEqual(availableVersions(pkg, "aarch64-macos"), ["2.0", "1.0"]);
});
