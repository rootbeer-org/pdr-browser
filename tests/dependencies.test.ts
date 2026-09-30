import assert from "node:assert/strict";
import { test } from "node:test";
import { dependencyTreeRows, loadDependencyGraph } from "../src/catalog/dependencies.ts";
import type { PackageData } from "../src/catalog/types.ts";

const data: PackageData = {
  pkg: {
    name: "zlib",
    aliases: [],
    description: "",
    homepage: "",
    license: "",
    maintainers: [],
    added: 0,
    updated: 0,
    document: "",
    platforms: { "aarch64-macos": { version: "1.3.2", kind: "library", commands: [] } },
  },
  document: {
    name: "zlib",
    versions: {
      "1.3.1": {
        license: "",
        revision: 1,
        platforms: {
          "aarch64-macos": {
            record: "",
            published: 0,
            recipe: {
              build: { url: "", dependencies: [{ package: "cmake@4.4.3", kind: "build" }] },
            },
          },
          "aarch64-linux": { record: "", published: 0, recipe: {} },
        },
      },
      "1.3.2": {
        license: "",
        revision: 1,
        platforms: { "aarch64-macos": { record: "", published: 0, recipe: {} } },
      },
    },
  },
  records: {},
};

const root = (dependencies: string[]) => ({
  name: "root",
  version: "1",
  recipe: { build: { url: "", dependencies } },
});

test("shared nodes render once and retain every incoming relationship", async () => {
  const cmake = structuredClone(data);
  cmake.pkg.name = "cmake";
  cmake.document.versions = {
    "4.4.3": {
      license: "",
      revision: 1,
      platforms: {
        "aarch64-macos": {
          record: "",
          published: 0,
          recipe: { build: { url: "", dependencies: ["zlib@1.3.1"] } },
        },
      },
    },
  };
  const calls: string[] = [];
  const nodes = await loadDependencyGraph(
    root(["zlib@1.3.1", "cmake@4.4.3"]),
    "aarch64-macos",
    async (name) => {
      calls.push(name);
      return name === "zlib" ? data : cmake;
    },
  );
  assert.equal(nodes.length, 2);
  assert.deepEqual(calls.sort(), ["cmake", "zlib"]);
  assert.ok(nodes.every((node) => node.isDirect));
  const zlib = nodes.find((node) => node.name === "zlib")!;
  assert.deepEqual(
    zlib.requiredBy.map((parent) => parent.name),
    ["root", "cmake"],
  );
  const compiler = nodes.find((node) => node.name === "cmake")!;
  assert.equal(compiler.requiredBy.find((parent) => parent.name === "zlib")?.kind, "Build");

  const rows = dependencyTreeRows("root@1", nodes);
  const expanded = new Set<string>();
  for (const row of rows) {
    if (row.isShared) {
      assert.ok(expanded.has(row.key), "shared references must target an earlier occurrence");
      continue;
    }
    assert.ok(!expanded.has(row.key), "cycles must not expand a package twice");
    expanded.add(row.key);
  }
  assert.equal(expanded.size, 2);
  assert.equal(rows.filter((row) => row.isShared).length, 2);
});

test("different versions stay distinct and transitive nodes are classified", async () => {
  const nodes = await loadDependencyGraph(
    root(["zlib@1.3.1", "zlib@1.3.2"]),
    "aarch64-macos",
    async (name) => (name === "zlib" ? data : null),
  );
  assert.equal(nodes.filter((node) => node.name === "zlib").length, 2);
  assert.equal(nodes.find((node) => node.name === "cmake")?.isDirect, false);
});

test("unpinned and pinned requests for the default resolve to one node", async () => {
  const nodes = await loadDependencyGraph(
    root(["zlib", "zlib@1.3.2"]),
    "aarch64-macos",
    async () => data,
  );
  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].version, "1.3.2");
  assert.equal(nodes[0].requiredBy.length, 1);
});

test("tree expands shared subtrees only at their first occurrence", () => {
  const nodes = [
    {
      name: "a",
      version: "1",
      isDirect: true,
      error: "",
      requiredBy: [{ name: "root", version: "1", kind: "Build" }],
    },
    {
      name: "b",
      version: "1",
      isDirect: true,
      error: "",
      requiredBy: [
        { name: "root", version: "1", kind: "Link" },
        { name: "a", version: "1", kind: "Build" },
      ],
    },
    {
      name: "c",
      version: "1",
      isDirect: false,
      error: "",
      requiredBy: [{ name: "b", version: "1", kind: "Runtime" }],
    },
  ];
  const rows = dependencyTreeRows("root@1", nodes);
  assert.deepEqual(
    rows.map(({ key, prefix, isShared }) => [prefix, key, isShared]),
    [
      ["├─ ", "a@1", false],
      ["│  └─ ", "b@1", false],
      ["│     └─ ", "c@1", false],
      ["└─ ", "b@1", true],
    ],
  );
  assert.equal(rows[1].kind, "Build");
  assert.equal(rows[3].kind, "Link");
});
