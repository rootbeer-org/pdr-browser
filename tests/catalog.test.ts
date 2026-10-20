import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { parseCatalog, prepareCatalog } from "../scripts/catalog.ts";
import { searchPage, readSearch } from "../src/catalog/search-options.ts";
import type { CatalogSnapshot } from "../src/catalog/types.ts";
import { output, packageEntry } from "./catalog-fixture.ts";

const catalog = () => ({
  targets_version: 37,
  expires: "2027-01-01T00:00:00Z",
  aliases: { rg: "example" },
  packages: { example: packageEntry() },
});

test("normalization tolerates missing optional fields and ignores future fields and platforms", () => {
  const value = catalog();
  Object.assign(value.packages.example, {
    aliases: undefined,
    maintainers: undefined,
    added: undefined,
    future: true,
  });
  value.packages.example.default["future-os"] = "broken";
  value.packages.example.versions["1.0.0"]["future-os"] = null as never;
  const entry = parseCatalog(value).packages[0];
  assert.deepEqual(entry.aliases, ["rg"]);
  assert.deepEqual(entry.maintainers, []);
  assert.equal(entry.added, undefined);
  assert.deepEqual(Object.keys(entry.default), ["aarch64-macos"]);
  assert.deepEqual(Object.keys(entry.versions["1.0.0"]), ["aarch64-macos"]);
});

test("invalid catalog shapes and mismatched names fail instead of dropping packages", () => {
  for (const value of [
    null,
    [],
    { packages: [] },
    { ...catalog(), packages: { example: { name: "other", versions: {} } } },
    { ...catalog(), packages: { example: { name: "example", versions: [] } } },
  ]) {
    assert.throws(() => parseCatalog(value));
  }
  const value = catalog();
  value.packages.example.default["aarch64-linux"] = "2.0";
  assert.throws(() => parseCatalog(value), /has no output/);
});

test("missing output exports normalize to a library and unsafe homepage schemes fail", () => {
  const value = catalog();
  value.packages.example.versions["1.0.0"]["aarch64-macos"] = {
    key: output.key,
    manifest: output.manifest,
  } as typeof output;
  assert.deepEqual(parseCatalog(value).packages[0].versions["1.0.0"]["aarch64-macos"].bins, []);
  value.packages.example.homepage = "javascript:alert(1)";
  assert.throws(() => parseCatalog(value), /homepage/);
});

test("build exports snapshots, merges aliases, reuses dev cache, and preserves it on rb failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "pdr-browser-test-"));
  const cwd = process.cwd();
  const previousBinary = process.env.RB;
  const binary = join(directory, "rb");
  const value = catalog();
  value.packages.example.aliases = ["entry-alias"];
  try {
    await writeFile(
      binary,
      `#!/usr/bin/env node\nif (process.argv.slice(2).join(' ') !== 'drv catalog') process.exit(2);\nprocess.stdout.write(${JSON.stringify(JSON.stringify(value))});\n`,
      { mode: 0o700 },
    );
    process.env.RB = binary;
    process.chdir(directory);
    const manifest = await prepareCatalog();
    const index: CatalogSnapshot = JSON.parse(
      await readFile(`public${manifest.dataPath}/index.json`, "utf8"),
    );
    assert.equal(index.targets_version, 37);
    assert.equal(index.expires, value.expires);
    assert.equal(searchPage(index.packages, readSearch(new URLSearchParams("q=rg"))).count, 1);
    assert.equal(
      searchPage(index.packages, readSearch(new URLSearchParams("q=entry-alias"))).count,
      1,
    );
    assert.equal(
      searchPage(index.packages, readSearch(new URLSearchParams("platform=aarch64-linux"))).count,
      0,
    );
    const pkg = JSON.parse(await readFile(`public${manifest.dataPath}/example.json`, "utf8"));
    assert.deepEqual(pkg.pkg.versions, value.packages.example.versions);
    assert.deepEqual(JSON.parse(await readFile("public/catalog.json", "utf8")), index);
    assert.deepEqual(JSON.parse(await readFile("public/packages/example/data.json", "utf8")), pkg);
    await rm("public/catalog.json");
    assert.deepEqual(await prepareCatalog(), manifest);
    assert.deepEqual(JSON.parse(await readFile("public/catalog.json", "utf8")), index);
    await writeFile(
      binary,
      '#!/usr/bin/env node\nconsole.error("verification failed"); process.exit(1);\n',
    );
    await rm("public/packages/example/data.json");
    assert.deepEqual(await prepareCatalog(false), manifest);
    assert.deepEqual(JSON.parse(await readFile("public/packages/example/data.json", "utf8")), pkg);
    await assert.rejects(prepareCatalog(), /Install rb.*\nverification failed/);
    assert.deepEqual(JSON.parse(await readFile("public/_catalog/manifest.json", "utf8")), manifest);
    await writeFile(
      binary,
      `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(JSON.stringify({ ...value, targets_version: 38, packages: {} }))});\n`,
    );
    await prepareCatalog();
    assert.deepEqual(JSON.parse(await readFile("public/catalog.json", "utf8")).packages, []);
    await assert.rejects(readFile("public/packages/example/data.json"), { code: "ENOENT" });
  } finally {
    process.chdir(cwd);
    if (previousBinary === undefined) delete process.env.RB;
    else process.env.RB = previousBinary;
    await rm(directory, { recursive: true, force: true });
  }
});
