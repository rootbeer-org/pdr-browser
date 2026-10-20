import { createEffect, createSignal, on } from "solid-js";
import { packageKind, primaryCommand, usageSnippet, type DetailMode } from "../catalog/commands.ts";
import { platforms, type PackageSnapshot } from "../catalog/types.ts";
import {
  availableVersions,
  defaultVersion,
  packagePlatform,
  preferredVersion,
} from "../catalog/versions.ts";
import { useBrowserState } from "./browser-state.ts";

export type PackageView = ReturnType<typeof createPackageView>;

export function createPackageView({ pkg, targets_version, expires }: PackageSnapshot) {
  const { platform: requestedPlatform, version } = useBrowserState();
  const system = () => packagePlatform(pkg, requestedPlatform(), version());
  const [mode, setMode] = createSignal<DetailMode>(
    pkg.name === "rootbeer" && !version() ? "bootstrap" : "use",
  );
  const [selectedRunTarget, setSelectedRunTarget] = createSignal("");

  const versions = () => availableVersions(pkg, system());
  const selectedVersion = () =>
    versions().includes(version()) ? version() : preferredVersion(pkg, system());
  const entry = () => pkg.versions[selectedVersion()];
  const systems = () => platforms.map(({ id }) => id).filter((id) => Object.hasOwn(entry(), id));
  const output = () => entry()[system()];
  const bins = () => output().bins;
  const apps = () => Object.keys(output().apps);
  const runTargets = () => [
    ...apps().map((name) => ({ value: `app:${name}`, name, kind: "App" })),
    ...bins().map((name) => ({ value: `bin:${name}`, name, kind: "Command" })),
  ];
  const defaultRunTarget = () =>
    apps().length
      ? `app:${apps()[0]}`
      : `bin:${primaryCommand(pkg.name, output()) || bins()[0] || ""}`;
  const runTarget = () =>
    runTargets().some(({ value }) => value === selectedRunTarget())
      ? selectedRunTarget()
      : defaultRunTarget();
  const app = () => (runTarget().startsWith("app:") ? runTarget().slice(4) : "");
  const bin = () => (runTarget().startsWith("bin:") ? runTarget().slice(4) : "");
  const kind = () => packageKind(output());
  const isLibrary = () => kind() === "library";
  const isApp = () => kind() === "app";
  const isDefaultAvailable = () => versions().includes(defaultVersion(pkg, system()));
  const isInvalidVersion = () => Boolean(version()) && !versions().includes(version());
  const isPinned = () => Boolean(version()) || !isDefaultAvailable();

  createEffect(on(version, () => mode() === "bootstrap" && setMode("use"), { defer: true }));
  createEffect(
    on(
      () => `${selectedVersion()}:${system()}`,
      () => {
        setSelectedRunTarget("");
        if (mode() === "run" && !runTargets().length) setMode("use");
      },
      { defer: true },
    ),
  );

  return {
    pkg,
    targets_version,
    expires,
    versions,
    selectedVersion,
    entry,
    systems,
    system,
    output,
    bins,
    apps,
    runTargets,
    runTarget,
    selectRunTarget: setSelectedRunTarget,
    kind,
    isLibrary,
    isApp,
    isDefaultAvailable,
    isInvalidVersion,
    isPinned,
    mode,
    setMode,
    app,
    bin,
    snippet: () =>
      usageSnippet(pkg.name, output(), {
        mode: mode(),
        version: selectedVersion(),
        isPinned: isPinned(),
        bin: bin(),
        app: app(),
      }),
  };
}
