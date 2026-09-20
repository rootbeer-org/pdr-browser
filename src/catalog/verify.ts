import { hex } from "./transport.ts";

const SIGNING_TAG = "rootbeer-discovery-v1";
const RECORD_TAG = "rootbeer-package-v1\0";

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;

  const source = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(source)
      .sort()
      .map((key) => [key, canonical(source[key])]),
  );
}

export async function verifyManifest(manifest: any, publicKey: string): Promise<void> {
  if (manifest.schema !== 2 || !Number.isSafeInteger(manifest.sequence) || manifest.sequence <= 0) {
    throw new Error("The catalog manifest is not supported.");
  }

  const key = await crypto.subtle.importKey("raw", hex(publicKey, 32), "Ed25519", false, [
    "verify",
  ]);
  const message = new TextEncoder().encode(
    JSON.stringify(canonical([SIGNING_TAG, manifest.sequence, manifest.catalog, manifest.records])),
  );

  if (!(await crypto.subtle.verify("Ed25519", key, hex(manifest.signature, 64), message))) {
    throw new Error("The package catalog signature could not be verified.");
  }
}

async function publisherKey(publicKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", hex(publicKey, 32), "Ed25519", false, ["verify"]);
}

/** Pins fetched bytes to the digest the signed manifest published for them. */
export async function verifyDigest(bytes: Uint8Array<ArrayBuffer>, sha256: string): Promise<void> {
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  if (digest !== sha256) throw new Error("The package record could not be verified.");
}

export async function verifyRecord(
  rawRecord: string,
  signature: string,
  publicKey: string,
): Promise<void> {
  const message = new TextEncoder().encode(RECORD_TAG + rawRecord);
  const valid = await crypto.subtle.verify(
    "Ed25519",
    await publisherKey(publicKey),
    hex(signature, 64),
    message,
  );

  if (!valid) throw new Error("The package record signature could not be verified.");
}

export async function verifyApproval(approval: any, publicKey: string): Promise<void> {
  if (approval.schema !== 1 || !Number.isSafeInteger(approval.sequence) || approval.sequence <= 0) {
    throw new Error("The package record carries an unsupported approval.");
  }

  const message = new TextEncoder().encode(
    JSON.stringify([
      "rootbeer-index-v1",
      approval.sequence,
      approval.index.url,
      approval.index.sha256,
    ]),
  );
  const valid = await crypto.subtle.verify(
    "Ed25519",
    await publisherKey(publicKey),
    hex(approval.signature, 64),
    message,
  );

  if (!valid) throw new Error("The package record approval could not be verified.");
}
