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

## og-card.html

Source for `images/web/og-card.jpg`, the 1200×630 card that LinkedIn, Slack and
iMessage show when someone shares the site. It repeats the class year and three
stats (4th national, 16 team podiums, 3.87 GPA) as pixels, so re-render it when
any of those change. Chrome needs no install; the page loads Google Fonts, so run
it online:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --hide-scrollbars `
  --force-device-scale-factor=2 --window-size=1200,630 --virtual-time-budget=6000 `
  --screenshot="$PWD\og-card.png" "file:///$PWD/tools/og-card.html"
```

That writes a 2400×1260 PNG. Downsample it to 1200×630 and save it as a JPEG with
Pillow, then replace `images/web/og-card.jpg`:

```python
from PIL import Image
Image.open('og-card.png').convert('RGB').resize((1200, 630), Image.LANCZOS) \
     .save('images/web/og-card.jpg', 'JPEG', quality=88, optimize=True, progressive=True)
```
