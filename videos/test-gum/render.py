"""Render the Persian gum explainer as a polished vertical video.

v2: 1080x1920 @30fps, anti-aliased vector art (cairo), x-ray body with glow,
shaded organs, a moving camera (push-ins / follow / zoom-through), particles,
karaoke-style Persian captions, neural Persian voice (piper), synthesized
music + sound effects with voice ducking.

Usage:
  python3 render.py --font Vazirmatn-Bold.ttf --voice fa_IR-gyro-medium.onnx --out gum.mp4
"""
import argparse, math, os, random, subprocess, tempfile, wave
from multiprocessing import Pool

import cairo
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1080, 1920, 30
GAP, TAIL = 0.28, 0.7

LINES = [
    "این اتفاقیه که برای بدنت می‌افته اگه آدامس قورت بدی.",
    "آدامس از مری سُر می‌خوره و می‌رسه به معده.",
    "اسید معده، شکر و طعمش رو حل می‌کنه.",
    "ولی خودِ پایهٔ آدامس اصلاً هضم نمی‌شه.",
    "پس معده با انقباض‌هاش هُلش می‌ده توی روده.",
    "و معمولاً ظرف چند روز، دست‌نخورده از بدنت بیرون می‌ره.",
    "ولی اگه خیلی زیاد قورت بدی، ممکنه یه توده بسازه و روده رو ببنده.",
    "پس نه، هفت سال توی شکمت نمی‌مونه… ولی عادتش نکن.",
]

# filled in main() before the worker pool forks
G = {}

# ------------------------------------------------------------------ helpers
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return x * x * x * (x * (6 * x - 15) + 10)


def ease_out_back(x, s=1.7):
    x = clamp(x) - 1
    return 1 + x * x * ((s + 1) * x + s)


def lerp(a, b, t):
    return a + (b - a) * t


def lerp3(a, b, t):
    return tuple(lerp(x, y, t) for x, y in zip(a, b))


def rgb(h, a=1.0):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (a,)


# ------------------------------------------------------------------ world geometry (world == 1080x1920 at scale 1)
MOUTH = (540, 470)
ESO = [(540, 470), (540, 560), (538, 700), (548, 820), (590, 905)]
STOM_C = (655, 1010)


def stomach_path(ctx, squeeze=0.0):
    cx, cy = STOM_C
    k = 1 - 0.13 * squeeze
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(k, 1 - 0.07 * squeeze)
    ctx.translate(-cx, -cy)
    ctx.move_to(585, 900)
    ctx.curve_to(720, 850, 820, 975, 770, 1075)
    ctx.curve_to(735, 1150, 600, 1160, 540, 1115)
    ctx.curve_to(505, 1088, 518, 1046, 562, 1050)
    ctx.curve_to(625, 1056, 650, 1000, 590, 955)
    ctx.close_path()
    ctx.restore()


def build_gut():
    pts = [(540, 1115), (520, 1140), (450, 1165)]
    rows, x0, x1, y0, dy, R = 5, 400, 740, 1180, 62, 31
    for r in range(rows):
        y = y0 + r * dy
        a, b = (x0, x1) if r % 2 == 0 else (x1, x0)
        step = 6 if b > a else -6
        for x in range(a, b, step):
            pts.append((x, y + 7 * math.sin(x / 22 + r)))
        if r < rows - 1:  # U-turn
            cx = b
            for i in range(1, 16):
                ang = -math.pi / 2 + math.pi * i / 16
                sgn = 1 if b == x1 else -1
                pts.append((cx + sgn * R * math.cos(ang), y + R + R * math.sin(ang)))
    pts += [(560, y0 + (rows - 1) * dy + 40), (560, 1520), (560, 1600)]
    return pts


GUT = build_gut()


def path_len(pts):
    return [0.0] + list(np.cumsum([math.dist(a, b) for a, b in zip(pts, pts[1:])]))


GUT_L = path_len(GUT)
SWALLOW = [MOUTH] + ESO[1:] + [(640, 960), (660, 1030)]
SWALLOW_L = path_len(SWALLOW)


def along(pts, cum, f):
    d = clamp(f) * cum[-1]
    i = int(np.searchsorted(cum, d, side="right")) - 1
    i = min(max(i, 0), len(pts) - 2)
    s = cum[i + 1] - cum[i]
    k = (d - cum[i]) / s if s else 0
    a, b = pts[i], pts[i + 1]
    return (lerp(a[0], b[0], k), lerp(a[1], b[1], k))


def poly(ctx, pts):
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)


# ------------------------------------------------------------------ drawing primitives (cairo, world space)
def glow_stroke(ctx, color, widths=((34, .05), (20, .10), (10, .22), (4, .7), (2, 1))):
    for w, a in widths:
        ctx.set_source_rgba(*color[:3], a)
        ctx.set_line_width(w)
        ctx.stroke_preserve()
    ctx.new_path()


def body(ctx, T):
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    # silhouette
    ctx.new_path()
    ctx.arc(540, 400, 135, 0, 2 * math.pi)
    ctx.new_sub_path()
    ctx.move_to(485, 520)
    ctx.curve_to(480, 590, 470, 630, 420, 650)
    ctx.curve_to(300, 680, 210, 700, 200, 820)
    ctx.line_to(215, 1250)
    ctx.curve_to(225, 1480, 300, 1600, 380, 1680)
    ctx.line_to(700, 1680)
    ctx.curve_to(780, 1600, 855, 1480, 865, 1250)
    ctx.line_to(880, 820)
    ctx.curve_to(870, 700, 780, 680, 660, 650)
    ctx.curve_to(610, 630, 600, 590, 595, 520)
    ctx.close_path()
    g = cairo.LinearGradient(0, 300, 0, 1700)
    g.add_color_stop_rgba(0, *rgb("#2d8fd0", .22))
    g.add_color_stop_rgba(1, *rgb("#123a66", .30))
    ctx.set_source(g)
    ctx.fill_preserve()
    glow_stroke(ctx, rgb("#7fd3ff"))
    # x-ray hints: spine + ribs
    ctx.set_source_rgba(*rgb("#9fdcff", .10))
    ctx.set_line_width(14)
    ctx.move_to(540, 640)
    ctx.line_to(540, 1500)
    ctx.stroke()
    ctx.set_line_width(7)
    for i in range(7):
        y = 730 + i * 48
        for s in (-1, 1):
            ctx.move_to(540, y)
            ctx.curve_to(540 + s * 150, y - 30, 540 + s * 300, y + 10, 540 + s * 290, y + 70)
            ctx.stroke()
    # eyes (subtle, gives a character feel)
    for ex in (490, 590):
        ctx.set_source_rgba(*rgb("#bfe9ff", .55))
        ctx.arc(ex, 385, 13, 0, 2 * math.pi)
        ctx.fill()


def tube(ctx, pts, w, base, T, flow=0.0):
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for ww, col in ((w + 6, rgb("#5b1d2e")), (w, base), (w * 0.55, lerp3(base[:3], (1, .85, .88), .35) + (1,))):
        poly(ctx, pts)
        ctx.set_source_rgba(*col)
        ctx.set_line_width(ww)
        ctx.stroke()
    # moving peristalsis highlight
    poly(ctx, pts)
    ctx.set_source_rgba(1, 1, 1, .28)
    ctx.set_line_width(w * 0.18)
    ctx.set_dash([w * 0.9, w * 1.4], -flow)
    ctx.stroke()
    ctx.set_dash([])


def stomach(ctx, T, squeeze=0.0, acid=0.0, tint=0.0):
    stomach_path(ctx, squeeze)
    g = cairo.RadialGradient(620, 960, 20, 655, 1010, 190)
    g.add_color_stop_rgba(0, *rgb("#ffb3c1"))
    g.add_color_stop_rgba(.6, *rgb("#e06d88"))
    g.add_color_stop_rgba(1, *rgb("#8e2d4a"))
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.set_source_rgba(*rgb("#4a1424"))
    ctx.set_line_width(7)
    ctx.stroke_preserve()
    if acid > 0:
        ctx.save()
        ctx.clip()
        lvl = 1150 - 120 * acid
        ctx.move_to(480, 1200)
        for x in range(480, 840, 8):
            ctx.line_to(x, lvl + 7 * math.sin(x / 26 + T * 4))
        ctx.line_to(840, 1200)
        ctx.close_path()
        ctx.set_source_rgba(*rgb("#c9f06a", .45))
        ctx.fill()
        rnd = random.Random(7)
        for i in range(26):
            ph = (T * (0.35 + rnd.random() * .4) + rnd.random()) % 1
            x = rnd.uniform(560, 770) + 6 * math.sin(T * 3 + i)
            y = lvl + 60 - ph * 140
            r = 4 + rnd.random() * 9
            ctx.arc(x, y, r, 0, 2 * math.pi)
            ctx.set_source_rgba(*rgb("#eaffb0", .55 * (1 - ph)))
            ctx.set_line_width(2.5)
            ctx.stroke()
        ctx.restore()
    else:
        ctx.new_path()
    # inner folds (rugae)
    ctx.save()
    stomach_path(ctx, squeeze)
    ctx.clip()
    ctx.set_source_rgba(*rgb("#7a2240", .35))
    ctx.set_line_width(4)
    for i in range(5):
        ctx.move_to(570, 950 + i * 38)
        ctx.curve_to(640, 930 + i * 38, 700, 980 + i * 38, 790, 950 + i * 38)
        ctx.stroke()
    ctx.restore()
    if tint:
        stomach_path(ctx, squeeze)
        ctx.set_source_rgba(1, .2, .2, .25 * tint)
        ctx.fill()


def gum(ctx, c, r, T, digested=0.0, wobble=1.0, alpha=1.0):
    x, y = c
    sx = 1 + 0.08 * wobble * math.sin(T * 9)
    sy = 1 - 0.08 * wobble * math.sin(T * 9)
    base = lerp3(rgb("#ff3d9a")[:3], rgb("#d9b3c4")[:3], digested)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(sx, sy * 0.82)
    # shadow
    ctx.arc(r * .12, r * .22, r * 1.02, 0, 2 * math.pi)
    ctx.set_source_rgba(0, 0, 0, .35 * alpha)
    ctx.fill()
    g = cairo.RadialGradient(-r * .35, -r * .4, r * .1, 0, 0, r * 1.1)
    g.add_color_stop_rgba(0, *lerp3(base, (1, 1, 1), .55), alpha)
    g.add_color_stop_rgba(.55, *base, alpha)
    g.add_color_stop_rgba(1, *lerp3(base, (0.25, 0, 0.1), .55), alpha)
    ctx.arc(0, 0, r, 0, 2 * math.pi)
    ctx.set_source(g)
    ctx.fill()
    # tooth marks / chewed creases
    ctx.set_source_rgba(*lerp3(base, (0.3, 0, 0.1), .5), .5 * alpha)
    ctx.set_line_width(r * .07)
    for i in range(3):
        ctx.arc(-r * .2 + i * r * .25, r * .1, r * .35, 0.3, 1.2)
        ctx.stroke()
    ctx.arc(-r * .38, -r * .42, r * .18, 0, 2 * math.pi)
    ctx.set_source_rgba(1, 1, 1, .7 * alpha)
    ctx.fill()
    ctx.restore()


def glow(ctx, c, r, color, a):
    g = cairo.RadialGradient(c[0], c[1], 0, c[0], c[1], r)
    g.add_color_stop_rgba(0, *color[:3], a)
    g.add_color_stop_rgba(1, *color[:3], 0)
    ctx.set_source(g)
    ctx.arc(c[0], c[1], r, 0, 2 * math.pi)
    ctx.fill()


# ------------------------------------------------------------------ scenes
# each returns (camera=(cx, cy, scale), draw_fn(ctx), labels=[(text, world_xy, appear_t, color)])
def sc_hook(t, T, d):
    cam = (540, 470, lerp(2.6, 2.1, ease(t)))
    pop = ease_out_back(t * 3)

    def draw(ctx):
        body(ctx, T)
        glow(ctx, MOUTH, 120, rgb("#ff3d9a"), .5)
        gum(ctx, MOUTH, 48 * pop, T)
    return cam, draw, [], {"title": ("آدامس قورت دادی؟", pop)}


def sc_swallow(t, T, d):
    p = along(SWALLOW, SWALLOW_L, ease(t))
    cam_end = (590, 860, 1.05)
    k = ease(t)
    cam = (lerp(540, cam_end[0], k), lerp(470, cam_end[1], k), lerp(2.1, cam_end[2], k))

    def draw(ctx):
        body(ctx, T)
        tube(ctx, ESO, 30, rgb("#d9607c"), T, flow=T * 80)
        stomach(ctx, T)
        tube(ctx, GUT, 24, rgb("#d06a86"), T, flow=T * 40)
        for i in range(1, 6):  # motion trail
            q = along(SWALLOW, SWALLOW_L, ease(max(0, t - i * 0.02)))
            gum(ctx, q, 20, T, alpha=.12)
        gum(ctx, p, 22, T)
    return cam, draw, [("مری", (470, 680), .25, "#9fdcff"), ("معده", (800, 900), .7, "#9fdcff")], {}


def sc_acid(t, T, d):
    k = ease(t)
    cam = (lerp(590, 660, k), lerp(860, 1020, k), lerp(1.05, 2.5, k))
    c = (660, 1030)

    def draw(ctx):
        body(ctx, T)
        tube(ctx, ESO, 30, rgb("#d9607c"), T, flow=T * 80)
        tube(ctx, GUT, 24, rgb("#d06a86"), T, flow=T * 40)
        stomach(ctx, T, acid=ease(t * 1.5))
        gum(ctx, c, 22, T, digested=.55 * t, wobble=.6)
        rnd = random.Random(3)  # sugar & flavour escaping
        for i in range(30):
            ph = (t * 1.4 + rnd.random()) % 1
            ang = rnd.uniform(0, 2 * math.pi)
            r = 20 + ph * 70
            ctx.arc(c[0] + r * math.cos(ang), c[1] + r * math.sin(ang) * .8, 2.6, 0, 2 * math.pi)
            ctx.set_source_rgba(*rgb("#ffe27a", (1 - ph) * .9 * clamp(t * 4)))
            ctx.fill()
    return cam, draw, [("اسید معده", (720, 1110), .2, "#c9f06a"), ("شکر و طعم", (590, 960), .5, "#ffe27a")], {}


def sc_base(t, T, d):
    cam = (660, 1030, lerp(2.5, 2.9, ease(t)))
    c = (660, 1030)

    def draw(ctx):
        body(ctx, T)
        tube(ctx, ESO, 30, rgb("#d9607c"), T)
        tube(ctx, GUT, 24, rgb("#d06a86"), T)
        stomach(ctx, T, acid=1)
        glow(ctx, c, 70, rgb("#ffd25a"), .35 + .2 * math.sin(T * 6))
        gum(ctx, c, 22, T, digested=.55, wobble=.2)
        # "shield" ring = can't be digested
        ctx.arc(c[0], c[1], 32 + 3 * math.sin(T * 8), 0, 2 * math.pi)
        ctx.set_source_rgba(*rgb("#ffd25a", .9 * ease(t * 3)))
        ctx.set_line_width(3)
        ctx.stroke()
    return cam, draw, [("پایهٔ آدامس: هضم‌نشدنی", (660, 975), .1, "#ffd25a")], {"freeze": t < .12}


def sc_push(t, T, d):
    k = ease(t)
    gp = along([(660, 1030), (600, 1080), (540, 1115)] + GUT[:12], path_len([(660, 1030), (600, 1080), (540, 1115)] + GUT[:12]), ease(t))
    cam = (lerp(660, gp[0], k), lerp(1030, gp[1], k), lerp(2.9, 1.9, k))
    sq = abs(math.sin(T * 5.5))

    def draw(ctx):
        body(ctx, T)
        tube(ctx, ESO, 30, rgb("#d9607c"), T)
        tube(ctx, GUT, 24, rgb("#d06a86"), T, flow=T * 60)
        stomach(ctx, T, squeeze=sq, acid=1)
        gum(ctx, gp, 18, T, digested=.55)
    return cam, draw, [("انقباض", (790, 960), .15, "#ff9db3")], {"shake": sq * 3}


def sc_gut(t, T, d):
    f = lerp(0.04, 1.0, ease(t))
    gp = along(GUT, GUT_L, f)
    cam = (lerp(gp[0], 560, .35), gp[1], lerp(1.9, 1.15, ease(t)))
    day = ["روز اول", "روز دوم", "روز سوم", "بیرون!"][min(3, int(t * 4))]

    def draw(ctx):
        body(ctx, T)
        tube(ctx, ESO, 30, rgb("#d9607c"), T)
        stomach(ctx, T)
        tube(ctx, GUT, 24, rgb("#d06a86"), T, flow=T * 90)
        rnd = random.Random(5)  # food particles flowing with it
        for i in range(14):
            q = along(GUT, GUT_L, clamp(f - 0.02 - i * 0.012 + rnd.uniform(-.004, .004)))
            ctx.arc(q[0], q[1], 4, 0, 2 * math.pi)
            ctx.set_source_rgba(*rgb("#f3c48b", .8))
            ctx.fill()
        gum(ctx, gp, 15, T, digested=.55)
    return cam, draw, [], {"badge": day}


def sc_clump(t, T, d):
    c = along(GUT, GUT_L, 0.45)
    cam = (c[0], c[1], lerp(1.3, 2.2, ease(t)))
    alarm = t > .55

    def draw(ctx):
        body(ctx, T)
        tube(ctx, ESO, 30, rgb("#d9607c"), T)
        stomach(ctx, T)
        tube(ctx, GUT, 24, rgb("#d06a86"), T, flow=0 if alarm else T * 60)
        if alarm:
            glow(ctx, c, 170, rgb("#ff2b2b"), .75 * (0.75 + 0.25 * math.sin(T * 12)))
        n = 8
        for i in range(n):
            src = along(GUT, GUT_L, clamp(0.45 + (i - n / 2) * 0.05))
            k = ease(t * 1.6)
            ang = i / n * 2 * math.pi
            dst = (c[0] + 22 * math.cos(ang), c[1] + 16 * math.sin(ang))
            gum(ctx, (lerp(src[0], dst[0], k), lerp(src[1], dst[1], k)), 18, T + i, digested=.2)
    return cam, draw, ([("انسداد روده (نادر)", (c[0], c[1] - 70), .55, "#ff5a5a")]), {"shake": 6 if alarm else 0}


def sc_end(t, T, d):
    cam = (540, 470, lerp(1.8, 2.3, ease(t)))
    pop = ease_out_back(clamp((t - .55) * 3))

    def draw(ctx):
        body(ctx, T)
        if pop > 0:
            glow(ctx, MOUTH, 120, rgb("#ff3d9a"), .5 * pop)
            gum(ctx, MOUTH, 44 * pop, T)
    return cam, draw, [], {"seven": t}


SCENES = [sc_hook, sc_swallow, sc_acid, sc_base, sc_push, sc_gut, sc_clump, sc_end]


# ------------------------------------------------------------------ text overlay (PIL, screen space)
_fonts = {}


def font(sz):
    sz = max(8, int(sz))
    if sz not in _fonts:
        _fonts[sz] = ImageFont.truetype(G["font"], sz)
    return _fonts[sz]


def tw(d, s, f):
    return d.textlength(s, font=f, direction="rtl", language="fa")


def text(d, s, xy, f, fill, anchor="mm", stroke=0):
    d.text(xy, s, font=f, fill=fill, anchor=anchor, direction="rtl", language="fa",
           stroke_width=stroke, stroke_fill=(0, 0, 0, 220))


def hexa(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


def caption(ov, d, line, prog):
    f = font(60)
    words = line.split(" ")
    lines, cur = [], []
    for w in words:
        if cur and tw(d, " ".join(cur + [w]), f) > W - 170:
            lines.append(cur)
            cur = [w]
        else:
            cur.append(w)
    lines.append(cur)
    # word timing proportional to character count
    lens = [len(w) for w in words]
    tot = sum(lens)
    spoken = prog * tot
    lh = 88
    box_h = lh * len(lines) + 50
    top = H - 260 - box_h
    d.rounded_rectangle([60, top, W - 60, top + box_h], 36, fill=(8, 12, 20, 175))
    idx, acc = 0, 0
    sp = tw(d, " ", f)
    for li, ws in enumerate(lines):
        widths = [tw(d, w, f) for w in ws]
        x = W / 2 + (sum(widths) + sp * (len(ws) - 1)) / 2
        y = top + 25 + lh * li + lh / 2
        for w, wd in zip(ws, widths):
            start, end = acc, acc + lens[idx]
            if spoken >= end:
                col = (255, 255, 255, 255)
            elif spoken >= start:
                col = hexa("#ffd25a")
            else:
                col = (255, 255, 255, 95)
            text(d, w, (x, y), f, col, anchor="rm", stroke=3)
            x -= wd + sp
            acc = end
            idx += 1


def world_to_screen(p, cam):
    cx, cy, s = cam
    return (W / 2 + (p[0] - cx) * s, H / 2 + (p[1] - cy) * s)


def label(d, s, xy, appear, col):
    if appear <= 0:
        return
    a = ease(appear)
    f = font(46)
    x, y = xy[0], xy[1] - 30 * (1 - a)
    wdt = tw(d, s, f) + 56
    x = clamp(x, wdt / 2 + 30, W - wdt / 2 - 30)
    y = clamp(y, 120, H - 520)
    c = hexa(col, int(255 * a))
    d.rounded_rectangle([x - wdt / 2, y - 38, x + wdt / 2, y + 38], 38, fill=(10, 14, 24, int(200 * a)), outline=c, width=4)
    text(d, s, (x, y), f, (255, 255, 255, int(255 * a)))


# ------------------------------------------------------------------ frame render
def scene_at(T):
    st = G["starts"]
    i = max(0, int(np.searchsorted(st, T, side="right")) - 1)
    i = min(i, len(SCENES) - 1)
    dur = (st[i + 1] if i + 1 < len(st) else G["total"]) - st[i]
    return i, (T - st[i]) / dur, dur


def render(fi):
    T = fi / FPS
    i, t, dur = scene_at(T)
    cam, draw, labels, extra = SCENES[i](t, T, dur)

    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    # background
    g = cairo.RadialGradient(W / 2, H * .42, 50, W / 2, H * .5, H * .8)
    g.add_color_stop_rgb(0, *rgb("#16324a")[:3])
    g.add_color_stop_rgb(1, *rgb("#05080f")[:3])
    ctx.set_source(g)
    ctx.paint()
    rnd = random.Random(11)
    for k in range(70):  # drifting dust
        x = (rnd.uniform(0, W) + T * rnd.uniform(-8, 8)) % W
        y = (rnd.uniform(0, H) - T * rnd.uniform(5, 25)) % H
        ctx.arc(x, y, rnd.uniform(1, 3.2), 0, 2 * math.pi)
        ctx.set_source_rgba(.6, .85, 1, rnd.uniform(.05, .25))
        ctx.fill()

    shake = extra.get("shake", 0)
    ctx.save()
    ctx.translate(W / 2 + shake * math.sin(T * 47), H / 2 + shake * math.cos(T * 53))
    ctx.scale(cam[2], cam[2])
    ctx.translate(-cam[0], -cam[1])
    draw(ctx)
    ctx.restore()

    # vignette
    v = cairo.RadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .75)
    v.add_color_stop_rgba(0, 0, 0, 0, 0)
    v.add_color_stop_rgba(1, 0, 0, 0, .65)
    ctx.set_source(v)
    ctx.paint()

    # scene-cut flash
    since = T - G["starts"][i]
    if i > 0 and since < 0.18 and i in (1, 7):
        ctx.set_source_rgba(1, 1, 1, .55 * (1 - since / .18))
        ctx.paint()

    surf.flush()
    img = Image.frombuffer("RGBA", (W, H), bytes(surf.get_data()), "raw", "BGRA", 0, 1).convert("RGBA")
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)

    for s, wp, at, col in labels:
        label(d, s, world_to_screen(wp, cam), (t - at) * 4, col)
    if "title" in extra:
        s, pop = extra["title"]
        if pop > 0:
            text(d, s, (W / 2, 330), font(118 * pop), (255, 255, 255, 255), stroke=6)
    if "badge" in extra:
        f = font(54)
        s = extra["badge"]
        wd = tw(d, s, f) + 70
        d.rounded_rectangle([W / 2 - wd / 2, 190, W / 2 + wd / 2, 290], 50, fill=hexa("#ffd25a", 235))
        text(d, s, (W / 2, 240), f, (20, 20, 30, 255))
    if "seven" in extra:
        tt = extra["seven"]
        a = ease(tt * 4)
        text(d, "۷ سال؟", (W / 2, 330), font(150), (255, 255, 255, int(255 * a)), stroke=6)
        k = ease((tt - .25) / .25)
        if k > 0:
            for (x0, y0, x1, y1) in ((330, 220, 750, 440), (750, 220, 330, 440)):
                d.line([(x0, y0), (lerp(x0, x1, k), lerp(y0, y1, k))], fill=hexa("#ff3b3b", 200), width=12)
    if extra.get("freeze"):
        d.rectangle([0, 0, W, H], outline=(255, 255, 255, 160), width=14)

    # caption tracks the spoken line (voice starts at scene start)
    vd = G["voice_durs"][i]
    caption(ov, d, LINES[i], clamp((T - G["starts"][i]) / max(vd, .1)))

    img.alpha_composite(ov)
    return img.convert("RGB").tobytes()


# ------------------------------------------------------------------ audio
SR = 22050


def tts(voice, line, path):
    subprocess.run(["python3", "-m", "piper", "-m", voice, "-f", path, "--length-scale", "1.0",
                    "--sentence-silence", "0"], input=line.encode(), check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with wave.open(path) as w:
        sr = w.getframerate()
        a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    if sr != SR:  # simple resample
        a = np.interp(np.linspace(0, len(a), int(len(a) * SR / sr), endpoint=False), np.arange(len(a)), a)
    # trim leading/trailing silence
    nz = np.where(np.abs(a) > 0.01)[0]
    return a[max(0, nz[0] - 200): nz[-1] + 800] if len(nz) else a


def env(n, attack=0.005, decay=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-t / decay)


def sfx_hit(n=int(SR * 1.2)):
    t = np.arange(n) / SR
    f = 40 + 110 * np.exp(-t * 18)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .002, .35)


def noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n)


def lowpass(x, a):
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):
        acc += a * (v - acc)
        y[i] = acc
    return y


def sfx_whoosh(n=int(SR * .6), seed=1):
    t = np.linspace(0, 1, n)
    return lowpass(noise(n, seed), .08) * np.sin(np.pi * t) ** 2 * 3


def sfx_gulp():
    n = int(SR * .35)
    t = np.arange(n) / SR
    f = 320 - 220 * t / t[-1]
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, .01, .12) * .8


def sfx_bubbles(dur, seed=2):
    n = int(SR * dur)
    out = np.zeros(n)
    rng = np.random.default_rng(seed)
    for _ in range(int(dur * 9)):
        s = rng.integers(0, max(1, n - 3000))
        m = 2500
        t = np.arange(m) / SR
        f = rng.uniform(500, 1100) * (1 + t * 6)
        out[s:s + m] += np.sin(2 * np.pi * np.cumsum(f) / SR) * env(m, .002, .025) * .35
    return out


def sfx_ding():
    n = int(SR * .8)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1320 * t) + .5 * np.sin(2 * np.pi * 1980 * t)) * env(n, .002, .25) * .35


def sfx_alarm(dur):
    n = int(SR * dur)
    t = np.arange(n) / SR
    gate = (np.sin(2 * np.pi * 3 * t) > 0).astype(float)
    return np.sign(np.sin(2 * np.pi * 620 * t)) * gate * .08


def music(total):
    n = int(SR * total)
    t = np.arange(n) / SR
    bpm = 100
    beat = 60 / bpm
    chords = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]  # Am F C G
    out = np.zeros(n)
    bar = beat * 4
    for ci in range(int(total / bar) + 1):
        notes = chords[ci % 4]
        s, e = int(ci * bar * SR), min(n, int((ci + 1) * bar * SR))
        if s >= n:
            break
        tt = t[s:e] - ci * bar
        seg = np.zeros(e - s)
        for m in notes:
            fr = 440 * 2 ** ((m - 69) / 12)
            for h in (1, 2, 3):
                seg += np.sin(2 * np.pi * fr * h * tt + h) / (h * 1.8)
            seg += .6 * np.sin(2 * np.pi * fr / 2 * tt)  # bass octave
        fade = np.minimum(1, np.minimum(tt / .3, (bar - tt) / .3))
        out[s:e] += seg * fade * .05
    # soft kick + hats
    for b in range(int(total / beat)):
        s = int(b * beat * SR)
        k = sfx_hit(int(SR * .3)) * .25
        out[s:s + len(k)] += k[: n - s]
        hs = int((b + .5) * beat * SR)
        hn = int(SR * .05)
        if hs + hn < n:
            out[hs:hs + hn] += np.diff(noise(hn + 1, b)) * env(hn, .001, .01) * .04
    return out


def build_audio(path, voices, starts, total):
    n = int(SR * total) + SR
    voice = np.zeros(n)
    for v, s in zip(voices, starts):
        i = int(s * SR)
        voice[i:i + len(v)] += v
    fx = np.zeros(n)

    def put(x, at, g=1.0):
        i = int(at * SR)
        fx[i:i + len(x)] += x[: n - i] * g

    st = starts
    put(sfx_hit(), 0, .9)
    put(sfx_whoosh(seed=4), st[1] - .2, .5)
    put(sfx_gulp(), st[1] + .25, .9)
    put(sfx_bubbles(st[3] - st[2]), st[2], .8)
    put(sfx_ding(), st[3] + .05, .9)
    put(sfx_whoosh(seed=6), st[4] + .1, .6)
    for k in range(4):
        put(sfx_ding() * .45, st[5] + k * (st[6] - st[5]) / 4)
    put(sfx_alarm((st[7] - st[6]) * .45), st[6] + (st[7] - st[6]) * .55, 1)
    put(sfx_whoosh(seed=8), st[7] - .25, .6)
    put(sfx_hit(), st[7], .8)

    mus = np.zeros(n)
    m = music(total)
    mus[: len(m)] = m
    # duck music under voice
    e = lowpass(np.abs(voice), .002) * 6
    duck = 1 - 0.6 * np.clip(e, 0, 1)
    mix = voice * 1.0 + fx * .55 + mus * duck
    mix /= max(1e-6, np.max(np.abs(mix))) / 0.89
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())


# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--font", required=True)
    ap.add_argument("--voice", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--preview", type=float, nargs="*", help="only write PNG stills at these times (s)")
    a = ap.parse_args()

    tmp = tempfile.mkdtemp()
    voices = [tts(a.voice, ln, os.path.join(tmp, f"v{i}.wav")) for i, ln in enumerate(LINES)]
    vd = [len(v) / SR for v in voices]
    starts = list(np.cumsum([0] + [d + GAP for d in vd[:-1]]))
    total = starts[-1] + vd[-1] + TAIL
    G.update(font=a.font, starts=starts, total=total, voice_durs=vd)
    print(f"total {total:.1f}s, lines: " + ", ".join(f"{d:.1f}" for d in vd))

    if a.preview:
        for s in a.preview:
            Image.frombytes("RGB", (W, H), render(int(s * FPS))).save(f"{a.out}_{s:05.1f}.png")
        return

    audio = os.path.join(tmp, "mix.wav")
    build_audio(audio, voices, starts, total)
    nfr = int(total * FPS)
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
         "-r", str(FPS), "-i", "-", "-i", audio,
         "-c:v", "libx264", "-preset", "slow", "-crf", "18", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
         "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
         "-shortest", a.out], stdin=subprocess.PIPE)
    with Pool(os.cpu_count()) as pool:
        for k, fr in enumerate(pool.imap(render, range(nfr), chunksize=4)):
            ff.stdin.write(fr)
            if k % 150 == 0:
                print(f"frame {k}/{nfr}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("done", a.out)


if __name__ == "__main__":
    main()
