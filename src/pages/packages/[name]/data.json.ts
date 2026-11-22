import type { APIRoute, GetStaticPaths } from "astro";
import { getCollection, getEntry } from "astro:content";
import type { IndexEntry, PackageSnapshot } from "#/catalog/types.ts";

export const getStaticPaths = (async () => {
  const packages = await getCollection("packages");
  return packages.map(({ id, data }) => ({ params: { name: id }, props: { pkg: data } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<{ pkg: IndexEntry }> = async ({ props }) => {
  const { targets_version, expires } = (await getEntry("catalog", "current"))!.data;
  const snapshot: PackageSnapshot = { targets_version, expires, pkg: props.pkg };
  return Response.json(snapshot);
};
