import type { IndexOutput, PackageKind } from "./types.ts";

export type UsageMode = "run" | "use" | "config";
export type DetailMode = UsageMode | "bootstrap";

export interface SnippetRequest {
  mode: DetailMode;
  version: string;
  isPinned: boolean;
  bin: string;
  app: string;
}

const BOOTSTRAP_SNIPPET =
  'sh -c "$(curl -fsSL https://rbpkg.com/rb.sh)"\neval "$("/opt/rb/profiles/$(id -u)/user/bin/rb" env)"';

export function packageKind(output: IndexOutput | undefined): PackageKind {
  if (Object.keys(output?.apps ?? {}).length) return "app";
  if (output?.bins.length) return "command";
  return "library";
}

export function primaryCommand(name: string, output: IndexOutput): string {
  return output.bins.includes(name) ? name : output.bins.length === 1 ? output.bins[0] : "";
}

export function usageModes(name: string, output: IndexOutput): [DetailMode, string][] {
  const isRootbeer = name === "rootbeer";
  return [
    ...(isRootbeer ? ([["bootstrap", "Install Rootbeer"]] as [DetailMode, string][]) : []),
    ["use", isRootbeer ? "Install with rb" : "Install"],
    ...(output.bins.length || Object.keys(output.apps).length
      ? ([["run", "Run once"]] as [DetailMode, string][])
      : []),
    ["config", "Lua config"],
  ];
}

export function usageSnippet(name: string, output: IndexOutput, request: SnippetRequest): string {
  if (request.mode === "bootstrap") return BOOTSTRAP_SNIPPET;
  const target = request.isPinned ? `${name}@${request.version}` : name;
  if (request.mode === "config") return `rb.package(${JSON.stringify(target)})`;

  let option = "";
  if (request.mode === "run") {
    if (request.app) option = ` --app ${quote(request.app)}`;
    else if (output.bins.length > 1 && request.bin !== name)
      option = ` --bin ${quote(request.bin)}`;
  }
  return `rb ${request.mode} ${quote(target)}${option}`;
}

function quote(value: string): string {
  return /^[a-zA-Z0-9._+@:/-]+$/.test(value) ? value : `'${value.replace(/'/g, "'\\''")}'`;
}
