import assert from "node:assert/strict";
import { test } from "node:test";
import { availableVersions } from "../src/catalog/versions.ts";
import type { PackageDocument } from "../src/catalog/types.ts";

function document(entries: [string, number, number?][]): PackageDocument {
  return {
    name: "example",
    versions: Object.fromEntries(
      entries.map(([version, macos, linux]) => [
        version,
        {
          license: "",
          revision: 1,
          platforms: {
            "aarch64-macos": { recipe: {}, record: "", published: macos },
            ...(linux === undefined
              ? {}
              : { "aarch64-linux": { recipe: {}, record: "", published: linux } }),
          },
        },
      ]),
    ),
  };
}

test("nightly builds sort by publication time instead of commit hash", () => {
  const versions = document([
    ["0.1.0-main+ffff", 10],
    ["0.1.0-main+aaaa", 30],
    ["0.1.0-main+9999", 20],
  ]);
  assert.deepEqual(availableVersions(versions, "aarch64-macos"), [
    "0.1.0-main+aaaa",
    "0.1.0-main+9999",
    "0.1.0-main+ffff",
  ]);
});

test("nightly ordering uses publication dates for the selected platform", () => {
  const versions = document([
    ["1.0.0-main+a", 20, 10],
    ["1.0.0-main+b", 10, 30],
  ]);
  assert.equal(availableVersions(versions, "aarch64-macos")[0], "1.0.0-main+a");
  assert.equal(availableVersions(versions, "aarch64-linux")[0], "1.0.0-main+b");
  assert.equal(availableVersions(versions)[0], "1.0.0-main+b");
});

test("release precedence remains numeric even when older versions are republished", () => {
  const versions = document([
    ["1.9.0", 40],
    ["1.10.0", 10],
    ["1.10.0-rc.2", 30],
    ["1.10.0-rc.10", 20],
  ]);
  assert.deepEqual(availableVersions(versions), ["1.10.0", "1.10.0-rc.10", "1.10.0-rc.2", "1.9.0"]);
});

test("calendar versions sort numerically rather than alphabetically", () => {
  const versions = document([
    ["2026.9.5", 30],
    ["2026.9.13", 10],
    ["2026.9.11", 20],
  ]);
  assert.deepEqual(availableVersions(versions), ["2026.9.13", "2026.9.11", "2026.9.5"]);
});
