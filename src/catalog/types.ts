export interface CatalogSource {
  url: string;
  publicKey: string;
}

export interface CatalogPackage {
  name: string;
  aliases: string[];
  description: string;
  homepage: string;
  default_version: string;
  default_versions?: Record<string, string>;
  versions: Record<string, CatalogRecipe>;
}

export interface CatalogRecipe {
  systems: string[];
  bins: string[];
  apps?: Record<string, string>;
  revision: number;
  source?: string;
  build?: {
    url: string;
    libraries?: string[];
    dependencies?: (string | { package: string; kind: DependencyKind })[];
  };
}

export type DependencyKind = "all" | "build" | "link" | "runtime" | "link_runtime";
export interface RecordPin {
  url: string;
  sha256: string;
}

export type PackageRecords = Record<string, Record<string, RecordPin>>;
export interface Catalog {
  packages: CatalogPackage[];
  records: PackageRecords;
  sequence: number;
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
