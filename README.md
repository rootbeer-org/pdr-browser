# PDR Browser

Search and explore the [Rootbeer package repository](https://search.rbpkg.com).
Built with SolidStart, Solid Router, and Nitro. Search results and package details
are rendered on the server, then hydrated for interactive filtering and commands.

## Development

Use the Node.js and pnpm versions in `package.json`:

```sh
pnpm install
pnpm dev
```

Development runs on Vite and Node. No Cloudflare account, Wrangler process, or
Worker bindings are needed. The checked-in `.env` contains the public repository
URL and signing key; change these to browse another PDR.

```sh
pnpm test
pnpm lint
pnpm format:check
pnpm build
pnpm preview
```

`pnpm build` produces a standalone Node server in `.output/`. Run it with
`pnpm start`; `PORT` controls the listening port.

## Routes and data

- `/`: search using `q`, `platform`, `sort`, and `page`. The server returns at most
  25 package rows per request, plus counts.
- `/packages/<name>`: package details, with optional `version` and `platform`.
- Existing `?show=<name>` links redirect to the package route.
- Missing packages and unavailable versions return HTTP 404. Repository failures
  return HTTP 503.

The server verifies the signed catalog and package document digests before using
or caching them. Provenance records are fetched and verified on the server automatically, with
the full signature displayed at the bottom of each package page. Request-specific search and selection state stays in the router, not
in module-level signals.

## Caching

Caches use ordinary JavaScript memory and work on Node or Workers:

- Current catalog: 60 seconds.
- Verified package documents and records: 24 hours, keyed by digest and source.
- Successful public HTML: 60 seconds, keyed by canonical URL and build ID.

Data and HTML caches have separate 16 MiB and 8 MiB string-storage budgets with
least-recently-used eviction. Entries are local to a process or Worker isolate;
restarts and cold instances start empty. This is not a shared or durable cache.
HTML responses advertise `s-maxage=60` for a suitably configured CDN. A CDN must
be configured to cache HTML to avoid reaching the server on those requests.

Errors, server-function responses, cookie-bearing requests, and authenticated
requests are not HTML-cached. HTML caching is disabled during development.
Version URLs have short cache lifetimes because a package revision may change
without changing its version.

## Cloudflare deployment

Cloudflare is an optional production build target:

```sh
pnpm build:cloudflare
pnpm deploy
```

Nitro emits the Worker and its deployment configuration in `.output/`. Wrangler
is used only to publish that build. The app uses no Worker-specific APIs, KV,
D1, or other service bindings.

The deployment workflow expects `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` in the GitHub `production` environment. Set up the
`search.rbpkg.com` custom domain on the Worker when switching traffic from GitHub
Pages. Building locally does not deploy or change DNS.
