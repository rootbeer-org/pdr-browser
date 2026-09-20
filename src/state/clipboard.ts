import { createSignal } from "solid-js";

export function createClipboard() {
  const [copied, setCopied] = createSignal(false);
  const [failed, setFailed] = createSignal(false);

  async function copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }

  function reset(): void {
    setCopied(false);
    setFailed(false);
  }

  return { copied, failed, copy, reset };
}
