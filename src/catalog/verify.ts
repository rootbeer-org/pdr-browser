import { hex } from "./transport.ts";

const SIGNING_TAG = "rootbeer-pdr-v3";
const RECORD_TAG = "rootbeer-package-v1\0";

/** Serialized directly: object key order would put digit-only keys first. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value === null || typeof value !== "object") return JSON.stringify(value);

  const source = value as Record<string, unknown>;
  const entries = Object.keys(source)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${canonical(source[key])}`);
  return `{${entries.join(",")}}`;
}

export async function verifyRoot(root: any, publicKey: string): Promise<void> {
  if (root.schema !== 3 || !Number.isSafeInteger(root.sequence) || root.sequence <= 0) {
    throw new Error("The package repository is not supported.");
  }

  const message = new TextEncoder().encode(canonical([SIGNING_TAG, root.sequence, root.packages]));
  const valid = await crypto.subtle.verify(
    "Ed25519",
    await publisherKey(publicKey),
    hex(root.signature, 64),
    message,
  );

  if (!valid) throw new Error("The package repository signature could not be verified.");
}

async function publisherKey(publicKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", hex(publicKey, 32), "Ed25519", false, ["verify"]);
}

/** Pins fetched bytes to the digest the signed root committed to. */
export async function verifyDigest(
  bytes: Uint8Array<ArrayBuffer>,
  sha256: string,
  message: string,
): Promise<void> {
  const digest = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

  if (digest !== sha256) throw new Error(message);
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
