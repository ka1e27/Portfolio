# tools/

## generate-portfolio-pdf.js

Renders the **two-page portfolio brief** to a PDF. The brief lives in
`index.html` as `<section class="pdf-sheet">` — hidden on screen, and the only
thing `@media print` outputs.

You usually don't need this: the site's "Save portfolio as PDF" button already
produces the same two pages through the browser, with the real webfonts. Use the
script only if you want a static file committed so it can be linked directly.

```bash
npm i -D playwright-core
node tools/generate-portfolio-pdf.js Kyle_Tran_Portfolio.pdf
```

To link the file instead of printing, replace the `<button id="save-pdf">` in
`index.html` with:

```html
<a class="btn btn-ghost" href="Kyle_Tran_Portfolio.pdf" download>Portfolio PDF</a>
```

Run it on a machine with internet access. Without it, Google Fonts can't load and
the PDF renders in fallback serif/sans instead of Fraunces/Manrope. Expect 2 pages
at roughly 1.8 MB.

To edit the brief's content, edit the `.pdf-sheet` markup — it's deliberately
independent of the site copy so the two can be tuned separately.
