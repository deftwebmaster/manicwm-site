# Launch Hero

**Launch-ready hero sections in seconds.**

A free, fully static browser tool by [ManicWebmaster](https://manicwebmaster.com/) that generates polished landing page hero sections — no signup, no backend, no nonsense.

🔗 Live: [manicwebmaster.com/tools/launch-hero/](https://manicwebmaster.com/tools/launch-hero/)

---

## What It Does

Fill in your basic business info, pick a tone and color vibe, choose a template style, and click **Generate Hero**. You get:

- A styled, responsive hero section rendered live in a browser preview
- A strong headline drawn from copy pattern banks
- A subheadline, primary CTA, secondary CTA, and 3 benefit chips
- Guided brief fields for industry, location, proof, offer value, contact phone, and CTA URL
- Quick presets for common use cases like restaurants, local services, SaaS, creators, events, and agencies
- An optional credibility line (via "Make It More Legit")
- A CSS-only visual placeholder (orb, product card, testimonial card, badge)
- Quality badges that show whether the hero has a linked CTA, proof, offer value, contact info, and mobile preview
- Saved heroes and shareable links powered by localStorage and URL hashes

Then export it: **Copy HTML**, **Copy CSS**, **Copy All**, **Copy React**, **Copy Tailwind**, or **Download HTML** as a complete standalone file.

---

## Files

```
launch-hero/
├── index.html    — Full tool UI (nav, hero, generator, footer)
├── style.css     — Tool styles + all generated hero CSS (vibes, templates)
├── script.js     — Copy banks, template renderers, all JS logic
├── card.png      — Open Graph / social preview image
├── favicon*      — Browser favicon files
├── site.webmanifest — PWA/install metadata and app icons
└── README.md     — This file
```

---

## Run Locally

No build step required. Just open:

```
open index.html
```

Or serve it with any static server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

---

## Deploy to GitHub Pages

1. Push the `launch-hero/` folder to a GitHub repo (or a subfolder of an existing one).
2. In repo **Settings → Pages**, set source to `main` branch and the correct folder.
3. Done. The tool is live at `https://yourusername.github.io/yourrepo/`.

For a subfolder deploy (e.g. `manicwebmaster.com/tools/launch-hero/`), just place the files in `/tools/launch-hero/` in your repo.

The favicon, manifest, Android icons, Apple touch icon, and `card.png` should stay in that same folder so social cards and install icons resolve from `https://manicwebmaster.com/tools/launch-hero/`.

---

## Customize Templates

Templates live in `script.js` in the `RENDERERS` object. Each renderer is a function that takes `(d, isLegit)` and returns an HTML string:

```js
function renderSplit(d, isLegit) {
  // d = all form data + derived fields
  // isLegit = true when "Make It More Legit" was clicked
  return `<section class="lh-generated-hero lh-hero-split ...">...</section>`;
}
```

To add a new template:
1. Write a new `renderMyTemplate(d, isLegit)` function.
2. Add it to the `RENDERERS` object: `mytemplate: renderMyTemplate`.
3. Add the option to the `<select id="field-template">` in `index.html`.
4. Add the scoped CSS class `.lh-hero-mytemplate` to `style.css`.

---

## Add New Color Vibes

Color vibes are CSS variable sets scoped to a class on the hero root. They're all defined in `style.css`:

```css
.lh-vibe-my-vibe {
  --lh-bg: #...;
  --lh-text: #...;
  --lh-accent: #...;
  --lh-cta-bg: #...;
  /* ... see existing vibes for full token list */
}
```

Then register the class name in `script.js`'s `colorVibeClass()` function:

```js
'my-vibe': 'lh-vibe-my-vibe',
```

And add the `<option>` to the color vibe `<select>` in `index.html`.

---

## Add New Copy Patterns

### Headlines
Add a function to `HEADLINE_PATTERNS` in `script.js`. It receives `d` (all data):

```js
(d) => `${d.name} is changing how ${d.audience} experience ${d.type}`,
```

### Subheadlines
Same pattern — add to `SUBHEADLINE_PATTERNS`.

### Benefit Chips
Add to any tone bucket in `BENEFIT_CHIP_BANKS`:

```js
bold: [...existing, 'Your new chip here'],
```

### "Make It More Legit" Chips
Add a new array to `LEGIT_CHIPS`:

```js
['Chip one', 'Chip two', 'Chip three'],
```

---

## Design Architecture

- **Dark-first palette** — `--bg`, `--cyan`, `--violet`, `--magenta` CSS variables on `:root`
- **No external fonts** — system font stack for reliability
- **Scoped hero classes** — all generated CSS uses `lh-` prefix to avoid leakage
- **CSS variable vibes** — swap an entire color scheme by swapping one class

---

## Future Improvement Ideas

- [ ] Export PNG screenshot using html2canvas
- [ ] Additional templates: Agency, Event, Course, SaaS, Restaurant
- [ ] AI-powered copy mode (hook to Anthropic API)
- [ ] OpenGraph image generator
- [ ] Full landing page generator (hero + features + pricing + footer)
- [ ] Font style picker (display font chooser from Google Fonts or system stacks)
- [ ] Live editing — click-to-edit any element in the preview
- [ ] Image / brand asset support for generated hero visuals

---

## Built by ManicWebmaster

Need more than a hero section? Text Matt: **(555) 000-1234**
Or visit [manicwebmaster.com](https://manicwebmaster.com/)

<!-- * lone wolf, own sky | Matt Livingston -->
