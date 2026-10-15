# Reel Transcript Lab

Static site source and Cloudflare Worker configuration for `reeltranscriptlab.com`.

## Layout

- `outputs/instagram-transcript/` — static HTML, CSS, JavaScript, guides, and local SVG assets.
- `outputs/reeltranscriptlab-worker.mjs` — Worker route that keeps the Supadata secret server-side.
- `outputs/reeltranscriptlab-worker.wrangler.jsonc` — Wrangler deployment configuration.
- `outputs/seo-cycle/` — editorial queue and cycle records used to maintain the guides area.

## Local development

Serve `outputs/instagram-transcript/` with any static file server. The Worker deployment uses the Wrangler configuration in `outputs/` and expects `SUPADATA_API_KEY` as a secret binding; the key is never stored in this repository.
