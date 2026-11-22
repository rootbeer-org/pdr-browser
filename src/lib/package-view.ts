import { createSignal } from "solid-js";
import { usageSnippet, type UsageMode } from "#/catalog/commands.ts";
import type { PackageSnapshot } from "#/catalog/types.ts";
import {
  availableVersions,
  defaultVersion,
  packagePlatform,
  preferredVersion,
} from "#/catalog/versions.ts";
import { urlState } from "./url-state.ts";

export type PackageView = ReturnType<typeof createPackageView>;

export function createPackageView({ pkg, targets_version, expires }: PackageSnapshot) {
  const { version } = urlState;
  const system = () => packagePlatform(pkg, urlState.system(), version());
  const versions = () => availableVersions(pkg, system());
  const selectedVersion = () =>
    versions().includes(version()) ? version() : preferredVersion(pkg, system());
  const entry = () => pkg.versions[selectedVersion()];
  const output = () => entry()[system()];
  const apps = () => Object.keys(output().apps);

  const runTargets = () => [
    ...apps().map((name) => ({ id: `app:${name}`, name, isApp: true })),
    ...output().bins.map((name) => ({ id: `bin:${name}`, name, isApp: false })),
  ];
  const [chosenTarget, selectRunTarget] = createSignal("");
  const runTarget = () =>
    runTargets().find(({ id }) => id === chosenTarget()) ??
    runTargets().find(({ isApp }) => isApp) ??
    runTargets().find(({ name }) => name === pkg.name) ??
    runTargets()[0];

  const [chosenMode, setMode] = createSignal<UsageMode>();
  const mode = (): UsageMode => {
    const chosen = chosenMode() ?? (pkg.name === "rootbeer" && !version() ? "bootstrap" : "use");
    return chosen === "run" && !runTargets().length ? "use" : chosen;
  };

  const isDefaultAvailable = () => versions().includes(defaultVersion(pkg, system()));
  const isInvalidVersion = () => Boolean(version()) && !versions().includes(version());
  const isPinned = () => Boolean(version()) || !isDefaultAvailable();

  return {
    pkg,
    targets_version,
    expires,
    system,
    versions,
    selectedVersion,
    entry,
    output,
    apps,
    runTargets,
    runTarget,
    selectRunTarget,
    mode,
    setMode,
    isDefaultAvailable,
    isInvalidVersion,
    isPinned,
    snippet: () =>
      usageSnippet(pkg.name, output(), {
        mode: mode(),
        version: selectedVersion(),
        isPinned: isPinned(),
        target: runTarget(),
      }),
  };
}
