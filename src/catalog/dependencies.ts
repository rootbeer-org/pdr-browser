import { packageDependencies } from "./commands.ts";
import type { CatalogRecipe, PackageData } from "./types.ts";
import { defaultVersion } from "./versions.ts";

export interface DependencyNode {
  name: string;
  version: string;
  isDirect: boolean;
  requiredBy: { name: string; version: string; kind: string }[];
  error: string;
}

export async function loadDependencyGraph(
  root: { name: string; version: string; recipe: CatalogRecipe },
  system: string,
  loadPackage: (name: string) => Promise<PackageData | null>,
): Promise<DependencyNode[]> {
  const rootKey = `${root.name}@${root.version}`;
  const nodes = new Map<string, DependencyNode>();
  const packages = new Map<string, Promise<PackageData | null>>();
  let pending = packageDependencies(root.recipe).map((dependency) => ({
    dependency,
    parent: root,
  }));

  while (pending.length) {
    const batch = pending;
    pending = [];
    const results = await Promise.all(
      batch.map(async ({ dependency, parent }) => {
        try {
          if (!packages.has(dependency.name))
            packages.set(dependency.name, loadPackage(dependency.name));
          const data = await packages.get(dependency.name);
          const version = dependency.version || (data ? defaultVersion(data.pkg, system) : "");
          const recipe = data?.document.versions[version]?.platforms[system]?.recipe;
          const error = !data
            ? "Package unavailable"
            : !recipe
              ? "Version unavailable on this platform"
              : "";
          return { dependency, parent, version, recipe, error };
        } catch {
          return {
            dependency,
            parent,
            version: dependency.version,
            recipe: undefined,
            error: "Could not load dependencies",
          };
        }
      }),
    );

    for (const { dependency, parent, version, recipe, error } of results) {
      const key = `${dependency.name}@${version}`;
      if (key === rootKey) continue;

      const isDirect = `${parent.name}@${parent.version}` === rootKey;
      const requiredBy = { name: parent.name, version: parent.version, kind: dependency.kind };
      const existing = nodes.get(key);
      if (existing) {
        existing.isDirect ||= isDirect;
        if (
          !existing.requiredBy.some(
            (entry) =>
              entry.name === parent.name &&
              entry.version === parent.version &&
              entry.kind === dependency.kind,
          )
        ) {
          existing.requiredBy.push(requiredBy);
        }
        continue;
      }

      nodes.set(key, { name: dependency.name, version, isDirect, requiredBy: [requiredBy], error });
      if (!recipe) continue;

      pending.push(
        ...packageDependencies(recipe).map((child) => ({
          dependency: child,
          parent: { name: dependency.name, version, recipe },
        })),
      );
    }
  }

  return [...nodes.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version),
  );
}

export function dependencyTreeRows(rootKey: string, nodes: DependencyNode[]) {
  const children = new Map<string, { node: DependencyNode; kind: string }[]>();
  for (const node of nodes) {
    for (const parent of node.requiredBy) {
      const key = `${parent.name}@${parent.version}`;
      const entries = children.get(key) ?? [];
      entries.push({ node, kind: parent.kind });
      children.set(key, entries);
    }
  }

  const rows: {
    node: DependencyNode;
    key: string;
    parent: string;
    kind: string;
    prefix: string;
    isShared: boolean;
  }[] = [];
  const seen = new Set([rootKey]);

  function visit(parent: string, prefix: string) {
    const entries = children.get(parent) ?? [];
    entries.forEach(({ node, kind }, index) => {
      const key = `${node.name}@${node.version}`;
      const isLast = index === entries.length - 1;
      const isShared = seen.has(key);
      rows.push({
        node,
        key,
        parent,
        kind,
        prefix: `${prefix}${isLast ? "└─ " : "├─ "}`,
        isShared,
      });
      if (isShared) return;

      seen.add(key);
      visit(key, `${prefix}${isLast ? "   " : "│  "}`);
    });
  }

  visit(rootKey, "");
  return rows;
}
