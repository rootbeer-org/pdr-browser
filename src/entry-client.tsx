import { mount, StartClient } from "@solidjs/start/client";

const url = new URL(window.location.href);
const legacyName = url.pathname === "/" && url.searchParams.get("show");
if (legacyName) {
  const target = new URL(`/packages/${encodeURIComponent(legacyName)}/`, url);
  for (const key of ["version", "platform"]) {
    const value = url.searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  window.location.replace(target.href);
} else mount(() => <StartClient />, document.getElementById("app")!);
