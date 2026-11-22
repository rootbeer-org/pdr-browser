import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { IndexEntry, IndexMetadata, IndexOutput, PackageSummary } from "./types.ts";

const execute = promisify(execFile);

type ExportOutput = Omit<IndexOutput, "bins" | "apps" | "runtime_dependencies" | "host"> &
  Partial<IndexOutput>;

interface CatalogExport extends IndexMetadata {
  packages: Record<
    string,
    Omit<IndexEntry, "name" | "versions"> & {
      versions: Record<string, Record<string, ExportOutput>>;
    }
  >;
}

export interface Catalog extends IndexMetadata {
  json: string;
  packages: IndexEntry[];
}

export function parseCatalog(json: string): Catalog {
  const raw: CatalogExport = JSON.parse(json);
  const packages = Object.entries(raw.packages).map(([name, entry]) => ({
    ...entry,
    name,
    versions: Object.fromEntries(
      Object.entries(entry.versions).map(([version, outputs]) => [
        version,
        Object.fromEntries(
          Object.entries(outputs).map(([system, output]) => [
            system,
            {
              ...output,
              bins: output.bins ?? [],
              apps: output.apps ?? {},
              runtime_dependencies: output.runtime_dependencies ?? [],
              host: output.host ?? [],
            },
          ]),
        ),
      ]),
    ),
  }));
  return { json, targets_version: raw.targets_version, expires: raw.expires, packages };
}

export function summarize(packages: IndexEntry[]): PackageSummary[] {
  return packages.map((pkg) => ({
    name: pkg.name,
    description: pkg.description,
    homepage: pkg.homepage,
    aliases: pkg.aliases,
    added: pkg.added,
    updated: pkg.updated,
    default: pkg.default,
    outputs: Object.fromEntries(
      Object.entries(pkg.default).map(([system, version]) => {
        const { bins, apps } = pkg.versions[version][system];
        return [system, { bins, apps: Object.keys(apps) }];
      }),
    ),
  }));
}

export async function exportCatalog(): Promise<string> {
  try {
    const { stdout } = await execute(process.env.RB ?? "rb", ["drv", "catalog"], {
      maxBuffer: 64 * 1024 * 1024,
    });
    return stdout;
  } catch (cause) {
    const error = cause as Error & { stderr?: string };
    throw new Error(
      `Could not export the signed index. Install rb with drv catalog support or set RB to its binary path.\n${error.stderr || error.message}`,
      { cause },
    );
  }
}
