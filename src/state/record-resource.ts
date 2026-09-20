import { createResource } from "solid-js";
import { loadRecord } from "../catalog/record.ts";
import { catalogSource } from "../config.ts";
import { catalog } from "./catalog-resource.ts";

export interface RecordTarget {
  name: string;
  version: string;
  system: string;
}

export function createRecord(target: () => RecordTarget | undefined) {
  return createResource(target, async (requested: RecordTarget) => {
    const pin = catalog()?.records[`${requested.name}@${requested.version}`]?.[requested.system];
    if (!pin) throw new Error("No record is published for this platform.");

    return loadRecord(pin, catalogSource.publicKey, requested);
  });
}
