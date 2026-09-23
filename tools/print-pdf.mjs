// Print a page to PDF with the Chrome already on this machine. No installs:
// Node 22+ has a built-in WebSocket, which is all the DevTools protocol needs.
//
//   node tools/print-pdf.mjs <url> <out.pdf> [pdf title]
//
// Serve the repo first (python -m http.server 8099) so fonts and images load:
//   résumé: node tools/print-pdf.mjs http://127.0.0.1:8099/tools/resume.html Kyle_Tran_Resume.pdf
//   brief:  node tools/print-pdf.mjs http://127.0.0.1:8099/index.html Kyle_Tran_Portfolio.pdf "Kyle Tran Portfolio"
// The page's own @page rule sets the paper size. It prints the page count, and exits
// non-zero if a webfont failed to load (a fallback-font PDF looks fine at a glance
// and wrong on paper) or if any font went in as Type 3 (see LEGACY_UA below).
import { spawn } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const [, , url, out, title] = process.argv;
if (!url || !out) { console.error('usage: node tools/print-pdf.mjs <url> <out.pdf> [pdf title]'); process.exit(2); }
const PORT = 9366;
// Absolute, always: a relative --user-data-dir falls back to the owner's real
// Chrome profile, which is in use, and Chrome exits at once with code 21.
const PROFILE = resolve(tmpdir(), `print-pdf-${PORT}`);
const CHROME = process.env.CHROME || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
try { rmSync(PROFILE, { recursive: true, force: true }); } catch {}
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-color-profile=srgb',
  `--remote-debugging-port=${PORT}`, '--remote-allow-origins=*', `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const done = code => { try { chrome.kill(); } catch {} process.exit(code); };   // our own PID only

let wsUrl;
for (let i = 0; i < 80 && !wsUrl; i++) {
  try { wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()).find(t => t.type === 'page')?.webSocketDebuggerUrl; } catch {}
  if (!wsUrl) await sleep(250);
}
if (!wsUrl) { console.error('Chrome did not come up'); done(1); }
const ws = new WebSocket(wsUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0; const pending = new Map(); const waiters = [];
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.rej(new Error(m.error.message)) : p.res(m.result); }
  else if (m.method) waiters.filter(w => w.method === m.method).forEach(w => { waiters.splice(waiters.indexOf(w), 1); w.res(m.params); });
};
const send = (method, params = {}) => new Promise((res, rej) => { const n = ++id; pending.set(n, { res, rej }); ws.send(JSON.stringify({ id: n, method, params })); });
const next = method => new Promise(res => waiters.push({ method, res }));
const evaluate = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result.value;

await send('Page.enable'); await send('Network.enable');
await send('Network.setCacheDisabled', { cacheDisabled: true });
// Google Fonts gives a current browser one variable font file for every weight, and
// Chrome can only embed a variable font as Type 3 glyph drawings, which older
// applicant-tracking parsers can't read. An older browser gets one static file per
// weight, which embeds as ordinary TrueType. So fetch as Chrome 60; the site's own
// scripts never read the user agent.
const LEGACY_UA = 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.113 Safari/537.36';
await send('Network.setUserAgentOverride', { userAgent: LEGACY_UA });
await send('Emulation.setEmulatedMedia', { media: 'print' });   // lazy images and print CSS both see print
const loaded = next('Page.loadEventFired');
await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'print=' + Date.now() });
await loaded;
// load every image the print layout can show, then wait for the webfonts
await evaluate(`(async () => {
  document.querySelectorAll('img').forEach(i => { i.loading = 'eager'; if (!i.getAttribute('src') && i.dataset.src) i.src = i.dataset.src; });
  await Promise.race([Promise.all([...document.images].map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 12000))]);
  await document.fonts.ready; return 1; })()`);
await sleep(600);
if (title) await evaluate(`document.title = ${JSON.stringify(title)}; 1`);   // the PDF's Title field
const fonts = await evaluate(`[...document.fonts].map(f => f.family.replace(/"/g, '') + ' ' + f.weight + ' ' + f.status)`);
const failed = fonts.filter(f => !/loaded$/.test(f) && !/unloaded$/.test(f));
const pdf = await send('Page.printToPDF', { printBackground: true, preferCSSPageSize: true });
const buf = Buffer.from(pdf.data, 'base64');
writeFileSync(out, buf);
const raw = buf.toString('latin1');
const pages = (raw.match(/\/Type\s*\/Page[^s]/g) || []).length;
const type3 = (raw.match(/\/Subtype\s*\/Type3/g) || []).length;
console.log(`${out}  pages=${pages}  ${Math.round(buf.length / 1024)} KB  fonts loaded: ${fonts.filter(f => /\bloaded$/.test(f)).length}` +
  `  type3 fonts: ${type3}` + (failed.length ? `  FAILED: ${failed.join(', ')}` : ''));
ws.close();
done(failed.length || type3 ? 1 : 0);
