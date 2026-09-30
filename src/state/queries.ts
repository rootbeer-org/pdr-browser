import { query } from "@solidjs/router";
import { readSearch, searchPage } from "../catalog/search-options.ts";
import type { PackageData, Root } from "../catalog/types.ts";

async function readData<T>(file: string): Promise<T> {
  const path = `${import.meta.env.PDR_DATA_PATH}/${file}.json`;
  if (import.meta.env.SSR) {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(`public${path}`, "utf8"));
  }

  const response = await fetch(path);
  if (!response.ok) throw new Error("Package data is unavailable. Reload the page to try again.");
  return response.json();
}

const findBrowserRoot = query(() => readData<Root>("index"), "catalog");
const findRoot = () => (import.meta.env.SSR ? readData<Root>("index") : findBrowserRoot());

export const findPackages = query(async (search: string) => {
  const root = await findRoot();
  return searchPage(root.packages, readSearch(new URLSearchParams(search)));
}, "packages");

export const findPackage = query(async (name: string) => {
  const root = await findRoot();
  const pkg = root.packages.find((entry) => entry.name === name);
  if (!pkg) return null;
  return readData<PackageData>(pkg.document);
}, "package");
