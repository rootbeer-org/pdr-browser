import { createResource } from "solid-js";
import { findRecord } from "./queries.ts";

export interface RecordTarget {
  name: string;
  version: string;
  system: string;
  digest: string;
}

export function createRecord(target: () => RecordTarget | undefined) {
  return createResource(target, (requested: RecordTarget) =>
    findRecord(requested.name, requested.version, requested.system),
  );
}
