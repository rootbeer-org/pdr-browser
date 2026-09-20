import { bytes } from "./transport.ts";
import { validateManifest } from "./validate.ts";
import { verifyManifest } from "./verify.ts";
import { availableVersions } from "./versions.ts";
import type { Catalog, CatalogSource } from "./types.ts";

const MANIFEST_LIMIT = 16 * 1024 * 1024;

export async function loadCatalog(source: CatalogSource): Promise<Catalog> {
  // TODO: Turn this into a streaming JSON decoder because the manifest grows
  const manifest = JSON.parse(new TextDecoder().decode(await bytes(source.url, MANIFEST_LIMIT)));
  await verifyManifest(manifest, source.publicKey);
  const packages = validateManifest(manifest);

  return {
    packages: packages
      .filter((pkg) => availableVersions(pkg).length)
      .sort((a, b) => a.name.localeCompare(b.name)),
    records: manifest.records,
    sequence: manifest.sequence,
  };
}
