import { rawField } from "./raw.ts";
import { bytes, pdrUrl } from "./transport.ts";
import type { CatalogSource, PackageRecord } from "./types.ts";
import { verifyDigest, verifyRecord } from "./verify.ts";

const RECORD_LIMIT = 1024 * 1024;

export async function loadRecord(
  source: CatalogSource,
  digest: string,
  expect: { name: string; version: string; system: string },
): Promise<PackageRecord> {
  const raw = await bytes(pdrUrl(source.url, "records", digest), RECORD_LIMIT);
  await verifyDigest(raw, digest, "The package record could not be verified.");

  const text = new TextDecoder().decode(raw);
  const document = JSON.parse(text);
  await verifyRecord(rawField(text, "record"), document.signature, source.publicKey);

  const record = document.record;
  const artifact = record?.artifact;
  if (record?.schema !== 2 || !artifact?.package) {
    throw new Error("The package record is not supported.");
  }
  if (
    artifact.package.name !== expect.name ||
    artifact.package.version !== expect.version ||
    record.system !== expect.system
  ) {
    throw new Error("The package record does not match the package requested.");
  }

  return {
    system: record.system,
    revision: artifact.revision,
    source: sourceReference(artifact.package.source),
    receiptSha256: artifact.receipt_sha256,
    published: record.published,
  };
}

function sourceReference(source: unknown): string {
  const url = (source as { Url?: { url?: string } })?.Url?.url;
  return typeof url === "string" ? url : "";
}
