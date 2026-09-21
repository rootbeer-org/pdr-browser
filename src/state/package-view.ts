import { createEffect, createSignal, on } from "solid-js";
import { packageKind, primaryCommand, usageSnippet, type DetailMode } from "../catalog/commands.ts";
import type { CatalogPackage } from "../catalog/types.ts";
import { availableVersions, defaultVersion, preferredVersion } from "../catalog/versions.ts";
import { platform, version } from "./browser-state.ts";

export type PackageView = ReturnType<typeof createPackageView>;

export function createPackageView(pkg: CatalogPackage) {
  const [mode, setMode] = createSignal<DetailMode>(
    pkg.name === "rootbeer" && !version() ? "bootstrap" : "use",
  );
  const [selectedBin, setSelectedBin] = createSignal("");

  const versions = () => availableVersions(pkg, platform());
  const selectedVersion = () =>
    versions().includes(version()) ? version() : preferredVersion(pkg, platform());
  const recipe = () => pkg.versions[selectedVersion()];

  const kind = () => packageKind(recipe());
  const isLibrary = () => kind() === "library";
  const isApp = () => kind() === "app";
  const isDefaultAvailable = () => versions().includes(defaultVersion(pkg, platform()));
  const isInvalidVersion = () => Boolean(version()) && !versions().includes(version());
  const isPinned = () => Boolean(version()) || !isDefaultAvailable();

  const defaultBin = () => primaryCommand(pkg, selectedVersion()) || recipe().bins[0] || "";
  const bin = () => (recipe().bins.includes(selectedBin()) ? selectedBin() : defaultBin());

  createEffect(on(version, () => mode() === "bootstrap" && setMode("use"), { defer: true }));
  createEffect(on(selectedVersion, () => setSelectedBin(""), { defer: true }));

  return {
    pkg,
    versions,
    selectedVersion,
    recipe,
    kind,
    isLibrary,
    isApp,
    isDefaultAvailable,
    isInvalidVersion,
    isPinned,
    mode,
    setMode,
    bin,
    selectedBin,
    selectBin: setSelectedBin,
    chooseCommand: (name: string) => {
      setSelectedBin(name === defaultBin() ? "" : name);
      setMode("run");
    },
    snippet: () =>
      usageSnippet(pkg, recipe(), {
        mode: mode(),
        version: selectedVersion(),
        isPinned: isPinned(),
        bin: bin(),
      }),
  };
}
