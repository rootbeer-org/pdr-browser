import { revalidate } from "@solidjs/router";
import { HttpStatusCode } from "@solidjs/start";

export default function LoadError(props: { error: unknown; retry: () => void }) {
  return (
    <div role="alert" class="border border-edge p-4">
      <HttpStatusCode code={503} />
      <h2 class="heading">Could not load packages</h2>
      <p class="opacity-80">
        {props.error instanceof Error
          ? props.error.message
          : "The package repository is unavailable."}
      </p>
      <button
        type="button"
        class="link mt-3"
        onClick={() => {
          void revalidate();
          props.retry();
        }}
      >
        Try again
      </button>
    </div>
  );
}
