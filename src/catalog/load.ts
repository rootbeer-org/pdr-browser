import { bytes } from "./transport.ts";
import { validateRoot } from "./validate.ts";
import { verifyRoot } from "./verify.ts";
import type { CatalogSource, Root } from "./types.ts";

const ROOT_LIMIT = 4 * 1024 * 1024;

export async function loadRoot(source: CatalogSource): Promise<Root> {
  const root = JSON.parse(new TextDecoder().decode(await bytes(source.url, ROOT_LIMIT)));
  await verifyRoot(root, source.publicKey);

  return {
    packages: validateRoot(root)
      .filter((pkg) => Object.keys(pkg.platforms).length)
      .sort((a, b) => a.name.localeCompare(b.name)),
    sequence: root.sequence,
  };
}
