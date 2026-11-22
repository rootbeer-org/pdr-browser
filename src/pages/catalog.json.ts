import type { APIRoute } from "astro";
import { getEntry } from "astro:content";

export const GET: APIRoute = async () =>
  new Response((await getEntry("catalog", "current"))!.data.json, {
    headers: { "Content-Type": "application/json" },
  });
