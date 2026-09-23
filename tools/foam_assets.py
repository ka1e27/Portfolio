"""Build the landing page's foam-case assets from the site's own images.

    python tools/foam_assets.py        (run from the repo root)

Writes images/web/foam/, for the landing page's first-screen tool case:
  <name>.png + <name>-pocket.png   a trimmed CAD cutout and its matching foam
                                   pocket on the same canvas, so the two <img>s
                                   stack exactly
  boat-slot.jpg, combat-slot.jpg   photo cards for the rectangular card slots
and images/web/dreams-v1-dock-wide.jpg, the boat case study's hero crop.

The pocket is the object's silhouette dilated a few px, with a finger-pull
notch seated on a real edge, a hard cut edge, and a shadow thrown mainly by
the top wall (light from above). That directionality is what makes it read
as a cut instead of a red glow.
"""
from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageOps
from collections import deque
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'images', 'web')
OUT = os.path.join(SRC, 'foam')
os.makedirs(OUT, exist_ok=True)

FLOOR = (176, 14, 38)   # the red bottom layer of the foam
DARK_FLOOR = (40, 40, 44)   # for parts that are red themselves, which vanish on red
PAD = 44                # canvas margin so dilation and the notch never clip


def flood_white_to_alpha(im, t=234):
    """Clear only the white connected to the border, so interior whites survive."""
    im = im.convert('RGBA'); w, h = im.size; px = im.load()
    nw = lambda p: p[0] >= t and p[1] >= t and p[2] >= t
    seen = bytearray(w * h); q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if nw(px[x, y]) and not seen[y * w + x]: seen[y * w + x] = 1; q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if nw(px[x, y]) and not seen[y * w + x]: seen[y * w + x] = 1; q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not seen[ny * w + nx] and nw(px[nx, ny]):
                seen[ny * w + nx] = 1; q.append((nx, ny))
    for i in range(w * h):
        if seen[i]: px[i % w, i // w] = (0, 0, 0, 0)
    return im


def object_and_pocket(name, src, box, white_bg=False, notch='bottom', floor=FLOOR, notch_r=21):
    im = Image.open(os.path.join(SRC, src)).convert('RGBA')
    if white_bg:
        im = flood_white_to_alpha(im)
    # renders were anti-aliased against white, which halos on black foam
    a = im.split()[-1]
    hard = a.point(lambda v: 255 if v > 28 else 0).filter(ImageFilter.MinFilter(3))
    im.putalpha(ImageChops.multiply(a, hard))
    im = im.crop(im.getbbox())
    im.thumbnail(box, Image.LANCZOS)

    W, H = im.width + 2 * PAD, im.height + 2 * PAD
    obj = Image.new('RGBA', (W, H), (0, 0, 0, 0)); obj.paste(im, (PAD, PAD), im)
    m = obj.split()[-1].point(lambda v: 255 if v > 60 else 0)
    pocket = m.filter(ImageFilter.MaxFilter(19))                 # ~9px clearance at 2x

    # seat the finger notch on a real edge: a bbox's bottom-centre is empty
    # space on a twin hull or a plane, which leaves the notch floating
    bx0, by0, bx1, by1 = m.getbbox(); pp = pocket.load(); best = None
    if notch == 'bottom':
        for x in range(bx0 + (bx1 - bx0) // 4, bx1 - (bx1 - bx0) // 4):
            for y in range(H - 1, -1, -1):
                if pp[x, y]:
                    if best is None or y > best[1]: best = (x, y)
                    break
        cx, cy = best[0], best[1] - 4
    else:
        for y in range(by0 + (by1 - by0) // 4, by1 - (by1 - by0) // 4):
            for x in range(W - 1, -1, -1):
                if pp[x, y]:
                    if best is None or x > best[0]: best = (x, y)
                    break
        cx, cy = best[0] - 4, best[1]
    notch_mask = Image.new('L', (W, H), 0); r = notch_r
    ImageDraw.Draw(notch_mask).ellipse((cx - r, cy - r, cx + r, cy + r), fill=255)
    pocket = ImageChops.lighter(pocket, notch_mask)
    pocket = pocket.filter(ImageFilter.GaussianBlur(1.4)).point(lambda v: 255 if v > 127 else 0)

    inner = pocket.filter(ImageFilter.MinFilter(9))
    band = ImageChops.subtract(pocket, inner).filter(ImageFilter.GaussianBlur(2.5))
    crescent = ImageChops.subtract(pocket, ImageChops.offset(pocket, 0, 15)).filter(ImageFilter.GaussianBlur(3.5))
    scoop = ImageChops.multiply(notch_mask, ImageChops.invert(m)).filter(ImageFilter.GaussianBlur(4))
    dark = ImageChops.add(ImageChops.add(band.point(lambda v: int(v * .30)), crescent.point(lambda v: int(v * .62))),
                          scoop.point(lambda v: int(v * .38)))
    shade = dark.point(lambda v: 255 - min(225, v))
    floor = ImageChops.multiply(Image.new('RGB', (W, H), floor), Image.merge('RGB', (shade, shade, shade)))
    pk = floor.convert('RGBA'); pk.putalpha(pocket)

    # the black top layer's cut edge catching light, brightest on the bottom walls
    rim = ImageChops.subtract(pocket.filter(ImageFilter.MaxFilter(5)), pocket)
    lit = ImageChops.subtract(ImageChops.offset(pocket, 0, 3), pocket)
    edge = Image.new('RGBA', (W, H), (255, 255, 255, 0))
    edge.putalpha(ImageChops.lighter(rim.point(lambda v: int(v * .07)), lit.point(lambda v: int(v * .20))))
    pk = Image.alpha_composite(edge, pk)

    obj.save(os.path.join(OUT, f'{name}.png'), optimize=True)
    pk.save(os.path.join(OUT, f'{name}-pocket.png'), optimize=True)
    print(f'{name:9s} {W}x{H}')
    return W, H


def photo_slot(name, src, box, size):
    """Crop a photo card for a rectangular slot. box = (left, top, right, bottom)."""
    im = ImageOps.exif_transpose(Image.open(os.path.join(SRC, src))).convert('RGB')
    im = im.crop(box).resize(size, Image.LANCZOS)
    im.save(os.path.join(OUT, f'{name}.jpg'), quality=84, optimize=True, progressive=True)
    print(f'{name:9s} {size[0]}x{size[1]}  from {src}')


if __name__ == '__main__':
    object_and_pocket('gearbox', 'arm-gearbox-assembly.png', (420, 360), white_bg=True)
    object_and_pocket('maze', 'maze-cad.png', (430, 300))
    object_and_pocket('sewing', 'sewing-corner.png', (300, 300), notch='side')
    object_and_pocket('plane', 'plane-v1.png', (900, 300))
    # the boat sits mid-frame (y ~830-1320 of 2000); 3:2 around it keeps the water behind
    photo_slot('boat-slot', 'dreams-v1-lake.jpg', (60, 690, 1260, 1490), (1200, 800))
    photo_slot('combat-slot', 'combat-card.jpg', (0, 83, 2000, 1417), (1200, 800))
    # The boat case study's hero. Its title block puts the image ~620px down, so
    # only the top ~280px clears a 900px screen; a 2:1 crop from just above the
    # bollard means the boat, not the marina, shows before scrolling.
    photo_slot('../dreams-v1-dock-wide', 'dreams-v1-lake.jpg', (0, 790, 1500, 1540), (1500, 750))
