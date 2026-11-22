import type { IndexOutput } from "./types.ts";

export type UsageMode = "bootstrap" | "use" | "run" | "config";

export interface RunTarget {
  name: string;
  isApp: boolean;
}

export interface SnippetRequest {
  mode: UsageMode;
  version: string;
  isPinned: boolean;
  target?: RunTarget;
}

const BOOTSTRAP_SNIPPET =
  'sh -c "$(curl -fsSL https://rbpkg.com/rb.sh)"\neval "$("/opt/rb/profiles/$(id -u)/user/bin/rb" env)"';

export function usageModes(name: string, output: IndexOutput): [UsageMode, string][] {
  const isRootbeer = name === "rootbeer";
  const modes: [UsageMode, string][] = [];
  if (isRootbeer) modes.push(["bootstrap", "Install Rootbeer"]);
  modes.push(["use", isRootbeer ? "Install with rb" : "Install"]);
  if (output.bins.length || Object.keys(output.apps).length) modes.push(["run", "Run once"]);
  modes.push(["config", "Lua config"]);
  return modes;
}

export function usageSnippet(name: string, output: IndexOutput, request: SnippetRequest): string {
  if (request.mode === "bootstrap") return BOOTSTRAP_SNIPPET;
  const spec = request.isPinned ? `${name}@${request.version}` : name;
  if (request.mode === "config") return `rb.package(${JSON.stringify(spec)})`;

  const { target } = request;
  let option = "";
  if (request.mode === "run" && target?.isApp) option = ` --app ${quote(target.name)}`;
  else if (request.mode === "run" && target && output.bins.length > 1 && target.name !== name)
    option = ` --bin ${quote(target.name)}`;
  return `rb ${request.mode} ${quote(spec)}${option}`;
}

function quote(value: string): string {
  return /^[a-zA-Z0-9._+@:/-]+$/.test(value) ? value : `'${value.replace(/'/g, "'\\''")}'`;
}
