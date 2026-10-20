# PDR Browser

The package browser for [Rootbeer](https://rbpkg.com). Search packages, compare
versions and platforms, and copy install commands.

**[Browse packages → search.rbpkg.com](https://search.rbpkg.com)**

Built with SolidStart and deployed to GitHub Pages. At build time,
`rb drv catalog` verifies the signed package index and exports the data used to
generate the site. Everything runs from static files, including search.

## Run locally

Install Node.js and pnpm at the versions in `package.json`, plus a recent `rb`
with `drv catalog` support.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Set `RB=/path/to/rb` to use a different binary. The first run fetches the catalog;
subsequent runs use the cached copy. To refresh it:

```sh
PDR_REFRESH=1 pnpm dev
```

## Build and check

```sh
pnpm run format:check
pnpm run lint
node --test tests/*.test.ts
pnpm run build
pnpm run preview
```

Builds verify the current index and write the site to `.output/public/`. The
index triggers a deployment after each signing.

## JSON

The same data is available at [`/catalog.json`](https://search.rbpkg.com/catalog.json)
and `/packages/<name>/data.json`. Each package page links to its JSON.
