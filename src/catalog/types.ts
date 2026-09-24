export interface CatalogSource {
  url: string;
  publicKey: string;
}

export type PackageKind = "command" | "library" | "app";

export interface RootPlatform {
  version: string;
  kind: PackageKind;
  commands: string[];
}

export interface RootPackage {
  name: string;
  aliases: string[];
  description: string;
  homepage: string;
  license: string;
  added: number;
  updated: number;
  platforms: Record<string, RootPlatform>;
  document: string;
}

export interface Root {
  packages: RootPackage[];
  sequence: number;
}

export interface PackageDocument {
  name: string;
  versions: Record<string, DocumentVersion>;
}

export interface DocumentVersion {
  license: string;
  revision: number;
  platforms: Record<string, DocumentPlatform>;
}

export interface DocumentPlatform {
  recipe: CatalogRecipe;
  record: string;
  published: number;
}

/** Bare names defer their paths to the artifact; a map fixes them. */
export type Bins = string[] | Record<string, string>;

export interface CatalogRecipe {
  bins?: Bins;
  apps?: Record<string, string>;
  source?: string;
  build?: {
    backend?: string;
    url: string;
    libraries?: string[];
    dependencies?: (string | { package: string; kind: DependencyKind })[];
  };
}

export type DependencyKind = "all" | "build" | "link" | "runtime" | "link_runtime";
export interface PackageRecord {
  system: string;
  revision: number;
  source: string;
  receiptSha256: string;
  published: number;
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
