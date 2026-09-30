import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { loadRoot } from "../src/catalog/load.ts";
import { loadDocument } from "../src/catalog/document.ts";
import { loadRecord } from "../src/catalog/record.ts";
import type { CatalogSource, PackageRecord } from "../src/catalog/types.ts";

export async function prepareCatalog(source: CatalogSource, refresh = true) {
  const cached = await readCatalogManifest().catch((error) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (
    !refresh &&
    cached?.source?.url === source.url &&
    cached.source.publicKey === source.publicKey
  ) {
    return cached;
  }

  console.log("Checking package catalog…");
  const root = await loadRoot(source);
  const snapshot = createHash("sha256")
    .update(JSON.stringify([source, root]))
    .digest("hex");
  const dataPath = `/_catalog/${snapshot}`;
  const directory = `public${dataPath}`;
  const manifest = { source, dataPath, names: root.packages.map((pkg) => pkg.name) };
  if (cached?.dataPath === dataPath) {
    await writeFile("public/_catalog/manifest.json", JSON.stringify(manifest));
    console.log("Catalog unchanged; using local snapshot.");
    return manifest;
  }

  console.log(`Fetching documents and build records for ${root.packages.length} packages…`);
  await mkdir(directory, { recursive: true });

  let cursor = 0;
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (cursor < root.packages.length) {
        const pkg = root.packages[cursor++];
        const document = await loadDocument(source, pkg);
        const records: Record<string, PackageRecord> = {};
        for (const [version, entry] of Object.entries(document.versions)) {
          for (const [system, platform] of Object.entries(entry.platforms)) {
            records[platform.record] = await loadRecord(source, platform.record, {
              name: pkg.name,
              version,
              system,
            });
          }
        }
        await writeFile(
          `${directory}/${pkg.document}.json`,
          JSON.stringify({ pkg, document, records }),
        );
      }
    }),
  );

  await writeFile(`${directory}/index.json`, JSON.stringify(root));
  await writeFile("public/_catalog/manifest.json", JSON.stringify(manifest));
  for (const entry of await readdir("public/_catalog", { withFileTypes: true })) {
    if (entry.isDirectory() && /^[0-9a-f]{64}$/.test(entry.name) && entry.name !== snapshot) {
      await rm(`public/_catalog/${entry.name}`, { recursive: true });
    }
  }
  console.log(`Verified ${root.packages.length} packages for static generation.`);
  return manifest;
}

export async function readCatalogManifest() {
  return JSON.parse(await readFile("public/_catalog/manifest.json", "utf8")) as {
    source?: CatalogSource;
    dataPath: string;
    names: string[];
  };
}
