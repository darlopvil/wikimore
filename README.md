<p align="center">
  <img src="src/wikimore/static/img/wikimore-512.png" alt="Wikimore" width="128" height="128">
</p>

# Wikimore

A simple, privacy-friendly frontend for Wikimedia projects (Wikipedia, Wiktionary, Wikibooks, Wikiquote, Wikisource, Wikinews, Wikivoyage), built with Flask.

Wikimore fetches articles through the Wikimedia API and renders them without trackers, ads or third-party requests: every image is served through the instance's own proxy, so the reader's browser never talks to Wikimedia directly.

## About this fork

This is a fork of [Wikimore by the Private.coffee Team](https://git.private.coffee/privatecoffee/wikimore), kept in sync with upstream and carrying a number of fixes that are not (yet) merged there.

### Fixes in this fork

- **`File:` pages** render the actual file with its description instead of an empty page, plus better resilience to the API's rate limiting (HTTP 429). Fixes upstream issue #4.
- **Complete image proxying.** Wikimedia moved article thumbnails to `thumb.wikimedia.org` and serves rendered formulas from `wikimedia.org/api/rest_v1/media/math`; neither host was proxied, so browsers requested most images straight from Wikimedia, exposing the reader's IP. The `srcset` attribute was never rewritten either, so high-DPI screens bypassed the proxy entirely. All of it now goes through `/proxy`, which also forwards the upstream `Content-Type` (SVG formulas are not rendered without it), caches small responses in Redis and sets `Cache-Control`.
- **Galleries** of every mode render properly. Only `mw-gallery-packed` was styled, so the default `mw-gallery-traditional` galleries came out as a bulleted vertical list.
- **`wikitable` styling.** The stylesheet had no rule at all for MediaWiki's own table class, so most tables rendered as borderless text.
- **Dark mode with real-world templates.** Inline background colours (`#eee` labels in infoboxes, Codex custom properties such as `var(--background-color-neutral-subtle, #f8f9fa)`, duplicate declarations) are classified server-side and restyled, instead of leaving light-on-light text. Math formulas and line-art drawings get the treatment they need to stay readable.
- **Collapsible sections without JavaScript.** MediaWiki builds its collapsible toggles client-side, so collapsible tables arrived permanently expanded. They are converted server-side into native `<details>`/`<summary>` elements.
- **Sortable tables**, reimplemented in a small dependency-free script, replacing MediaWiki's jquery-tablesorter.
- **Coordinates** get a map link to OpenStreetMap, replacing Wikipedia's JavaScript-only WikiMiniAtlas gadget. The original GeoHack link is left untouched.
- Assorted rendering fixes: block quotations, hatnotes, and the `Article/Artículo principal` boxes.

## Features

- All Wikimedia projects, in every language
- Search
- All images proxied through the instance
- Light and dark themes
- No third-party requests, no trackers, no ads

## Requirements

- Python 3.11+
- Redis (optional, recommended: it caches API responses and proxied images, which greatly reduces traffic to Wikimedia and the odds of being rate-limited)

## Running with Docker

```bash
git clone https://github.com/darlopvil/wikimore
cd wikimore
cp docker-compose-example.yml docker-compose.yml
# edit docker-compose.yml: set at least WIKIMORE_INSTANCE_HOSTNAME and
# WIKIMORE_ADMIN_EMAIL, which identify your instance to Wikimedia
docker compose up -d --build
```

## Running from source

```bash
git clone https://github.com/darlopvil/wikimore
cd wikimore
python3 -m venv venv
source venv/bin/activate
pip install .
wikimore
```

The app listens on `http://localhost:8109` by default.

## Configuration

All configuration is done through environment variables.

| Variable | Default | Description |
| --- | --- | --- |
| `WIKIMORE_HOST` | `127.0.0.1` | Address to bind to |
| `WIKIMORE_PORT` | `8109` | Port to listen on |
| `WIKIMORE_DEBUG` | `0` | Flask debug mode |
| `WIKIMORE_INSTANCE_HOSTNAME` | *(unset)* | Sent in the User-Agent to Wikimedia. Set it. |
| `WIKIMORE_ADMIN_EMAIL` | *(unset)* | Contact address in the User-Agent. Set it. |
| `WIKIMORE_LANGSORT` | *(unset)* | Comma-separated language codes to list first, e.g. `es,en,de` |
| `WIKIMORE_CACHE_TYPE` | `SimpleCache` | `RedisCache` to use Redis |
| `WIKIMORE_REDIS_URL` | *(unset)* | e.g. `redis://redis:6379/0` |
| `WIKIMORE_CACHE_TIMEOUT` | `3600` | Cache lifetime in seconds |

Wikimedia asks that clients identify themselves, and unidentified traffic gets rate-limited sooner, so setting `WIKIMORE_INSTANCE_HOSTNAME` and `WIKIMORE_ADMIN_EMAIL` is strongly recommended.

Under uWSGI, `UWSGI_PROCESSES` and `UWSGI_THREADS` are read natively and are worth setting: with a single worker, every proxied image is served one at a time.

## License

MIT, as upstream. See [LICENSE](LICENSE); the original copyright of the Private.coffee Team is retained.

The Wikimore name and icon in this fork are not affiliated with, endorsed by, or connected to the Wikimedia Foundation.