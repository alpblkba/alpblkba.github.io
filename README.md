# alpblkba.dev

Personal static site with [Zola](https://www.getzola.org) (a single Rust binary) plus Tera templates.

## What is here

    config.toml                   site config + every line of page copy in [extra]
    content/                      page shells and the notes, as markdown
    content/notes/*.md            notes
    templates/base.html           the page frame: plate, scrim, header, footer, ctrl+k
    templates/components.html     UI components, as Tera 2 components
    templates/partials/           header, footer, command palette
    static/assets/notes/**        note figures

## Running it

    zola serve        # http://127.0.0.1:1111, live reload
    zola build        # writes ./public
    zola check        # link check

Zola is one binary: `brew install zola`, or grab a release from `github.com/getzola/zola/releases`.

## Design-system notes

- Tera 2 components are hygienic, they see only their arguments, never the globals therefore anything from `config` is passed in explicitly by the caller.

## Deploy

`.github/workflows/deploy.yml` pins a Zola version, verifies the release tarball's SHA-256, runs `zola build`, and publishes `./public` to GitHub Pages. Bump `ZOLA_VERSION` and `ZOLA_SHA256` together.
