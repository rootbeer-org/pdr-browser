import { hex } from "./transport.ts";

const SIGNING_TAG = "rootbeer-discovery-v1";

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
