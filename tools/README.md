# tools/

## resume.html → Kyle_Tran_Resume.pdf

The source of the résumé that the site's Résumé buttons download. It replaced a
FlowCV export in 2026-09, so edit this file rather than FlowCV. It is one page of US
Letter in a single column of real text, which is what applicant-tracking systems
parse reliably. Its facts have to match the site and the brief (CLAUDE.md §6).

```bash
python -m http.server 8099          # from the repo root; fonts load from Google, so be online
node tools/print-pdf.mjs http://127.0.0.1:8099/tools/resume.html Kyle_Tran_Resume.pdf
```

Check that it still says `pages=1`. Things to watch for:
- A line that can't wrap (for example `white-space:nowrap` with no spaces between
  items) makes Chrome shrink the whole page to fit it, so every font goes small.
- Keep literal spaces around the `|` separators. Text extractors, and so ATS
  parsers, need them to split the words.
- **Static fonts only.** A variable font (Source Sans 3 from the css2 API) gets
  embedded as Type 3 glyph drawings that older parsers can't read. The legacy API
  serves Source Sans Pro one file per weight, which embeds as TrueType. Check that
  every font on the page is `/Type0`:
  `python -c "from pypdf import PdfReader; p=PdfReader('Kyle_Tran_Resume.pdf').pages[0]; print({v.get_object()['/Subtype'] for v in p['/Resources']['/Font'].values()})"`
- **No letter-spacing on headings.** At `.07em`, pdftotext read "E D U C AT I O N",
  and a parser that can't find the Education heading loses the degree and dates.
  `pdftotext Kyle_Tran_Resume.pdf -` should show each heading as one word.

## print-pdf.mjs

Prints any page to PDF with the Chrome already installed. It needs no npm packages,
because Node 22+ has the WebSocket that the DevTools protocol needs. The paper size
comes from the page's own `@page` rule; an optional third argument sets the PDF's
Title field. It fetches webfonts as Chrome 60, because Google Fonts gives current
browsers one variable file per family, which Chrome can only embed as Type 3 glyph
drawings, and gives older browsers one static file per weight, which embeds as
TrueType. It prints the page count and exits non-zero if a webfont failed to load or
any Type 3 font got in.

## Kyle_Tran_Portfolio.pdf (the two-page brief)

The brief lives in `index.html` as `<section class="pdf-sheet">`, hidden on screen
and the only thing `@media print` outputs. The contact band links the committed
`Kyle_Tran_Portfolio.pdf` rather than printing in the visitor's browser: a browser
print embeds the variable webfonts as Type 3, and every browser lays text out a
little differently. **Regenerate it whenever the `.pdf-sheet` markup or its print CSS
changes**, or the site serves a stale copy:

```bash
node tools/print-pdf.mjs http://127.0.0.1:8099/index.html Kyle_Tran_Portfolio.pdf "Kyle Tran Portfolio"
```

Expect 2 pages at about 1.8 MB with `type3 fonts: 0`. The brief prints on US Letter
(it was A4 until 2026-09; US recruiters print on Letter). Both pages keep about half
an inch spare at the bottom, because Ctrl+P in Safari or Firefox sets text slightly
differently from Chrome. Check that margin after edits, since a page that runs over
prints a third one.

What keeps it readable to parsers (the résumé rules, applied to the brief):
- Letter-spacing at `.03em` or less on anything a parser must read. At `.1em` and up,
  pdfminer reads "M E C H A N I C A L".
- Each stat is one line, value first ("3.87 GPA"). A label stacked over its value made
  a line reader pair each label with the wrong number.
- Skill items are `.nb` (no wrap), so a line never breaks inside a term. pdftotext
  drops a line-end hyphen and "simulation-first" became "simulationfirst".
- Standard section names (Projects, Leadership experience, Education, Skills, Awards),
  straight apostrophes, no `&nbsp;`, "to" instead of arrows.

`generate-portfolio-pdf.js` is the older Playwright route. Don't use it for the
committed file: it doesn't fetch static fonts, so its PDF has Type 3 fonts.

## og-card.html

Source for `images/web/og-card.jpg`, the 1200×630 card that LinkedIn, Slack and
iMessage show when someone shares the site. It uses the light theme (since
2026-09-23), like the site's default. It repeats the class year and three
stats (4th national, 16 team podiums, 3.87 GPA) as pixels, so re-render it when
any of those change. Chrome needs no install; the page loads Google Fonts, so run
it online. Give Chrome its own `--user-data-dir`: without one it tries the owner's
open profile and exits without a screenshot.

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --hide-scrollbars `
  --force-device-scale-factor=2 --window-size=1200,630 --virtual-time-budget=8000 `
  --user-data-dir="$env:TEMP\og-card-profile" `
  --screenshot="$PWD\og-card.png" "file:///$PWD/tools/og-card.html"
```

That writes a 2400×1260 PNG. Downsample it to 1200×630 and save it as a JPEG with
Pillow, then replace `images/web/og-card.jpg`:

```python
from PIL import Image
Image.open('og-card.png').convert('RGB').resize((1200, 630), Image.LANCZOS) \
     .save('images/web/og-card.jpg', 'JPEG', quality=88, optimize=True, progressive=True)
```

Then change the `?v=` on the `og:image` and `twitter:image` URLs in `index.html`.
Link previews are cached by URL, so without a new one the old card keeps showing.
LinkedIn's Post Inspector re-reads a page on demand.
