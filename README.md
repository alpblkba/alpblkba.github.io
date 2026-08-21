# alpblkba.dev

Personal site. Static, hand-written, no JavaScript build step —
[Zola](https://www.getzola.org) (a single Rust binary) plus Tera templates.

## What is here

    config.toml                   site config + every line of page copy in [extra]
    content/                      page shells and the notes, as markdown
    content/notes/*.md            the five notes
    templates/base.html           the page frame: plate, scrim, header, footer, ctrl+k
    templates/components.html     the ten UI components, as Tera 2 components
    templates/partials/           header, footer, command palette
    templates/partials/errors/    the six 404 personalities + the incident footer
    templates/{index,about,projects,notes-list,music,cv,note}.html
    templates/{404,error,errors-list}.html
    templates/rss.xml             the feed
    static/styles/ds/             design-system tokens (vendored, do not edit)
    static/styles/site.css        the site layer: component classes + note prose
    static/assets/notes/**        note figures
    static/images/bg.jpg          the plate
    static/favicon.svg  static/favicon-180.png  static/pgp.txt

## Running it

    zola serve        # http://127.0.0.1:1111, live reload
    zola build        # writes ./public
    zola check        # link check

Zola is one binary: `brew install zola`, or grab a release from
`github.com/getzola/zola/releases`. There is no `node_modules`, no lockfile
and nothing to `npm install`.

## Where the content lives

Everything the site *says* — identity, nav, contact rows, the about copy, the
project groups, the whole CV — is in `[extra]` in `config.toml`. The files in
`content/` are shells that pick a template; they carry no prose. The one
exception is `content/notes/*.md`, where the note body is the file.

Notes carry this front matter:

    +++
    title = "AES-128 on an iCE40 FPGA"      # heading + <title>
    date = 2026-07-08                       # sorts the index and the feed
    [extra]
    display_date = "08-07-2026"             # what the page actually prints
    tag = "aes"
    list_title = "AES-128 on an iCE40 FPGA" # the /notes index and feed title
    source = "https://github.com/..."       # optional [source ↗] link
    +++

`list_title` exists because the index and the article are allowed to disagree —
`aes-dfa-on-fpga` deliberately carries a longer title in the list than on the
page itself.

Note bodies are HTML rather than markdown syntax. That is intentional: they
were written that way and are carried over unchanged, and `.prose` in
`site.css` styles the bare elements.

## Error pages

`404.html` ships all six personalities as static markup and a ten-line script
picks one per load. Without JavaScript the first one (SIGSEGV) stays visible —
the CSS hides siblings, not the first child, so the page is never blank and
never stacks six of them. Force one while working on it:

    /404.html?variant=0     0 sigsegv
    /404.html?variant=1     1 works on my machine
    /404.html?variant=2     2 deprecated
    /404.html?variant=3     3 bash
    /404.html?variant=4     4 not an error, a feature
    /404.html?variant=5     5 page bus error

Whatever bogus path was requested, the address bar is rewritten to `/404` with
`history.replaceState` — no redirect, no extra request, back button intact.
`/404` is itself a path that does not exist, so refreshing it lands on the same
page and rolls again.

A static host only ever serves `404.html`, so the other statuses would never be
reachable. They live at `/400/`, `/418/`, `/503/` and so on — one
`content/errors/<code>.md` per status, each with `path = "<code>"`, all
rendered by `templates/error.html`. Adding a status is one new markdown file;
no template change.

`/errors/` lists the whole roster. Nothing on the site links to it and
`templates/sitemap.xml` filters out anything carrying `extra.sitemap_exclude`,
so neither the site nor a crawler will hand it to you — the 404 incident footer
leaves an HTML comment for whoever reads the source.

Everything on these pages is fictional. Nothing is logged, no IP is recorded,
no request is counted, and the incident IDs are `crypto.getRandomValues` run in
the browser.

## Design-system notes

- `static/styles/ds/` is a verbatim copy of the design-system token sheet.
  Treat it as vendored: restyle in `site.css`, never in `ds/`.
- Tera 2 components are hygienic — they see only their arguments, never the
  globals — so anything from `config` is passed in explicitly by the caller.
- One piece of behaviour needs JS and ships inline at the end of
  `templates/partials/palette.html`: the ctrl+k launcher with `1`…`7`
  section jumps.
- There is no logo. `favicon.svg` is the brand chip and `favicon-180.png`
  is the same chip rasterised for clients that ignore SVG icons.

## Fonts

JetBrains Mono and Inter load from Google Fonts via
`static/styles/ds/tokens/fonts.css`. Self-host them if you would rather not
hit a third party at runtime.

## Deploy

`.github/workflows/deploy.yml` pins a Zola version, verifies the release
tarball's SHA-256, runs `zola build`, and publishes `./public` to GitHub
Pages. Bump `ZOLA_VERSION` and `ZOLA_SHA256` together.

## History

The Astro version of this site is preserved on the `astro` branch.
