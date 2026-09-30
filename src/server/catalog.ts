import "server-only";
import { loadRoot } from "../catalog/load.ts";
import { loadDocument } from "../catalog/document.ts";
import { loadRecord } from "../catalog/record.ts";
import { catalogSource } from "../config.ts";
import { cachedData } from "./cache.ts";

const namespace = `v1:${catalogSource.url}:${catalogSource.publicKey}`;

export function getRoot() {
  return cachedData(`${namespace}:root`, 60, () => loadRoot(catalogSource));
}

export async function getPackage(name: string) {
  if (!/^[a-z0-9][a-z0-9+._-]*$/.test(name)) return null;
  const root = await getRoot();
  const pkg = root.packages.find((entry) => entry.name === name);
  if (!pkg) return null;

  const document = await cachedData(`${namespace}:document:${name}:${pkg.document}`, 86400, () =>
    loadDocument(catalogSource, pkg),
  );
  return { pkg, document };
}

export async function getRecord(name: string, version: string, system: string) {
  const data = await getPackage(name);
  const entry = data?.document.versions[version]?.platforms[system];
  if (!entry) throw new Error("The requested build is not in the published collection.");

  return cachedData(`${namespace}:record:${name}:${version}:${system}:${entry.record}`, 86400, () =>
    loadRecord(catalogSource, entry.record, { name, version, system }),
  );
}
