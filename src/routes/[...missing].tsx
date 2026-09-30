import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <>
      <Title>Page not found · Rootbeer Packages</Title>
      <HttpStatusCode code={404} />
      <h2 class="heading">Page not found</h2>
      <a class="link" href="/">
        Search packages
      </a>
    </>
  );
}
