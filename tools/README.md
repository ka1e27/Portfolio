# tools/

## generate-portfolio-pdf.js

Renders the whole portfolio to a single PDF using the `@media print` rules in
`index.html`. Optional — the site's "Save portfolio as PDF" button already does
this through the browser. Use this only if you want a static file committed to
the repo so it can be linked directly.

```bash
npm i -D playwright-core          # or: npm i -D playwright
node tools/generate-portfolio-pdf.js Kyle_Tran_Portfolio.pdf
```

Then point the button at the file instead of printing — in `index.html` replace
the `<button id="save-pdf">` with:

```html
<a class="btn btn-ghost" href="Kyle_Tran_Portfolio.pdf" download>Portfolio PDF</a>
```

Run it on a machine with internet access. Without it, Google Fonts can't load and
the PDF renders in fallback serif/sans instead of Fraunces/Manrope. Expect roughly
50 pages and 15-20 MB at current image sizes.
