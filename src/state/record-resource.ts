import { createResource } from "solid-js";
import { loadRecord } from "../catalog/record.ts";
import { catalogSource } from "../config.ts";

export interface RecordTarget {
  name: string;
  version: string;
  system: string;
  digest: string;
}

export function createRecord(target: () => RecordTarget | undefined) {
  return createResource(target, (requested: RecordTarget) =>
    loadRecord(catalogSource, requested.digest, requested),
  );
}
