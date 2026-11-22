# PDR Browser

Package search for [Rootbeer](https://rbpkg.com), live at
[search.rbpkg.com](https://search.rbpkg.com).

A static Astro site on GitHub Pages. Builds run `rb drv catalog` to verify the
signed package index, then generate a page per package. Search and filtering run
in the browser. Each index signing triggers a deploy.

## Development

Needs the Node.js and pnpm versions in `package.json`, and an `rb` with
`drv catalog`.

```sh
pnpm install
pnpm dev
pnpm dev --force # Force a fresh catalog.json fetch
```

## Checks

```sh
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## JSON

[`/catalog.json`](https://search.rbpkg.com/catalog.json) is the `rb drv catalog`
export as verified at build time. Each package is at
`/packages/<name>/data.json`.
