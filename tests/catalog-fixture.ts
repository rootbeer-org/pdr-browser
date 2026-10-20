import type { IndexEntry, IndexOutput } from "../src/catalog/types.ts";

export const output: IndexOutput = {
  key: "a".repeat(32),
  manifest: `sha256:${"1".repeat(64)}`,
  bins: ["tool"],
  apps: {},
};

export function packageEntry(versions = ["1.0.0"]): IndexEntry {
  return {
    name: "example",
    description: "Example tool",
    homepage: "",
    license: "",
    aliases: [],
    maintainers: [],
    default: { "aarch64-macos": versions[0] },
    versions: Object.fromEntries(versions.map((version) => [version, { "aarch64-macos": output }])),
  };
}
