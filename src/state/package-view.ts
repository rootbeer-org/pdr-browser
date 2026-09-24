import { createEffect, createSignal, on } from "solid-js";
import {
  binNames,
  packageKind,
  primaryCommand,
  usageSnippet,
  type DetailMode,
} from "../catalog/commands.ts";
import { platforms, type PackageDocument, type RootPackage } from "../catalog/types.ts";
import { availableVersions, defaultVersion, preferredVersion } from "../catalog/versions.ts";
import { platform, version } from "./browser-state.ts";

export type PackageView = ReturnType<typeof createPackageView>;

export function createPackageView(pkg: RootPackage, document: PackageDocument) {
  const [mode, setMode] = createSignal<DetailMode>(
    pkg.name === "rootbeer" && !version() ? "bootstrap" : "use",
  );
  const [selectedBin, setSelectedBin] = createSignal("");

  const versions = () => availableVersions(document, platform());
  const selectedVersion = () =>
    versions().includes(version()) ? version() : preferredVersion(pkg, document, platform());
  const entry = () => document.versions[selectedVersion()];
  const systems = () =>
    platforms.map(({ id }) => id).filter((id) => Object.hasOwn(entry().platforms, id));
  const system = () => (systems().includes(platform()) ? platform() : systems()[0]);
  const recipe = () => entry().platforms[system()].recipe;
  const bins = () => binNames(recipe());

  const kind = () => packageKind(recipe());
  const isLibrary = () => kind() === "library";
  const isApp = () => kind() === "app";
  const isDefaultAvailable = () => versions().includes(defaultVersion(pkg, platform()));
  const isInvalidVersion = () => Boolean(version()) && !versions().includes(version());
  const isPinned = () => Boolean(version()) || !isDefaultAvailable();

  const defaultBin = () => primaryCommand(pkg, recipe()) || bins()[0] || "";
  const bin = () => (bins().includes(selectedBin()) ? selectedBin() : defaultBin());

  createEffect(on(version, () => mode() === "bootstrap" && setMode("use"), { defer: true }));
  createEffect(on(selectedVersion, () => setSelectedBin(""), { defer: true }));

  return {
    pkg,
    document,
    versions,
    selectedVersion,
    entry,
    systems,
    system,
    recipe,
    bins,
    defaultBin,
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
