"""Render a test vertical video for the gum script.

2D animated placeholder visuals + Persian captions + espeak-ng Persian voice.
Usage: python3 render.py <font.ttf> <out.mp4>
"""
import math, os, subprocess, sys, tempfile, wave

from PIL import Image, ImageDraw, ImageFont

FONT, OUT = sys.argv[1], sys.argv[2]
W, H, FPS = 720, 1280, 30

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
GAP = 0.35  # seconds of silence after each line

BG = (14, 22, 32)
BODY = (60, 140, 190)
ORGAN = (224, 122, 143)
GUM = (255, 79, 163)
WHITE = (240, 240, 240)
RED = (235, 64, 52)

font_cap = ImageFont.truetype(FONT, 38)
font_big = ImageFont.truetype(FONT, 72)
font_lbl = ImageFont.truetype(FONT, 34)

# ---------- geometry ----------
HEAD = (360, 250, 85)
ESO = [(360, 330), (360, 560)]
STOM = (400, 620)  # stomach centre


def intestine_path():
    pts, rows = [], 4
    for r in range(rows):
        y = 730 + r * 60
        xs = range(250, 471, 10) if r % 2 == 0 else range(470, 249, -10)
        pts += [(x, y + 8 * math.sin(x / 25)) for x in xs]
    pts += [(360, 960), (360, 1010)]
    return pts


GUT = intestine_path()


def along(pts, f):
    f = max(0.0, min(1.0, f))
    segs = [math.dist(a, b) for a, b in zip(pts, pts[1:])]
    d = f * sum(segs)
    for (a, b), s in zip(zip(pts, pts[1:]), segs):
        if d <= s:
            k = d / s if s else 0
            return (a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k)
        d -= s
    return pts[-1]


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def blob(d, c, r, col=GUM):
    d.ellipse([c[0] - r, c[1] - r * 0.8, c[0] + r, c[1] + r * 0.8], fill=col, outline=WHITE, width=2)


def body(d, squeeze=0.0):
    hx, hy, hr = HEAD
    d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], outline=BODY, width=4)
    d.rounded_rectangle([190, 350, 530, 1030], 90, outline=BODY, width=4)
    d.line(ESO, fill=ORGAN, width=18)
    sx, sy = STOM
    k = 1 - 0.18 * squeeze
    d.ellipse([sx - 110 * k, sy - 75 * k, sx + 110 * k, sy + 75 * k], outline=ORGAN, width=8)
    d.line(GUT, fill=ORGAN, width=14, joint="curve")


def label(d, text, xy, col=WHITE, f=font_lbl):
    d.text(xy, text, font=f, fill=col, anchor="mm", direction="rtl", language="fa")


def caption(d, text):
    words, lines, cur = text.split(" "), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=font_cap, direction="rtl", language="fa") > W - 100 and cur:
            lines.append(cur)
            cur = w
        else:
            cur = t
    lines.append(cur)
    lh = 58
    top = H - 110 - lh * len(lines)
    d.rounded_rectangle([30, top - 20, W - 30, H - 90], 24, fill=(0, 0, 0))
    for i, ln in enumerate(lines):
        label(d, ln, (W // 2, top + lh * i + lh // 2 - 6), f=font_cap)


# ---------- scenes: (draw, t in [0,1]) ----------
def s_hook(d, t, T):
    r = 120 + 25 * abs(math.sin(T * 6)) * (1 - t)
    blob(d, (360, 520), r)
    label(d, "آدامس قورت دادی؟", (360, 230), f=font_big)


def s_swallow(d, t, T):
    body(d)
    blob(d, along([(360, 300)] + ESO + [STOM], ease(t)), 26)


def s_acid(d, t, T):
    body(d)
    sx, sy = STOM
    for i in range(14):
        ph = (T * 0.8 + i / 14) % 1
        x = sx - 80 + (i * 37) % 160
        y = sy + 55 - ph * 110
        d.ellipse([x - 6, y - 6, x + 6, y + 6], outline=(150, 230, 120), width=2)
    fade = 1 - 0.55 * t
    blob(d, STOM, 26, tuple(int(c * fade + b * (1 - fade)) for c, b in zip(GUM, (200, 200, 200))))


def s_base(d, t, T):
    body(d)
    blob(d, STOM, 26, (200, 170, 185))
    label(d, "پایهٔ آدامس: هضم‌نشدنی", (360, 470), col=(255, 210, 90))


def s_push(d, t, T):
    sq = abs(math.sin(T * 5))
    body(d, sq)
    c = along([STOM, GUT[0]], ease(t))
    blob(d, c, 24, (200, 170, 185))


def s_gut(d, t, T):
    body(d)
    blob(d, along(GUT, ease(t)), 20, (200, 170, 185))
    days = min(3, int(t * 4))
    label(d, ["روز اول", "روز دوم", "روز سوم", "بیرون!"][days], (360, 470), col=(255, 210, 90))


def s_clump(d, t, T):
    body(d)
    c = (360, 790)
    n = 7
    for i in range(n):
        a = i / n * 2 * math.pi
        rr = 160 * (1 - ease(t)) + 18
        blob(d, (c[0] + rr * math.cos(a), c[1] + rr * math.sin(a) * 0.5), 18)
    if t > 0.6 and int(T * 6) % 2 == 0:
        d.ellipse([c[0] - 70, c[1] - 55, c[0] + 70, c[1] + 55], outline=RED, width=8)
        label(d, "انسداد! (نادر)", (360, 470), col=RED)


def s_end(d, t, T):
    label(d, "۷ سال؟", (360, 380), f=font_big)
    if t > 0.25:
        k = ease((t - 0.25) / 0.3)
        d.line([(230, 300), (230 + 260 * k, 300 + 160 * k)], fill=RED, width=14)
        d.line([(490, 300), (490 - 260 * k, 300 + 160 * k)], fill=RED, width=14)
    blob(d, (360, 650), 60 + 60 * ease(max(0, t - 0.6) / 0.4))


SCENES = [s_hook, s_swallow, s_acid, s_base, s_push, s_gut, s_clump, s_end]


def main():
    tmp = tempfile.mkdtemp()
    durs, wavs = [], []
    for i, line in enumerate(LINES):
        p = os.path.join(tmp, f"l{i}.wav")
        subprocess.run(["espeak-ng", "-v", "fa", "-s", "190", "-w", p, line], check=True)
        with wave.open(p) as w:
            durs.append(w.getnframes() / w.getframerate() + GAP)
        wavs.append(p)

    # build narration track with gaps
    narr = os.path.join(tmp, "narr.wav")
    with wave.open(wavs[0]) as w0:
        params = w0.getparams()
    with wave.open(narr, "wb") as out:
        out.setparams(params)
        for p in wavs:
            with wave.open(p) as w:
                out.writeframes(w.readframes(w.getnframes()))
            out.writeframes(b"\x00" * int(GAP * params.framerate) * params.sampwidth * params.nchannels)

    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", narr,
         "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20",
         "-c:a", "aac", "-b:a", "128k", "-shortest", OUT],
        stdin=subprocess.PIPE)
    T = 0.0
    for scene, line, dur in zip(SCENES, LINES, durs):
        n = int(dur * FPS)
        for f in range(n):
            img = Image.new("RGB", (W, H), BG)
            d = ImageDraw.Draw(img)
            scene(d, f / max(1, n - 1), T)
            caption(d, line)
            ff.stdin.write(img.tobytes())
            T += 1 / FPS
    ff.stdin.close()
    ff.wait()
    print(f"done: {OUT}  duration={sum(durs):.1f}s")


if __name__ == "__main__":
    main()
