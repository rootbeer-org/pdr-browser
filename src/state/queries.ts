import { query } from "@solidjs/router";
import { getRoot, getPackage, getRecord } from "../server/catalog.ts";
import { readSearch, searchPage } from "../catalog/search-options.ts";

export const findPackages = query(async (search: string) => {
  "use server";
  const root = await getRoot();
  return searchPage(root.packages, readSearch(new URLSearchParams(search)));
}, "packages");

export const findPackage = query(async (name: string) => {
  "use server";
  return getPackage(name);
}, "package");

export const findRecord = query(async (name: string, version: string, system: string) => {
  "use server";
  return getRecord(name, version, system);
}, "record");
