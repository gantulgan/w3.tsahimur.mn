# tsahimur.mn

Static website for Tsahim-Ur LLC, served by Cloudflare Workers static assets (`wrangler.jsonc`).

## Structure

| Path | What it is |
|---|---|
| `index.html`, `services/`, `solutions/`, `about/`, `contact/` | Generated pages — **do not edit by hand** |
| `src/strings.py` | All text, English (`EN`) and Mongolian (`MN`) |
| `src/pages/*.html` | Page templates |
| `src/partials/*.html` | Shared head, header and footer |
| `src/build.py` | Builds the pages and `assets/js/i18n.js` |
| `assets/css/site.css` | Brand styles (colors, Exo 2 / Inter / JetBrains Mono) |
| `assets/js/site.js` | Language switch, navigation, contact form and animations |
| `assets/vendor/` | GSAP, ScrollTrigger, Lenis |

## Editing

1. Change text in `src/strings.py` (keep EN and MN keys in sync), or layout in `src/pages` / `src/partials`.
2. Run `python3 src/build.py` (Python 3, no dependencies).
3. Commit the generated files together with your source changes.

Preview locally: `python3 -m http.server 8080` and open http://localhost:8080.

`.assetsignore` keeps `src/` and config files from being published.
