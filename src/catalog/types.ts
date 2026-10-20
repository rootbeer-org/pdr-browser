export type PackageKind = "command" | "library" | "app";

export interface IndexOutput {
  key: string;
  manifest: string;
  bins: string[];
  apps: Record<string, string>;
}

export interface IndexEntry {
  name: string;
  description: string;
  homepage: string;
  license: string;
  aliases: string[];
  maintainers: string[];
  added?: number;
  updated?: number;
  default: Record<string, string>;
  versions: Record<string, Record<string, IndexOutput>>;
}

export interface PackageSummary extends Omit<IndexEntry, "versions"> {
  outputs: Record<string, IndexOutput>;
}

export interface IndexMetadata {
  targets_version: number;
  expires: string;
}

export interface CatalogSnapshot extends IndexMetadata {
  packages: PackageSummary[];
}

export interface PackageSnapshot extends IndexMetadata {
  pkg: IndexEntry;
}

export interface CatalogManifest {
  format: 1;
  dataPath: string;
  names: string[];
}

export interface Platform {
  id: string;
  label: string;
  short: string;
}

export const platforms: Platform[] = [
  { id: "aarch64-macos", label: "macOS · Apple Silicon", short: "macOS ARM64" },
  { id: "aarch64-linux", label: "Linux · ARM64", short: "Linux ARM64" },
  { id: "x86_64-linux", label: "Linux · x86-64", short: "Linux x86-64" },
];
