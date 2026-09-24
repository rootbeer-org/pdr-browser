import { bytes, pdrUrl } from "./transport.ts";
import { validateDocument } from "./validate.ts";
import { verifyDigest } from "./verify.ts";
import type { CatalogSource, PackageDocument, RootPackage } from "./types.ts";

const DOCUMENT_LIMIT = 1024 * 1024;

export async function loadDocument(
  source: CatalogSource,
  pkg: RootPackage,
): Promise<PackageDocument> {
  const raw = await bytes(pdrUrl(source.url, "packages", pkg.document), DOCUMENT_LIMIT);
  await verifyDigest(raw, pkg.document, "The package details could not be verified.");

  return validateDocument(JSON.parse(new TextDecoder().decode(raw)), pkg);
}
