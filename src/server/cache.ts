export function createCache(maxBytes: number) {
  const entries = new Map<string, { value: string; expires: number; size: number }>();
  let bytes = 0;
  const remove = (key: string) => {
    bytes -= entries.get(key)?.size ?? 0;
    entries.delete(key);
  };

  return {
    get(key: string): string | undefined {
      const entry = entries.get(key);
      if (!entry) return;
      if (entry.expires <= Date.now()) {
        remove(key);
        return;
      }
      entries.delete(key);
      entries.set(key, entry);
      return entry.value;
    },
    set(key: string, value: string, seconds: number): void {
      remove(key);
      const size = (key.length + value.length) * 2;
      if (size > maxBytes || seconds <= 0) return;
      while (bytes + size > maxBytes) remove(entries.keys().next().value!);
      entries.set(key, { value, expires: Date.now() + seconds * 1000, size });
      bytes += size;
    },
    clear(): void {
      entries.clear();
      bytes = 0;
    },
  };
}

export const dataCache = createCache(16 * 1024 * 1024);

export async function cachedData<T>(
  key: string,
  seconds: number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = dataCache.get(key);
  if (hit !== undefined) return JSON.parse(hit) as T;

  const data = await load();
  dataCache.set(key, JSON.stringify(data), seconds);
  return data;
}
