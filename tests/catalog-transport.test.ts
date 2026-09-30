import assert from "node:assert/strict";
import { test } from "node:test";
import { bytes } from "../src/catalog/transport.ts";

const url = "https://catalog.example/records/digest.json";

test("retries transient responses before returning bytes", async (context) => {
  let attempts = 0;
  context.mock.method(globalThis, "fetch", async () => {
    attempts++;
    return attempts < 3
      ? new Response("busy", { status: 503, headers: { "retry-after": "0" } })
      : new Response("verified separately");
  });
  assert.equal(new TextDecoder().decode(await bytes(url, 100)), "verified separately");
  assert.equal(attempts, 3);
});

test("retries network failures", async (context) => {
  let attempts = 0;
  context.mock.method(globalThis, "fetch", async () => {
    if (++attempts === 1) throw new TypeError("fetch failed");
    return new Response("ok");
  });
  assert.equal(new TextDecoder().decode(await bytes(url, 100)), "ok");
  assert.equal(attempts, 2);
});

test("stops after three rate-limit responses and reports status and URL", async (context) => {
  const fetch = context.mock.method(
    globalThis,
    "fetch",
    async () =>
      new Response("busy", {
        status: 429,
        headers: { "retry-after": "0" },
      }),
  );
  await assert.rejects(bytes(url, 100), /HTTP 429.*catalog\.example\/records\/digest\.json/);
  assert.equal(fetch.mock.callCount(), 3);
});

test("does not retry permanent HTTP errors or expose URL credentials", async (context) => {
  const fetch = context.mock.method(
    globalThis,
    "fetch",
    async () => new Response("missing", { status: 404 }),
  );
  await assert.rejects(
    bytes("https://user:secret@catalog.example/records/missing.json?token=secret", 100),
    (error: Error) => {
      assert.match(error.message, /HTTP 404/);
      assert.match(error.message, /records\/missing.json/);
      assert.ok(!error.message.includes("secret"));
      return true;
    },
  );
  assert.equal(fetch.mock.callCount(), 1);
});

test("oversized responses still fail without retries", async (context) => {
  const fetch = context.mock.method(globalThis, "fetch", async () => new Response("too large"));
  await assert.rejects(bytes(url, 3), /too large/);
  assert.equal(fetch.mock.callCount(), 1);
});
