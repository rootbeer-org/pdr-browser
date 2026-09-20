const TIMEOUT_MS = 15000;

export function hex(value: string, length: number): Uint8Array<ArrayBuffer> {
  if (!new RegExp(`^[0-9a-f]{${length * 2}}$`).test(value)) {
    throw new Error("The catalog contains an invalid verification value.");
  }
  return Uint8Array.from(value.match(/../g)!, (byte) => parseInt(byte, 16));
}

export function webUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("The catalog contains a link that is not a web address.");
  }
  return url.href;
}

export async function bytes(url: string, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const parsedUrl = new URL(url);
  if (!parsedUrl.protocol.startsWith("http")) {
    throw new Error("The catalog must be served over HTTP(s).");
  }

  const response = await fetch(parsedUrl.href, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok || !response.body) {
    throw new Error("The package catalog is unavailable. Try again shortly.");
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) throw new Error("The catalog response is too large.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }

  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }
  return output;
}
