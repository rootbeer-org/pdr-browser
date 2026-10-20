import assert from "node:assert/strict";
import { test } from "node:test";
import { usageModes, usageSnippet, type SnippetRequest } from "../src/catalog/commands.ts";
import { output } from "./catalog-fixture.ts";

const request: SnippetRequest = {
  mode: "run",
  version: "1.2.3",
  isPinned: false,
  bin: "tool",
  app: "",
};

test("a sole command does not need --bin, while multiple commands use an explicit choice", () => {
  assert.equal(usageSnippet("example", output, request), "rb run example");
  const multiple = { ...output, bins: ["example", "tool"] };
  assert.equal(usageSnippet("example", multiple, request), "rb run example --bin tool");
  assert.equal(usageSnippet("example", multiple, { ...request, bin: "example" }), "rb run example");
});

test("apps can run with --app, including pinned versions and names with spaces", () => {
  const app = { ...output, bins: [], apps: { "Example App.app": "Example App.app" } };
  assert.ok(usageModes("example", app).some(([mode]) => mode === "run"));
  assert.equal(
    usageSnippet("example", app, { ...request, isPinned: true, app: "Example App.app" }),
    "rb run example@1.2.3 --app 'Example App.app'",
  );
});

test("libraries offer install and config without a run or recipe mode", () => {
  const library = { ...output, bins: [] };
  assert.deepEqual(
    usageModes("example", library).map(([mode]) => mode),
    ["use", "config"],
  );
  assert.equal(usageSnippet("example", library, { ...request, mode: "use" }), "rb use example");
  assert.equal(
    usageSnippet("example", library, { ...request, mode: "config", isPinned: true }),
    'rb.package("example@1.2.3")',
  );
});

test("bootstrap uses the current user profile path", () => {
  assert.equal(
    usageSnippet("rootbeer", output, { ...request, mode: "bootstrap" }),
    'sh -c "$(curl -fsSL https://rbpkg.com/rb.sh)"\neval "$("/opt/rb/profiles/$(id -u)/user/bin/rb" env)"',
  );
});
