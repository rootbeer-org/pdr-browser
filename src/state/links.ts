import { recipesUrl } from "../config.ts";

export function packageHref(name: string, version = "", system = ""): string {
  const params = new URLSearchParams();
  if (version) params.set("version", version);
  if (system) params.set("platform", system);
  const path = `/packages/${encodeURIComponent(name)}/`;
  return params.size ? `${path}?${params}` : path;
}

export function recipeHref(name: string): string {
  return `${recipesUrl}/blob/main/packages/${name}.lua`;
}
