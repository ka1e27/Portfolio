#!/usr/bin/env node
/**
 * Renders the two-page portfolio brief from index.html to a PDF.
 *
 * The brief is <section class="pdf-sheet"> in index.html — hidden on screen and
 * the only thing the @media print rules output. The site's "Save portfolio as
 * PDF" button produces the same document via the browser; this script exists for
 * when you want a static file to link directly.
 *
 *   npm i -D playwright-core
 *   node tools/generate-portfolio-pdf.js Kyle_Tran_Portfolio.pdf
 *
 * Run it with internet access, or Google Fonts won't load and the PDF will use
 * fallback serif/sans instead of Fraunces/Manrope.
 */
const path = require('path');

let chromium;
try {
  ({ chromium } = require('playwright-core'));
} catch (e) {
  try { ({ chromium } = require('playwright')); }
  catch (e2) { console.error('Install a driver first:  npm i -D playwright-core'); process.exit(1); }
}

const out = process.argv[2] || 'Kyle_Tran_Portfolio.pdf';
const page1 = path.resolve(__dirname, '..', 'index.html');

(async () => {
  const launch = {};
  if (process.env.CHROME_PATH) launch.executablePath = process.env.CHROME_PATH;
  const browser = await chromium.launch(launch);
  const ctx = await browser.newContext({ viewport: { width: 1240, height: 1600 } });
  const p = await ctx.newPage();
  p.setDefaultTimeout(0);

  await p.goto('file://' + page1, { waitUntil: 'load' });
  await p.emulateMedia({ media: 'print' });

  // Only the brief's thumbnails are lazy; resolve them before rendering.
  const stats = await p.evaluate(async () => {
    const imgs = Array.from(document.querySelectorAll('.pdf-sheet img'));
    imgs.forEach(i => { const d = i.getAttribute('data-src'); if (d && !i.getAttribute('src')) i.src = d; });
    await Promise.all(imgs.filter(i => !i.complete).map(i => new Promise(r => {
      i.onload = i.onerror = r; setTimeout(r, 20000);
    })));
    return { images: imgs.length, decoded: imgs.filter(i => i.naturalWidth > 0).length };
  });
  console.log('sheet images: ' + stats.decoded + '/' + stats.images + ' decoded');

  const fonts = await p.evaluate(() => document.fonts.size);
  if (!fonts) console.warn('WARNING: no webfonts loaded — output will use fallback faces.');

  await p.pdf({ path: out, format: 'A4', printBackground: true, timeout: 0 });
  await browser.close();
  console.log('wrote ' + out);
})().catch(e => { console.error(e.message); process.exit(1); });
