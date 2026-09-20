import { rawField } from "./raw.ts";
import { bytes, webUrl } from "./transport.ts";
import type { PackageRecord, RecordPin } from "./types.ts";
import { verifyApproval, verifyDigest, verifyRecord } from "./verify.ts";

const RECORD_LIMIT = 1024 * 1024;

export async function loadRecord(
  pin: RecordPin,
  publicKey: string,
  expect: { name: string; version: string; system: string },
): Promise<PackageRecord> {
  const raw = await bytes(pin.url, RECORD_LIMIT);
  await verifyDigest(raw, pin.sha256);

  const text = new TextDecoder().decode(raw);
  const document = JSON.parse(text);
  await verifyRecord(rawField(text, "record"), document.signature, publicKey);

  const record = document.record;
  const artifact = record?.artifact;
  if (record?.schema !== 1 || !artifact?.package) {
    throw new Error("The package record is not supported.");
  }
  if (
    artifact.package.name !== expect.name ||
    artifact.package.version !== expect.version ||
    record.system !== expect.system
  ) {
    throw new Error("The package record does not match the package requested.");
  }

  const receipt = record.provenance?.receipt;
  const approval = record.provenance?.approval;
  if (approval) await verifyApproval(approval, publicKey);

  return {
    system: record.system,
    revision: artifact.revision,
    source: sourceReference(artifact.package.source),
    receiptSha256: artifact.receipt_sha256,
    receiptUrl: receipt?.url ? webUrl(receipt.url) : undefined,
    approvalSequence: approval?.sequence,
    approvalUrl: approval ? webUrl(approval.index.url) : undefined,
  };
}

function sourceReference(source: unknown): string {
  const url = (source as { Url?: { url?: string } })?.Url?.url;
  return typeof url === "string" ? url : "";
}
