import { platforms, type PackageKind } from "../catalog/types.ts";
import { ALL_PLATFORMS } from "../catalog/search.ts";

export const KIND_LABELS: Record<PackageKind, string> = {
  command: "Commands",
  app: "Apps",
  library: "Libraries",
};

export function platformLabel(id: string): string {
  if (!id) return "Any platform";
  if (id === ALL_PLATFORMS) return "All platforms";
  return platforms.find((platform) => platform.id === id)?.short ?? id;
}
