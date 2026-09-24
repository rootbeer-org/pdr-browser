import { createResource } from "solid-js";
import { loadDocument } from "../catalog/document.ts";
import type { PackageDocument, RootPackage } from "../catalog/types.ts";
import { catalogSource } from "../config.ts";

// Documents are content-addressed, so a digest's bytes never change.
const cache = new Map<string, Promise<PackageDocument>>();

export function createDocument(pkg: RootPackage) {
  return createResource(
    () => pkg.document,
    (digest) => {
      const pending = cache.get(digest) ?? loadDocument(catalogSource, pkg);
      cache.set(digest, pending);
      pending.catch(() => cache.delete(digest));
      return pending;
    },
  );
}
