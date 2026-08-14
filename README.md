# v0.3 — alpblkba.dev on the Cyber-Velvet design system

Drop-in replacement sources for `alpblkba.github.io`, rebuilt on the
**alpblkba.dev — Cyber-Velvet & Buckeye Burl** design system. All content is
the author's own; the design system supplies only the visual language.

## What is here

    src/styles/ds/                design-system tokens (copied, do not edit)
    src/styles/site.css           the site layer: component classes + note prose
    src/data/site.js              all page copy in one module
    src/components/               15 Astro ports of the design-system components
    src/layouts/BaseLayout.astro  burl plate, glass status bar, panel grid, ctrl+k
    src/pages/{index,about,projects,notes,music,cv}.astro
    src/pages/notes/*.astro       the four notes, recovered from d38c3af
    public/images/portrait.png
    public/assets/notes/**        38 note figures, recovered from d38c3af
    public/favicon.svg              the brand chip
    public/favicon-180.png

## How to integrate

    git checkout -b v0.3
    # copy src/ and public/ from this folder over the repo root, then:
    npm install
    npm run dev

Nothing outside `src/` and `public/` needs to change —
`.github/workflows/deploy.yml`, `tsconfig.json` and `.gitignore` are
untouched. `astro.config.mjs` sets `site` to `https://alpblkba.dev`
(the custom domain); revert to the `github.io` URL if you are not using it.

## The notes

The four `src/pages/notes/*.astro` articles were deleted during the template
experiments and are restored here from commit `d38c3af` — the last commit
before the redesign. **Prose, code blocks, figures and captions are verbatim.**
Two of them carried page-scoped `<style>` blocks written for the old light
theme; those blocks are gone and their class names
(`.note`, `.note-page`, `.lead`, `.essay-toc`, `.concept-grid`,
`.command-table`, `.summary`, `.figure-grid`, …) are styled in
`src/styles/site.css` instead. No sentence was changed.

Long-form pages (the notes and the CV) set `data-gloss="lifted"` on
`<html>` and dim the burl plate to 0.4 — the design system requires both for
documents that are read end to end.

## Design-system notes

- `src/styles/ds/` is a verbatim copy of the design system's token sheet.
  Treat it as vendored: restyle in `site.css`, never in `ds/`.
- The React component library was **not** shipped into the site — Astro
  renders static HTML, so each component was ported to an `.astro` file with
  the same props and the same computed values. Hover, focus and press states
  moved from JS state to CSS `:hover` / `:focus-visible` rules.
- Three pieces of behaviour need JS and ship as small inline scripts:
  the typed hero prompt (26ms/char, click to skip, skipped entirely under
  `prefers-reduced-motion` and below 900px), and the ctrl+k launcher with
  `1`…`6` section jumps.
- There is no logo. The mark is `alpblkba.dev` in the lacquered display face
  beside one blaze→cyan chip; `public/favicon.svg` is that chip, and
  `public/favicon-180.png` is the same chip rasterised for browsers and
  bookmark bars that ignore SVG icons.
- **The old favicon was seen and deliberately replaced.** `public/favicon.svg`
  and `public/favicon.ico` on `main` are still the stock Astro logo from
  `npm create astro` — not your identity — so neither was carried over. If you
  would rather keep them, drop them back into `public/` and revert the three
  `<link rel="icon">` lines in `BaseLayout.astro`.

## Fonts

Bodoni Moda, IBM Plex Sans and JetBrains Mono load from Google Fonts via
`src/styles/ds/tokens/fonts.css`. Self-host them if you would rather not hit
a third party at runtime.
