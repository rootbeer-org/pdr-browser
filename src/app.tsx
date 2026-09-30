import { Meta, MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Suspense } from "solid-js";
import Layout from "./ui/Layout.tsx";
import LoadError from "./ui/LoadError.tsx";
import "./styles.css";

export default function App() {
  return (
    <Router
      root={(props) => (
        <MetaProvider>
          <Title>Rootbeer Packages</Title>
          <Meta name="description" content="Search and explore Rootbeer packages" />
          <Layout>
            <ErrorBoundary fallback={(error, reset) => <LoadError error={error} retry={reset} />}>
              <Suspense
                fallback={
                  <p role="status" class="opacity-50">
                    Loading packages…
                  </p>
                }
              >
                {props.children}
              </Suspense>
            </ErrorBoundary>
          </Layout>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
