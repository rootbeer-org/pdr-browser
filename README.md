# PDR Browser

[search.rbpkg.com](https://search.rbpkg.com) — Rootbeer package search.
SolidStart, prerendered to static files and hosted on GitHub Pages.

## Development

Use the Node.js and pnpm versions in `package.json`.

```sh
pnpm install
pnpm dev
```

The first start fetches and verifies the catalog configured in `.env`. Run
`PDR_REFRESH=1 pnpm dev` to check for updates. Builds always check for catalog
changes and reuse the snapshot when unchanged.

```sh
pnpm format:check
pnpm lint
pnpm build
pnpm preview
```

`pnpm build` verifies package signatures and generates `.output/public/`.
Search and version/platform selection run in the browser using static JSON.
