import type { APIRoute } from "astro";
import { getCollection, getEntry } from "astro:content";
import { summarize } from "#/catalog/source.ts";

export const GET: APIRoute = async () => {
  const { targets_version, expires } = (await getEntry("catalog", "current"))!.data;
  const packages = (await getCollection("packages")).map(({ data }) => data);
  return Response.json({ targets_version, expires, packages: summarize(packages) });
};
