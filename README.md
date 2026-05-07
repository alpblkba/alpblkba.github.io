# alpblkba.github.io

Personal website of alpblkba

Built with Astro and deployed with GitHub Pages.

## local development

```bash
npm install
npm run dev
```

## build

```bash
npm run build
npm run preview
```

## structure

```text
src/pages       site pages
src/layouts     shared layouts
src/styles      global styling
public          static assets
```

## deployment

The site is deployed automatically through GitHub Actions when changes are pushed to the `main` branch.

```text
source: main
build:  Astro
host:   GitHub Pages
```
