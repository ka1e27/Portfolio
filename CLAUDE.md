# Kyle Tran — Portfolio · Design & Working Guidelines

Guidelines for designing/editing this website. Claude Code auto-loads this file, so treat it
as the source of truth for how this site is built and how to keep it consistent.

---

## 0. TL;DR for a new session
- **One file:** `index.html` (HTML + inline `<style>` + two inline `<script>`s). **No build step, no framework, no npm.** Edit it directly.
- **Preserve the engine:** SPA hash router, theme toggle, lazy image loaders, video facade, scroll-reveal, count-ups, and the **dev-mode editor**. Don't rip these out.
- **Design law:** near-monochrome + **ONE** functional Northeastern-red accent (`--signal`). No gradients. No second color. Accent is for *signals only*, never decoration.
- **Readability:** body text ≥ 16px, mono labels ≥ 12px. Never smaller.
- **Verify visually before finishing** any visual change (headless screenshot QA — see §9). The automated audit won't catch bad *taste*; look at the screenshots.
- **Images:** reference only the optimized copies in `images/web/`. Optimize new photos with Pillow (`exif_transpose`!). Never reference the big originals in `images/`.
- **Don't fabricate** specs/numbers/materials. Use the owner's words and the GitHub repos.
- **Encoding trap:** never round-trip `index.html` through PowerShell `Get-Content`. Use the Edit tool or Python (utf-8). See §7.

---

## 1. What this is
- Personal portfolio of **Kyle Tran**, Mechanical Engineering @ Northeastern. Hardware/robotics focus.
- **Single-file static site**, deployed on **GitHub Pages from `main`** (repo `ka1e27/Portfolio`). Pushing to `main` deploys.
- **SPA with hash-routed tabs** (`switchTab`): `#work` (hero + bento work grid), `#about`, `#experience`, and project pages `#project-boat`, `#project-combat`, `#project-maze`, `#project-misc`.
- Only external deps: Google Fonts + YouTube embeds. Works offline except fonts/video.

## 2. Aesthetic direction
**"Field-instrument editorial"** — precise, technical, datasheet-like, warmed by an editorial serif. Dark-first.
- **Type (do not change):** Fraunces (display serif — use its `ital` + `opsz` axes), Manrope (body sans), IBM Plex Mono (data / labels / captions / metadata).
- **Color:** near-monochrome + one accent `--signal` — **Northeastern red** (changed from hazard-orange 2026-09). Use the accent ONLY for: status dots, REV/NEW markers, result markers, focus rings, hover cues, ranking chips, the timeline rule. Never a brand wash, never a gradient, never a 2nd hue.
  - **The red is per-theme on purpose.** Northeastern's brand red `#C8102E` makes 5.21:1 on the light cream `#F3F1EC` (AA, use it as-is) but only **3.31:1 on the dark `#0D0D0C`** — it fails AA for the 12px mono labels the accent is mostly used on. So dark uses it lightened to `#E63C52` (4.75:1). Light `#C8102E` / dark `#E63C52`; `--signal-strong` is `#A50D26` light (darker) and `#FF5068` dark (brighter). **Recompute contrast if you retune either** — don't just pick a red you like.
- Keep the **film-grain** overlay and the **fully-tokenized dark + light themes** (light is authored, not a filter-invert).

## 3. Tokens (defined in `:root` / `[data-theme]`)
- **Spacing:** `--s1`…`--s11` (4→184px). Use these; don't hardcode px for layout gaps.
- **Type scale:** `--fs-hero`…`--fs-100` (fluid `clamp()`). Label floor `--fs-label` ≈ 12.5px, `--fs-label-sm` = 12px. Body floor `--fs-400` = 16px. `--fs-300` (14.4px) is for *secondary/meta only*.
- **Radii:** `--r-pill` (nav/buttons/tags) · `--r-panel`/`--r-chrome` (panels) · `--r-frame` (media, near-sharp 3px). **Keep this split** — do NOT uniformize corner radius (that's an AI-generic tell).
- **Portrait caps:** `--cap-sm/md/lg` (340/460/580) — apply by role so tall images don't blow up.
- **⚠ `ch` gotcha:** `ch` is relative to the element's *own* font-size. Don't put a `ch` max-width on a wrapper whose children use a much larger font. (A `22ch` on the project title *block* measured against the 16px body font = ~200px and squished every project header — that bug is fixed; don't reintroduce it. Put the measure on `.pd-title` itself, which uses the big font: `max-width:16ch`.)

## 4. Layout & components (reuse, don't reinvent)
- Wrappers: `.container` (1240) · `.container-wide` (1500) · `.full-bleed` (100vw). Reserve **one** frameless `.pd-bleed` image per case study as a deliberate break.
- **Work grid:** featured 16:9 + bento (`.col-7` / `.col-5` / `.col-12`).
- **Project detail:** `.pd-kicker` (one line) · `.pd-title` (`max-width:16ch`) · `.pd-tags` · `.spec-strip` (datasheet grid; add `.cols-2`) · `.pd-result` · `.pd-links` (CAD / GitHub / live-app pills) · `.pd-split` (asymmetric 5fr/7fr; `.media-left` flips it; `.is-portrait` caps the image) · `.pd-sticky` (pinned media + build steps) · `.diff-table` (v1→v2 with `.rev` markers) · `.spec-details` (BOM `<details>`) · `.pd-gallery` (masonry, *order-agnostic* sets) · `.build-strip` (horizontal snap, *chronological* sets, grayscale process photos) · `.fig-annotated` (CAD callouts; `data-target` on a `.callout` highlights `.spec-cell[data-spec=…]`).
- **Figures:** `.img-fig` > `.img-el` (never cropped) + `.img-cap` (auto `FIG.NN` via CSS counter scoped to `.pd`). Cards use `.cover` + `data-img` (cropped thumbnail contract — different from figures on purpose).
- **Combat robot showcase:** `.robot-rank` chip + `.robot-lead` + body + CAD link.
- `.ig-feature` (Instagram feed block) · `.maker-cta` (MakerWorld) · `.cred-strip` (home stats) · `.hero-telemetry` + `.marquee` + `.hero-motif` (hero flair).
- **Lightbox:** sequence viewer (prev/next, counter, `←/→/Esc`, swipe, focus-trap) bound to any `.img-clickable`.

## 5. Motion (all reduced-motion-safe; `@supports`-gate scroll-driven CSS)
- Keep: View Transitions on tab switch, `.reveal` choreography (`data-reveal` direction + `data-reveal-delay`), native `animation-timeline: view()` "develop" on covers, magnetic primary buttons (`(hover:hover) and (pointer:fine)` + `!reduce` only), variable-font nav weight (`@property --wght`), count-ups, scroll-progress bar, tool marquee, subtle contour-motif parallax.
- **Always gate JS motion behind `!reduce` at the source** (don't allocate rAF loops for reduced-motion users). Confine spring easing to small interactive chrome, never page-level moves.
- **Avoid (2026 cringe/AI-slop):** scroll-jacking, full-page smooth-scroll libraries, cursor *replacement*, uniform fade-up-blur on everything, per-character text stagger, heavy WebGL, big tilt + gloss, contentless marquees, reveals that re-fire on scroll-up.

## 6. Content & accuracy rules
- **Never fabricate** specs, numbers, materials, rankings, or process claims. Source from the owner's descriptions and the GitHub repos: `ka1e27/D.R.E.A.M.S-V1`, `ka1e27/Autonomous-Maze-Navigation-Robot`, `ka1e27/D.R.E.A.M.S-Vision-Test`.
- **Known-true facts (keep consistent):** GPA **3.87**; **10** robots designed; **16** podium finishes across 5 events; **4th** national Plastic Antweight (2024 RCL). Machining is **outsourced** (not in-house). Dog is **Mocha**. No "hammer" weapons.
  - **Boat (D.R.E.A.M.S):** v1 = 3× RP2040 (boat/shore/pod), HC-12 433 MHz half-duplex, PLA hull, winch bottom-contact sampling, JSON missions + CSV + waypoint-planner web app (`dreamsv1.kylegtran2007.workers.dev`). v2 = Pi 5 + 2× RP2040, stereo-vision avoidance (YOLOv8 gated by anomaly screen), VESC diff-drive, 4G→PostGIS cloud, power = M18 for electronics + winch with a 12S LiPo drive planned, **ASA hull with fiberglass + epoxy skin**, simulation-first.
  - **Maze:** built *with a partner* (he led CAD + firmware); ultrasonic + IR line-following; **tank-drive**; asyncio; I2C LCD.
  - **Combat:** Korybantes (3lb beater, top-35 US '25), Achilles metal (1lb, top-15 US '25, **single-cam shuffler on the newest version only** — walks flipped), Achilles plastic (4th nat'l, top-30 US '24, belt-driven undercutter).
- **Voice:** concrete and specific (real part names/numbers). No vague superlatives ("cutting-edge," "passionate," "innovative solutions").

## 7. Images (workflow + traps)
- Source photos → `images/` (any name, spaces ok). **Optimize** into `images/web/<kebab-slug>.jpg` with **Pillow**:
  `ImageOps.exif_transpose(im)` **(critical — bakes phone rotation; System.Drawing does NOT do this and produced sideways images)** → flatten alpha onto white → `thumbnail((2000,2000), LANCZOS)` → save JPEG `quality=84, optimize, progressive`.
- Reference **only** `images/web/…` in the HTML. Add intrinsic `width`/`height` to every content `<img>` (prevents layout shift).
- **HEIC** can't be displayed by browsers — convert first. `pip install pillow-heif` then `pillow_heif.register_heif_opener()` works (installs cleanly, even on Python 3.14), after which the normal Pillow pipeline handles the `.HEIC` like any other source.
- **⚠ Encoding trap:** editing `index.html` via PowerShell `Get-Content … | WriteAllText` misreads UTF-8 as CP1252 → mojibake (`·`→`Â·`, `×`→`Ã—`). Use the **Edit tool** or **Python (utf-8)** for any programmatic HTML edit. Recovery if it happens: read bytes as UTF-8, re-encode to CP1252 (Python handles the 5 undefined bytes as identity).

## 8. Video
- `.video-spot` driven by `data-video`. **Prefer a YouTube/Vimeo link** (renders a lite facade: thumbnail + play → swaps to an inline `<iframe>` on click).
- Inline playback works only when the page is **served over http/https** (localhost or the deployed site). Opening the raw file (`file://`) can't embed YouTube (browser security). The local `.mov` files are **HEVC** (Safari/Edge only) — don't use them as `<video>` sources.

## 9. QA workflow — DO THIS before finishing any visual change
No browser extension is available; **drive a headless Chromium yourself**.
1. **There is no Node/npm on this machine** (checked 2026-09) — `npm i playwright` will fail. Use the **Chrome that is already installed**, which needs nothing:
   `& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --disable-gpu --hide-scrollbars --force-color-profile=srgb --screenshot="out.png" --window-size=1400,3400 --virtual-time-budget=9000 "http://127.0.0.1:8099/index.html#experience"`
   Serve the site first: `python -m http.server 8099` from the repo. Light theme: add `--blink-settings=preferredColorScheme=1`. Crop tall captures into readable sections with Pillow.
   - Add **`--force-prefers-reduced-motion`**, or the **count-ups get caught mid-animation** and a screenshot shows "6+ Members" where the source says `data-count="10"`. That looks like a content bug and isn't one.
   - Don't try to review desktop layouts through the in-app browser pane: it captures device pixels, so at a 1400px emulated viewport you only see a corner.
   - **`--window-size` widths below ~500px get clamped.** Chrome lays the page out wider and then crops the capture, which looks exactly like horizontal overflow — clipped images, text cut mid-word at the right edge. Don't chase it. Use ≥560 for a narrow visual check, and measure real mobile overflow by emulating a true 390 viewport and reading `documentElement.scrollWidth` vs `innerWidth`.
   - The pane's tab does no layout while hidden, so `loading="lazy"` images sit at `naturalWidth===0` forever and look broken. Confirm with `fetch()` + a fresh `new Image()` before believing a broken-image report.
2. Screenshot **every route × {1440, 820, 390} × {dark, light}**. Before each screenshot: force-load lazy media (set `img.src` from `data-src`, set bg from `data-img`) and use context `reducedMotion:'reduce'` (so `.reveal` elements aren't hidden).
3. Auto-audit each view for: **horizontal overflow** (flag only elements exceeding the viewport that have **no clipping ancestor** — marquees/motifs are intentionally clipped, so raw `scrollWidth` is a false positive), **sub-12px text**, **clipped text**, **broken images** (`naturalWidth===0`), **console/page errors**.
4. Tall project pages render tiny at full-page scale — capture **element/section clips** at readable size (note: `element.screenshot()` can hang on `overflow:clip` or hidden-tab elements; scope to `.tab-content.active`, `waitForFunction` on image `naturalWidth>0`, and use `page.screenshot({clip})`).
5. A **contact sheet** (each image + its caption + its section) is the fastest way to verify every image is placed well and oriented correctly.
Ship only when the audit is clean across all views AND the screenshots look genuinely good.

## 10. Dev-mode editor (preserve)
Press `~` (backquote) or open at `#edit`: drag any media/text, click text to edit inline, changes persist to `localStorage` and re-apply on load; "Export HTML" bakes edits into a clean file. If you rename/restructure text classes, update `TEXT_SELECTOR` in the dev-mode `<script>` so those blocks stay editable.

## 11. Git / deploy
- Deploys from `main`. Commit when asked; end commit messages with the `Co-Authored-By: Claude …` trailer.
- Keep the 214 MB `images/Video of subtasks for dreams v1.mov` **gitignored**. Don't commit stray/unreferenced source files.
- Convention so far: separate commits for image additions vs. `index.html` changes.

## 12. Open items to confirm with the owner
- **Crimp Battle Board** — CONFIRMED (2026-07): a head-to-head crimp-strength game for climbers; two people pull on it to see who has the stronger crimp. Blurb on the Misc page updated accordingly.
- **Instagram tiles** use real robot photos (IG can't be scraped without auth). To show actual posts, the owner drops post images into `images/` and they get swapped in.
