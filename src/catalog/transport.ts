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

/** PDR documents live beside the root, so a mirror is a copy of the directory. */
export function pdrUrl(root: string, kind: "packages" | "records", digest: string): string {
  return new URL(`${kind}/${digest}.json`, root).href;
}

export async function bytes(url: string, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("The catalog must be served over HTTP(s).");
  }

  const response = await fetchCatalog(parsedUrl);
  if (!response.body) {
    throw new Error(`Catalog response has no body: ${parsedUrl.origin}${parsedUrl.pathname}`);
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

async function fetchCatalog(url: URL): Promise<Response> {
  const location = `${url.origin}${url.pathname}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response;
    try {
      response = await fetch(url.href, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch (cause) {
      if (attempt === 2)
        throw new Error(`Catalog request failed after 3 attempts: ${location}`, { cause });
      await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt));
      continue;
    }

    if (response.ok) return response;

    await response.body?.cancel();
    const canRetry = [408, 429, 500, 502, 503, 504].includes(response.status);
    if (!canRetry || attempt === 2) {
      throw new Error(
        `Catalog request failed: HTTP ${response.status} ${response.statusText} (${location})`,
      );
    }

    const retryAfter = response.headers.get("retry-after");
    const retryDelay =
      retryAfter === null
        ? NaN
        : /^\d+$/.test(retryAfter)
          ? Number(retryAfter) * 1000
          : Date.parse(retryAfter) - Date.now();
    const delay = Number.isFinite(retryDelay)
      ? Math.min(5000, Math.max(0, retryDelay))
      : 250 * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(`Catalog request failed: ${location}`);
}
