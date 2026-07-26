# v0.2 — integration notes

Drop-in replacement sources for alpblkba.github.io, redesigned on the Modernist
design system. Content is unchanged from \`main\`.

## What is here

    src/styles/global.css        design tokens + component classes + site layer
    src/layouts/BaseLayout.astro header nav, poster band, footer
    src/pages/index.astro
    src/pages/about.astro
    src/pages/projects.astro
    src/pages/notes.astro
    src/pages/music.astro
    src/pages/cv.astro
    public/images/portrait.png

## How to integrate

    git checkout -b v0.2
    # copy src/ and public/ from this folder over the repo root, then:
    npm run dev

Files replaced: \`src/styles/global.css\`, \`src/layouts/BaseLayout.astro\`, and the
five top-level pages. Nothing under \`src/pages/notes/\` is touched — those note
pages still use BaseLayout and will pick up the new chrome automatically, though
their article body styling is still the old global.css rules (long-form layout is
the next piece of work).

## Notes

- \`global.css\` starts with the Modernist token sheet; it pulls Archivo from Google
  Fonts via the \`@import\` on line 2. Self-host it if you would rather not hit a
  third party at runtime.
- The portrait is referenced as \`/images/portrait.png\`. The old
  \`public/images/petalinux-enjoyer.jpg\` is left alone and no longer referenced.
- The nav marks the current page with \`aria-current="page"\`, styled by \`.nav a\`.
