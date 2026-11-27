---
name: zack-d-film
description: Use when the user wants a short-form vertical video script (YouTube Shorts, TikTok, Reels) in the style of fast 3D-animated explainers — "what happens if…", "how does X work", "why you should never…" — with a hard hook, second-person POV, a visual beat sheet for the animator, and narration timed to 30–60 seconds. Triggers on "zack-d-film", "zack d film style", "3D explainer short", "shorts script", "what happens to your body if", "Persian shorts script", "فیلم‌نامه کوتاه", "ویدیو کوتاه".
---

# Zack-D-Film Style Short Script

Produce a ready-to-animate script for a 30–60 second vertical 3D explainer.
The genre: a realistic-but-stylized 3D character (often "you") experiences
something surprising, gross, dangerous or fascinating, while a calm, fast
narrator explains the science/mechanism beat by beat.

Write original scripts. Borrow the *format* (pacing, structure, POV, visual
language), never another creator's specific scripts, characters, branding
or catchphrases.

## Inputs

Ask only if missing and not inferable:
- **Topic** (required). If the user gives only a theme, propose 3 hook angles and pick the strongest unless they want to choose.
- **Length**: default 45 s (~110–130 spoken words). 30 s ≈ 75–85 words, 60 s ≈ 150–165 words.
- **Language**: default **Persian (Farsi)**. Write everything the user sees (title, narration, on-screen text, visual notes, fact-check, alt hooks, section headings) in Persian. Switch to another language only if the user asks.

## Persian writing rules

- Narration is **spoken, informal Persian (محاوره‌ای)**: «می‌افته»، «اگه»، «یه»، «نمی‌دونی». It must sound natural read aloud by a voice actor. Avoid stiff written/literary Persian.
- On-screen text and the title may be standard written Persian (کتابی), short and clear.
- Use correct half-spaces (نیم‌فاصله, U+200C): «می‌شه»، «خونه‌ها»، «نمی‌دونی».
- Use Persian digits (۰–۹) in narration and on-screen text; keep timecodes (0:00–0:02) in Latin digits so editors can read them.
- Use Persian punctuation: «،» «؛» «؟» and guillemets « ».
- Prefer common Persian words over Arabic-heavy or English loanwords; keep scientific terms the audience knows (e.g. «معده»، «اسید»، «سلول»).
- Word counts: Persian narration runs at about 2.3–2.6 words per second. 30 s ≈ 70–80 words, 45 s ≈ 105–120 words, 60 s ≈ 140–155 words.

## Core rules

1. **Hook in the first 1.5 seconds.** First line is a premise or a shocking claim, never a greeting or a setup. Patterns:
   - "This is what happens to your body if you ___."
   - "If you ever ___, never ___."
   - "This man ___ — and here's why he survived."
   - "Here's why ___ is actually ___."

   Persian equivalents (preferred):
   - «این اتفاقیه که برای بدنت می‌افته اگه ___.»
   - «اگه یه روز ___، هیچ‌وقت ___.»
   - «این مرد ___ — و این دلیلیه که زنده موند.»
   - «می‌دونستی ___ در واقع ___؟»
2. **Second person, present tense.** "You swallow the gum. It slides down your esophagus…" The viewer *is* the character.
3. **One idea per shot, one shot every 1.5–3 s.** Each narration sentence maps to one visual. No sentence longer than ~14 words.
4. **Show the inside.** The signature visual move is the cutaway: x-ray, cross-section, zoom into organs/cells/mechanisms. Use at least two.
5. **Escalate.** Each beat raises stakes or reveals a deeper layer (surface → inside → consequence → twist).
6. **Accuracy first.** State only mechanisms you are confident are true. Soften uncertain claims ("can", "may", "in rare cases"). Never invent statistics. Add a short `Fact check` list of claims an editor should verify.
7. **No gratuitous gore.** Medical/injury topics are fine, but keep it educational: stylized, cutaway, no lingering on suffering. Never give actionable instructions for harming people.
8. **Payoff ending.** End on a twist, a "so next time…" practical tip, or a loop line that flows back into the hook for rewatches. No "like and subscribe".

## Structure (45 s template)

| Time | Beat | Purpose |
|------|------|---------|
| 0–2 s | HOOK | Premise + striking image |
| 2–10 s | SETUP | Character does the thing |
| 10–25 s | MECHANISM | Cutaway: what's happening inside, step by step |
| 25–38 s | ESCALATION | Worst case / surprising consequence |
| 38–45 s | PAYOFF | Twist, tip, or loop line |

## Output format

Write the whole output in Persian (headings included):

```
# <عنوان — حداکثر ۶ کلمه، کنجکاوی‌برانگیز>

**مدت:** ~۴۵ ثانیه · **تعداد کلمات:** <n> · **زاویهٔ قلاب:** <یک خط>

## فیلم‌نامه

| # | زمان | تصویر (برای انیمیتور) | گوینده | افکت صوتی / موسیقی |
|---|------|------------------------|--------|---------------------|
| ۱ | 0:00–0:02 | نمای خیلی نزدیک: ... | «...» | ضربهٔ بیس |
| ۲ | ... | ... | «...» | ... |

## متن گوینده (برای ضبط صدا)
<همهٔ جمله‌های گوینده به ترتیب، هر جمله در یک خط>

## متن روی تصویر
<۱ تا ۳ نوشتهٔ کوتاه، در صورت نیاز>

## بررسی صحت اطلاعات
- <ادعا> — <چه چیزی باید بررسی شود>

## قلاب‌های جایگزین
۱. ...
۲. ...
۳. ...
```

## Visual vocabulary (use in the Visual column)

- Camera: extreme close-up, slow push-in, whip pan, top-down, POV shot, orbit.
- Cutaways: x-ray body, translucent skin, organ cross-section, cellular zoom, mechanical cutaway of an object.
- Style notes: clean 3D, soft studio lighting, neutral background, realistic-but-smooth characters, slow-motion on the key moment.
- Transitions: match cut on shape, zoom-through (into the body), freeze frame + label.

## Quality checklist (run before replying)

- [ ] Everything is in natural Persian; narration is conversational, half-spaces are correct
- [ ] Hook is under 12 words and lands before 2 s
- [ ] Word count matches target length (±10%)
- [ ] Every narration line has its own visual
- [ ] At least two internal cutaways
- [ ] Stakes rise beat to beat
- [ ] Ending is a twist, tip or loop — no CTA
- [ ] No invented numbers; uncertain claims softened; fact-check list included
