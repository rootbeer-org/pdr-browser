import { createSignal } from "solid-js";

export function createClipboard() {
  const [copied, setCopied] = createSignal<string>();
  const [failed, setFailed] = createSignal<string>();

  async function copy(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setFailed(undefined);
    } catch {
      setFailed(text);
    }
  }

  return {
    copy,
    isCopied: (text: string) => copied() === text,
    isFailed: (text: string) => failed() === text,
  };
}
