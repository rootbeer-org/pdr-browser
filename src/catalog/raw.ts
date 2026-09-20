export function rawField(text: string, key: string): string {
  const marker = `"${key}":`;
  const start = text.indexOf(marker);
  if (start < 0) throw new Error("The package record is malformed.");

  let index = text.indexOf("{", start + marker.length);
  if (index < 0) throw new Error("The package record is malformed.");

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let cursor = index; cursor < text.length; cursor++) {
    const character = text[cursor];

    if (escaped) escaped = false;
    else if (character === "\\") escaped = true;
    else if (character === '"') inString = !inString;
    else if (!inString && character === "{") depth++;
    else if (!inString && character === "}" && --depth === 0) {
      return text.slice(index, cursor + 1);
    }
  }
  throw new Error("The package record is malformed.");
}
