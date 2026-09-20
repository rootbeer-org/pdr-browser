import type { CatalogRecipe } from "../catalog/types.ts";
import { indexRepositoryUrl } from "../config.ts";

export function packageHref(name: string, version = "", system = ""): string {
  const params = new URLSearchParams({ show: name });
  if (version) params.set("version", version);
  if (system) params.set("platform", system);
  return `${import.meta.env.BASE_URL}?${params}`;
}

export function recipeHref(name: string): string {
  return `${indexRepositoryUrl}/blob/main/packages/${name}.lua`;
}

export function sourceHref(recipe: CatalogRecipe | undefined): string {
  const release = recipe?.source?.match(/^github:([^@]+)@(.+)$/);
  if (release) {
    return `https://github.com/${release[1]}/releases/tag/${encodeURIComponent(release[2])}`;
  }

  const url = recipe?.build?.url;
  if (!url) return "";
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? url : "";
  } catch {
    return "";
  }
}
