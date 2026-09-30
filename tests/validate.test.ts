import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validateDocument, validateRoot } from "../src/catalog/validate.ts";

const published = JSON.parse(
  readFileSync(new URL("./fixtures/openssl.json", import.meta.url), "utf8"),
);
const pkg = validateRoot(published.root)[0]!;

test("published OpenSSL 4.0.2 retains Linux and macOS platforms with shared libraries", () => {
  const document = validateDocument(published.document, pkg);
  assert.deepEqual(Object.keys(document.versions), ["4.0.2"]);
  assert.deepEqual(Object.keys(document.versions["4.0.2"]!.platforms), [
    "aarch64-linux",
    "aarch64-macos",
    "x86_64-linux",
  ]);
});

test("library validation accepts static, shared, and versioned library exports", () => {
  for (const path of [
    "lib/libssl.a",
    "lib/libssl.so",
    "lib64/libssl.so.4",
    "lib/libssl.so.4.0.2",
    "lib/libssl.dylib",
    "lib/libssl.4.dylib",
  ]) {
    const document = structuredClone(published.document);
    document.versions["4.0.2"].platforms["aarch64-linux"].recipe.build.libraries = [path];
    assert.ok(validateDocument(document, pkg).versions["4.0.2"]!.platforms["aarch64-linux"], path);
  }
});

test("shared library support still rejects unsafe paths and non-library files", () => {
  for (const path of [
    "/lib/libssl.so",
    "lib/../libssl.so",
    "lib//libssl.so",
    "lib/./libssl.so",
    "lib/libssl\\.so",
    "lib/libssl\0.so",
    "bin/libssl.so",
    "lib/libssl.so.bad",
    "lib/README",
  ]) {
    const document = structuredClone(published.document);
    document.versions["4.0.2"].platforms["aarch64-linux"].recipe.build.libraries = [path];
    assert.equal(
      validateDocument(document, pkg).versions["4.0.2"]!.platforms["aarch64-linux"],
      undefined,
      path,
    );
    assert.ok(validateDocument(document, pkg).versions["4.0.2"]!.platforms["aarch64-macos"]);
  }
});
