import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import {
  platforms,
  type CatalogManifest,
  type CatalogSnapshot,
  type IndexEntry,
  type IndexOutput,
  type PackageSnapshot,
} from "../src/catalog/types.ts";

const execute = promisify(execFile);
const NAME_PATTERN = /^[a-z0-9][a-z0-9+._-]*$/;

export async function prepareCatalog(refresh = true): Promise<CatalogManifest> {
  const cached = await readCatalogManifest().catch((error) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (!refresh && cached?.format === 1) {
    await publishJson(cached);
    return cached;
  }

  console.log("Checking signed package index…");
  let json: string;
  try {
    const { stdout } = await execute(process.env.RB ?? "rb", ["drv", "catalog"], {
      maxBuffer: 64 * 1024 * 1024,
    });
    json = stdout;
  } catch (cause) {
    const error = cause as Error & { stderr?: string };
    throw new Error(
      `Could not export the signed index. Install rb with drv catalog support or set RB to its binary path.\n${error.stderr || error.message}`,
      { cause },
    );
  }

  const catalog = parseCatalog(JSON.parse(json));
  const snapshot = createHash("sha256").update(json).digest("hex");
  const dataPath = `/_catalog/${snapshot}`;
  const manifest: CatalogManifest = {
    format: 1,
    dataPath,
    names: catalog.packages.map((pkg) => pkg.name),
  };
  if (cached?.format === 1 && cached.dataPath === dataPath) {
    await publishJson(manifest);
    console.log("Index unchanged; using local snapshot.");
    return manifest;
  }

  const directory = `public${dataPath}`;
  await mkdir(directory, { recursive: true });
  const metadata = { targets_version: catalog.targets_version, expires: catalog.expires };
  const index: CatalogSnapshot = {
    ...metadata,
    packages: catalog.packages.map(({ versions, ...pkg }) => ({
      ...pkg,
      outputs: Object.fromEntries(
        Object.entries(pkg.default).map(([system, version]) => [system, versions[version][system]]),
      ),
    })),
  };
  for (const pkg of catalog.packages) {
    const data: PackageSnapshot = { ...metadata, pkg };
    await writeFile(`${directory}/${pkg.name}.json`, JSON.stringify(data));
  }
  await writeFile(`${directory}/index.json`, JSON.stringify(index));
  await publishJson(manifest);
  await writeFile("public/_catalog/manifest.json.tmp", JSON.stringify(manifest));
  await rename("public/_catalog/manifest.json.tmp", "public/_catalog/manifest.json");
  for (const entry of await readdir("public/_catalog", { withFileTypes: true })) {
    if (entry.isDirectory() && /^[0-9a-f]{64}$/.test(entry.name) && entry.name !== snapshot) {
      await rm(`public/_catalog/${entry.name}`, { recursive: true });
    }
  }
  console.log(`Verified ${catalog.packages.length} packages for static generation.`);
  return manifest;
}

async function publishJson(manifest: CatalogManifest): Promise<void> {
  const directory = `public${manifest.dataPath}`;
  await mkdir("public/packages", { recursive: true });
  for (const name of manifest.names) {
    await mkdir(`public/packages/${name}`, { recursive: true });
    await copyFile(`${directory}/${name}.json`, `public/packages/${name}/data.json`);
  }
  await copyFile(`${directory}/index.json`, "public/catalog.json");

  const names = new Set(manifest.names);
  for (const entry of await readdir("public/packages", { withFileTypes: true })) {
    if (entry.isDirectory() && NAME_PATTERN.test(entry.name) && !names.has(entry.name)) {
      await rm(`public/packages/${entry.name}/data.json`, { force: true });
    }
  }
}

export async function readCatalogManifest(): Promise<CatalogManifest> {
  return JSON.parse(await readFile("public/_catalog/manifest.json", "utf8"));
}

export function parseCatalog(value: unknown) {
  const catalog = object(value, "catalog");
  const entries = object(catalog.packages, "catalog packages");
  if (
    !Number.isSafeInteger(catalog.targets_version) ||
    Number(catalog.targets_version) < 1 ||
    typeof catalog.expires !== "string" ||
    !Number.isFinite(Date.parse(catalog.expires))
  ) {
    throw new Error("The catalog has invalid index metadata.");
  }

  const aliases = object(catalog.aliases ?? {}, "catalog aliases");
  const packages = Object.entries(entries).map(([name, value]): IndexEntry => {
    const entry = object(value, name);
    if (!NAME_PATTERN.test(name) || entry.name !== name) {
      throw new Error(`The catalog entry name does not match ${name}.`);
    }

    const versions = Object.fromEntries(
      Object.entries(object(entry.versions, `${name} versions`)).map(([version, value]) => [
        version,
        Object.fromEntries(
          Object.entries(object(value, `${name}@${version}`))
            .filter(([system]) => platforms.some(({ id }) => id === system))
            .map(([system, output]) => [
              system,
              parseOutput(output, `${name}@${version} ${system}`),
            ]),
        ),
      ]),
    );
    const defaults = Object.fromEntries(
      Object.entries(object(entry.default, `${name} defaults`))
        .filter(([system]) => platforms.some(({ id }) => id === system))
        .map(([system, version]) => {
          if (typeof version !== "string" || !Object.hasOwn(versions[version] ?? {}, system)) {
            throw new Error(`The default for ${name} on ${system} has no output.`);
          }
          return [system, version];
        }),
    );
    const listedAliases = Object.entries(aliases)
      .filter(([alias, target]) => NAME_PATTERN.test(alias) && target === name)
      .map(([alias]) => alias);
    return {
      name,
      description: text(entry.description, `${name} description`),
      homepage: homepage(entry.homepage, name),
      license: text(entry.license, `${name} license`),
      aliases: [...new Set([...strings(entry.aliases, `${name} aliases`), ...listedAliases])],
      maintainers: strings(entry.maintainers, `${name} maintainers`),
      added: date(entry.added, `${name} added`),
      updated: date(entry.updated, `${name} updated`),
      default: defaults,
      versions,
    };
  });
  packages.sort((a, b) => a.name.localeCompare(b.name));
  return {
    targets_version: catalog.targets_version as number,
    expires: catalog.expires,
    packages,
  };
}

function parseOutput(value: unknown, label: string): IndexOutput {
  const output = object(value, label);
  if (
    typeof output.key !== "string" ||
    !/^[a-z2-7]{32}$/.test(output.key) ||
    typeof output.manifest !== "string" ||
    !/^sha256:[0-9a-f]{64}$/.test(output.manifest)
  ) {
    throw new Error(`Invalid output identity for ${label}.`);
  }
  const apps = Object.fromEntries(
    Object.entries(object(output.apps ?? {}, `${label} apps`)).map(([name, path]) => [
      name,
      text(path, `${label} app path`),
    ]),
  );
  return {
    key: output.key,
    manifest: output.manifest,
    bins: strings(output.bins, `${label} commands`),
    apps,
  };
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`Invalid ${label}: expected an object.`);
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, label: string): string {
  if (value === undefined) return "";
  if (typeof value !== "string") throw new Error(`Invalid ${label}: expected a string.`);
  return value;
}

function strings(value: unknown, label: string): string[] {
  if (value === undefined) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error(`Invalid ${label}: expected strings.`);
  }
  return value;
}

function date(value: unknown, label: string): number | undefined {
  if (value === undefined) return undefined;
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    !Number.isFinite(new Date(value * 1000).getTime())
  ) {
    throw new Error(`Invalid ${label}: expected Unix seconds.`);
  }
  return value;
}

function homepage(value: unknown, name: string): string {
  const url = text(value, `${name} homepage`);
  if (!url) return "";
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error(`Invalid homepage for ${name}: expected a web address.`);
  }
  return url;
}
