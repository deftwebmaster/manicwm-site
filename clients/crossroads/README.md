# CrossRoads Decorative Pavement: 2026 site

Plain HTML, CSS and JS with no build step and no framework. You can upload this folder to any static host.

## Structure
- `index.html`: homepage (`/`)
- `gallery/index.html`, `services/index.html`, `about-us/index.html`, `contact/index.html`: clean directory URLs (`/gallery/`, `/services/`, `/about-us/`, `/contact/`)
- `404.html`: static-host error page
- `assets/css/style.css`: all styles. Colors are set as variables at the top.
- `assets/js/theme.js`: applies the saved appearance before the page paints (dark by default).
- `assets/js/main.js`: shared light/dark switch, featured-project controls, mobile menu, gallery filters, lightbox and before/after sliders.
- `assets/img/work/`: project photos. Each one has a `name.webp` (full size) and a `name-sm.webp` (thumbnail).
- `robots.txt`, `sitemap.xml`, `site.webmanifest`, favicons, `crossroads-decorative-pavement.vcf` (the "save contact" card)

## Adding a photo to the gallery
1. Export a JPG at least 1600px wide and convert it to WebP. Save it as `assets/img/work/<slug>.webp` and add a 640px-wide copy as `<slug>-sm.webp`. Use `../assets/img/work/` paths in gallery markup, including `src`, `srcset` and `data-full`.
2. In `gallery/index.html`, copy one `<figure class="tile">` block and change the filenames, title, location, alt text and `data-cat`. The categories are `stamped`, `streetbond`, `crosswalks` and `art`.

## Turning on the contact form
In `contact/index.html`, set the form's `action` to a form endpoint (for example Formspree, Netlify Forms or Basin). Then remove `disabled` from the `<fieldset>`, `onsubmit="return false"` from the `<form>`, and the yellow "coming soon" note.

## Before launch
- [ ] Add a business email address (none appears on the current site) to the contact page, the footer and the JSON-LD.
- [ ] Upload the contents of this folder to the document root of a static host that serves directory `index.html` files. Clean URLs work without rewrite rules; `_redirects` has been removed.
- [ ] Submit `sitemap.xml` in Google Search Console and update the Google Business Profile website link.

## Local preview
Run `python3 -m http.server 8765 --directory "First Concept"` from the project root, then open `http://localhost:8765/`. Links are relative so the main pages also work when previewed under a subfolder.

## Design concept
The homepage leads with a manually browsed project spotlight and six selected projects, followed by before/after comparisons, services and company background. All photographs are existing project work. The Dark / Light switch in the header is available on every page, changes the complete color palette, and remembers the choice across pages and reloads when browser storage is available. The full-screen photo viewer keeps a dark backdrop in both themes for clear image viewing. The supplied blue logo is shared by both themes and resized to a transparent 768px-wide PNG for crisp header and footer display. No automatic slideshow or new dependencies are used.
