export type PackageKind = "command" | "library" | "app";

export interface IndexOutput {
  key: string;
  manifest: string;
  bins: string[];
  apps: Record<string, string>;
  build?: string;
  tag?: string;
  runtime_dependencies: string[];
  host: string[];
}

export interface IndexEntry {
  name: string;
  description: string;
  homepage: string;
  repository?: string;
  license: string;
  aliases: string[];
  maintainers: string[];
  added?: number;
  updated?: number;
  default: Record<string, string>;
  versions: Record<string, Record<string, IndexOutput>>;
}

export interface PackageSummary extends Pick<
  IndexEntry,
  "name" | "description" | "homepage" | "aliases" | "added" | "updated" | "default"
> {
  outputs: Record<string, { bins: string[]; apps: string[] }>;
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

export const platforms = [
  { id: "aarch64-macos", short: "macOS ARM64" },
  { id: "aarch64-linux", short: "Linux ARM64" },
  { id: "x86_64-linux", short: "Linux x86-64" },
];
