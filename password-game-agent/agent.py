#!/usr/bin/env python3
"""An agent that plays https://neal.fun/password-game/ in a real browser.

It reads the visible rules each tick, keeps a model of every constraint
(digit sum, atomic numbers, roman numerals, length, fonts...), builds a
password that satisfies all of them at once, types it in a single edit (so
Paul is never removed, even for a moment), then applies the formatting through
the game's own toolbar. Rules it can't solve with code (chess board,
sometimes the country) go to Claude, and then to you as a last resort.
"""

import argparse
import base64
import datetime as dt
import json
import math
import re
import shutil
import sys
import time
import urllib.parse
import urllib.request

from playwright.sync_api import sync_playwright

URL = "https://neal.fun/password-game/"
MODEL = "claude-opus-5-5"

ELEMENTS = (
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni "
    "Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe "
    "Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg "
    "Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg "
    "Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
).split()
ATOMIC = {sym: i + 1 for i, sym in enumerate(ELEMENTS)}
ROMAN = set("IVXLCDM")
VOWELS = set("aeiouyAEIOUY")
MOONS = ["🌑", "🌒", "🌓", "🌔", "🌕", "🌖", "🌗", "🌘"]
LIFTER = "🏋️‍♂️"
EGG, CHICKEN, WORM, FIRE = "🥚", "🐔", "🐛", "🔥"
WORMS_TARGET = 5

# Rule ids follow the game's numbering. First match wins, so specific ones go first.
RULE_PATTERNS = [
    (29, r"times new roman"),
    (9, r"multiply"),
    (7, r"roman numeral"),
    (1, r"at least 5 characters"),
    (2, r"include a number"),
    (3, r"uppercase"),
    (4, r"special character"),
    (5, r"digits .* add up"),
    (6, r"month"),
    (8, r"sponsor"),
    (10, r"captcha"),
    (11, r"wordle"),
    (18, r"atomic number"),
    (12, r"periodic table"),
    (13, r"moon"),
    (14, r"country"),
    (15, r"leap year"),
    (16, r"chess"),
    (23, r"hatched|feed him"),
    (17, r"paul|hasn.t hatched"),
    (19, r"vowels.*bold"),
    (20, r"on fire"),
    (21, r"strong enough"),
    (22, r"affirmation"),
    (24, r"youtube"),
    (25, r"sacrifice"),
    (26, r"italic"),
    (27, r"wingdings"),
    (28, r"hex"),
    (30, r"font size of every digit"),
    (31, r"every instance of a letter"),
    (32, r"include the length"),
    (33, r"prime"),
    (34, r"skip"),
    (35, r"current time"),
]
FORMAT_RULES = {19, 26, 27, 29, 30, 31}

COUNTRY_ALIASES = {
    "united states": ["united states", "usa", "united states of america", "america"],
    "united kingdom": ["united kingdom", "uk", "england", "great britain"],
    "czechia": ["czechia", "czech republic"],
    "türkiye": ["turkey", "türkiye"],
    "russian federation": ["russia"],
    "south korea": ["south korea", "korea"],
}


def log(*a):
    print(time.strftime("[%H:%M:%S]"), *a, flush=True)


# ---------------------------------------------------------------- text math

def elements_in(s):
    out, i = [], 0
    while i < len(s):
        if s[i].isupper():
            if s[i:i + 2] in ATOMIC and len(s[i:i + 2]) == 2 and s[i + 1].islower():
                out.append(s[i:i + 2]); i += 2; continue
            if s[i] in ATOMIC:
                out.append(s[i])
        i += 1
    return out


def atomic_sum(s):
    return sum(ATOMIC[e] for e in elements_in(s))


def digit_sum(s):
    return sum(int(c) for c in s if c.isdigit())


def roman_value(tok):
    vals = {"I": 1, "V": 5, "X": 10, "L": 50, "C": 100, "D": 500, "M": 1000}
    total = 0
    for i, c in enumerate(tok):
        v = vals[c]
        total += -v if i + 1 < len(tok) and vals[tok[i + 1]] > v else v
    return total


def roman_product(s):
    p = 1
    for tok in re.findall(r"[IVXLCDM]+", s):
        p *= roman_value(tok)
    return p


def utf16_len(s):
    return len(s.encode("utf-16-le")) // 2


def grapheme_len(s):
    n, skip = 0, False
    for ch in s:
        if skip:
            skip = False
            continue
        if ch == "‍":
            skip = True
            continue
        if ch == "️":
            continue
        n += 1
    return n


LENGTH_MODES = {"utf16": utf16_len, "codepoints": len, "graphemes": grapheme_len}


def is_prime(n):
    return n > 1 and all(n % k for k in range(2, int(math.isqrt(n)) + 1))


def moon_emoji(when, offset=0):
    ref = dt.datetime(2000, 1, 6, 18, 14, tzinfo=dt.timezone.utc)
    age = ((when - ref).total_seconds() / 86400) % 29.530588853
    return MOONS[(int(age / 29.530588853 * 8 + 0.5) + offset) % 8]


def join_parts(parts):
    """Concatenate, inserting '.' where two parts would bleed into each other
    (an uppercase letter grabbing a lowercase one as an element symbol, or two
    numbers merging into one)."""
    out = ""
    for p in parts:
        if not p:
            continue
        if out and ((out[-1].isupper() and p[0].islower())
                    or (out[-1].isdigit() and p[0].isdigit())):
            out += "."
        out += p
    return out


# ---------------------------------------------------------------- helpers

def http_json(url, headers=None):
    req = urllib.request.Request(url, headers={"User-Agent": "password-game-agent/1.0", **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def ask_claude(text, image_png=None):
    """One-shot question to Claude. Returns None when the SDK or credentials are missing."""
    try:
        import anthropic
        client = anthropic.Anthropic()
        content = []
        if image_png:
            content.append({"type": "image", "source": {
                "type": "base64", "media_type": "image/png",
                "data": base64.standard_b64encode(image_png).decode()}})
        content.append({"type": "text", "text": text})
        resp = client.beta.messages.create(
            model=MODEL,
            max_tokens=16000,
            betas=["server-side-fallback-2026-07-01"],
            fallbacks="default",
            output_config={"effort": "high"},
            messages=[{"role": "user", "content": content}],
        )
        if resp.stop_reason == "refusal":
            return None
        return "".join(b.text for b in resp.content if b.type == "text").strip()
    except Exception as e:  # missing package, no credentials, network...
        log("Claude unavailable:", e)
        return None


def ask_human(prompt, allow):
    if not allow:
        return None
    try:
        ans = input(f"\n>>> {prompt}\n>>> ").strip()
        return ans or None
    except EOFError:
        return None


# ---------------------------------------------------------------- chess

def mate_search(board, depth):
    """Return a move forcing mate within `depth` of our moves, else None."""
    import chess

    def forced(b, d):
        for mv in b.legal_moves:
            b.push(mv)
            if b.is_checkmate():
                b.pop(); return True
            ok = d > 1 and not b.is_game_over() and all(_reply_loses(b, r, d) for r in list(b.legal_moves))
            b.pop()
            if ok:
                return True
        return False

    def _reply_loses(b, r, d):
        b.push(r)
        res = forced(b, d - 1)
        b.pop()
        return res

    for d in range(1, depth + 1):
        for mv in board.legal_moves:
            board.push(mv)
            if board.is_checkmate():
                board.pop(); return mv
            ok = d > 1 and not board.is_game_over() and all(_reply_loses(board, r, d) for r in list(board.legal_moves))
            board.pop()
            if ok:
                return mv
    return None


def solve_chess(png, white_to_move, allow_human):
    try:
        import chess
    except ImportError:
        chess = None
    side = "White" if white_to_move else "Black"
    if chess:
        reply = ask_claude(
            f"This is a chess puzzle diagram. {side} is to move. Transcribe the position "
            "exactly. Use the coordinate labels if shown (the board may be drawn from "
            "Black's side). Reply with only the FEN on one line.", png)
        m = reply and re.search(r"([pnbrqkPNBRQK1-8]+(?:/[pnbrqkPNBRQK1-8]+){7})", reply)
        if m:
            fen = f"{m.group(1)} {'w' if white_to_move else 'b'} - - 0 1"
            try:
                board = chess.Board(fen)
                log("chess FEN:", fen)
                engine = shutil.which("stockfish")
                if engine:
                    import chess.engine
                    with chess.engine.SimpleEngine.popen_uci(engine) as eng:
                        mv = eng.play(board, chess.engine.Limit(time=3)).move
                else:
                    mv = mate_search(board, 2)
                if mv is None:
                    reply = ask_claude(f"FEN: {fen}\nWhat is the single best move for {side}? "
                                       "Reply with only the move in SAN.", png)
                    mv = board.parse_san(reply.split()[0]) if reply else None
                if mv is not None:
                    return board.san(mv)
            except Exception as e:
                log("chess solve failed:", e)
    return ask_human(f"Chess: what's the best move for {side}? (SAN, e.g. Qxf7#)", allow_human)


# ---------------------------------------------------------------- youtube

def find_youtube(seconds_total, id_ok, allow_human):
    m, s = divmod(seconds_total, 60)
    try:
        from yt_dlp import YoutubeDL
        queries = [f"{m} minute {s} second timer", f"{m} minutes {s} seconds",
                   f"{m}:{s:02d} timer", f"{m} min {s} sec video"]
        with YoutubeDL({"quiet": True, "extract_flat": True, "skip_download": True}) as ydl:
            for q in queries:
                info = ydl.extract_info(f"ytsearch50:{q}", download=False)
                for e in info.get("entries") or []:
                    dur = e.get("duration")
                    if dur is not None and round(dur) == seconds_total and id_ok(e["id"]):
                        log("youtube:", e["id"], e.get("title"))
                        return e["id"]
    except Exception as e:
        log("yt-dlp search failed:", e)
    ans = ask_human(f"Paste a YouTube video ID that is exactly {m}m{s}s long", allow_human)
    return ans.rsplit("/", 1)[-1].replace("watch?v=", "") if ans else None


# ---------------------------------------------------------------- the agent

class Agent:
    def __init__(self, page, allow_human=True):
        self.page = page
        self.allow_human = allow_human
        self.k = {}             # knowledge gathered from rules
        self.variant = {}       # rule id -> index into its candidate list
        self.sacrificed = set()
        self.visible = set()
        self.length_mode = "utf16"
        self.sizes = None       # available font sizes (px)
        self.default_size = 28
        self.fail_since = {}
        self.last_render = 0.0
        self.text_cache = ""

    # ---- page access

    def editor(self):
        return self.page.locator(".ProseMirror, [contenteditable='true']").first

    def text(self):
        return self.editor().evaluate("e => e.textContent") or ""

    def read_rules(self):
        rules = self.page.evaluate("""() => [...document.querySelectorAll('.rule')].map((r, i) => ({
            i, text: r.innerText, cls: r.className}))""")
        out = []
        for r in rules:
            t = r["text"].lower()
            rid = next((n for n, pat in RULE_PATTERNS if re.search(pat, t)), None)
            ok = "error" not in r["cls"]
            out.append({"id": rid, "text": r["text"], "ok": ok, "i": r["i"]})
        return out

    def rule_el(self, i):
        return self.page.locator(".rule").nth(i)

    def game_over(self):
        body = self.page.evaluate("() => document.body.innerText").lower()
        return bool(re.search(r"game over|has been slain|paul has died|starved|overfed", body))

    # ---- knowledge for each rule

    def v(self, rid, options):
        return options[self.variant.get(rid, 0) % len(options)]

    def acquire(self, rules):
        for r in rules:
            rid = r["id"]
            if rid == 5:
                m = re.search(r"add up to (\d+)", r["text"]); self.k["digits"] = int(m.group(1)) if m else 25
            elif rid == 18:
                m = re.search(r"add up to (\d+)", r["text"]); self.k["atomic"] = int(m.group(1)) if m else 200
            elif rid == 10 and "captcha" not in self.k:
                self.k["captcha"] = self.solve_captcha(r["i"])
            elif rid == 11 and "wordle" not in self.k:
                self.k["wordle"] = self.fetch_wordle()
            elif rid == 14 and "country" not in self.k:
                self.k["country"] = self.solve_geo(r["i"])
            elif rid == 16 and "chess" not in self.k:
                el = self.rule_el(r["i"])
                img = el.locator("img").first
                png = img.screenshot() if img.count() else el.screenshot()
                mv = solve_chess(png, "black" not in r["text"].lower(), self.allow_human) or ""
                self.k["chess"] = [mv, mv.rstrip("+#")] if mv else [""]
                log("chess move:", mv)
            elif rid == 24 and "youtube" not in self.k:
                mm = re.search(r"(\d+)\s*minutes?", r["text"]); ss = re.search(r"(\d+)\s*seconds?", r["text"])
                total = (int(mm.group(1)) * 60 if mm else 0) + (int(ss.group(1)) if ss else 0)
                vid = find_youtube(total, self.youtube_id_ok, self.allow_human) or ""
                self.k["youtube"] = [f"youtu.be/{vid}", f"youtube.com/watch?v={vid}"]
            elif rid == 28 and "hex" not in self.k:
                self.k["hex"] = self.solve_color(r["i"])
            elif rid == 25 and not r["ok"] and not self.sacrificed:
                self.do_sacrifice(r["i"])

    def solve_captcha(self, i):
        el = self.rule_el(i)
        best = None
        for _ in range(25):
            src = el.locator("img").first.get_attribute("src") or ""
            txt = urllib.parse.unquote(src.rsplit("/", 1)[-1].rsplit(".", 1)[0])
            if best is None or digit_sum(txt) < digit_sum(best):
                best = txt
            if not any(c.isdigit() for c in txt):
                break
            self.click_refresh(el)
            time.sleep(0.4)
        log("captcha:", best)
        return best

    def click_refresh(self, el):
        el.evaluate("""r => {
            const c = [...r.querySelectorAll('*')].find(x =>
                /refresh|reload/i.test((x.className && x.className.baseVal !== undefined ? x.className.baseVal : x.className) + ' ' + (x.getAttribute('alt')||'') + ' ' + (x.getAttribute('src')||'')))
                || r.querySelector('button');
            if (c) c.click();
        }""")

    def fetch_wordle(self):
        try:
            ans = self.page.evaluate("""async () => {
                const d = new Date(), p = n => String(n).padStart(2, '0');
                const r = await fetch(`/api/password-game/wordle?date=${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`);
                return (await r.json()).answer;
            }""")
            if ans:
                log("wordle:", ans); return ans.lower()
        except Exception as e:
            log("neal.fun wordle api failed:", e)
        try:
            ans = http_json(f"https://www.nytimes.com/svc/wordle/v2/{dt.date.today()}.json")["solution"]
            log("wordle (nyt):", ans); return ans.lower()
        except Exception as e:
            log("nyt wordle failed:", e)
        return (ask_human("Today's Wordle answer?", self.allow_human) or "").lower()

    def solve_geo(self, i):
        el = self.rule_el(i)
        src = el.locator("iframe").first.get_attribute("src") or ""
        m = (re.search(r"!1d(-?\d+\.\d+)!2d(-?\d+\.\d+)", src) or re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", src)
             or re.search(r"(?:cbll|ll|q)=(-?\d+\.\d+),(-?\d+\.\d+)", src))
        if m:
            lat, lng = m.groups()
            try:
                j = http_json(f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lng}"
                              "&format=json&zoom=3&accept-language=en")
                name = j["address"]["country"].lower()
                log("country:", name, f"({lat},{lng})")
                return COUNTRY_ALIASES.get(name, [name])
            except Exception as e:
                log("reverse geocode failed:", e)
        png = el.screenshot()
        ans = ask_claude("This is a Google Street View screenshot from a geography game. Which country "
                         "is it? Reply with only the country's common English name.", png)
        if not ans:
            ans = ask_human("Which country is shown in the street view?", self.allow_human) or ""
        return [ans.lower().strip(". ")]

    def solve_color(self, i):
        el = self.rule_el(i)
        best = None
        for _ in range(30):
            rgb = el.evaluate("""r => {
                for (const x of r.querySelectorAll('*')) {
                    const bg = x.style && (x.style.backgroundColor || x.style.background);
                    if (bg && /rgb|#/.test(bg)) return getComputedStyle(x).backgroundColor;
                }
                return null;
            }""")
            nums = [int(n) for n in re.findall(r"\d+", rgb or "")][:3]
            if len(nums) == 3:
                hx = "#" + "".join(f"{n:02x}" for n in nums)
                bad = set(hx) & self.sacrificed
                if not bad and (best is None or digit_sum(hx) < digit_sum(best)):
                    best = hx
                if best and digit_sum(best) <= 6:
                    break
            self.click_refresh(el)
            time.sleep(0.3)
        log("hex color:", best)
        return best or ""

    def youtube_id_ok(self, vid):
        return (not (set(vid) & ROMAN) and digit_sum(vid) <= 8 and atomic_sum(vid) <= 80
                and not ({c.lower() for c in vid} & self.sacrificed))

    def do_sacrifice(self, i):
        used = {c.lower() for c in self.build()["text"] if c.isalpha()}
        protected = used | set("abcdef") | set("youtbewatchv") | set("aeiouy")
        choice = [c for c in "zqjxkwgvfp" + "abcdefghijklmnopqrstuvwxyz" if c not in protected]
        pick = []
        for c in choice:
            if c not in pick:
                pick.append(c)
            if len(pick) == 2:
                break
        log("sacrificing:", pick)
        el = self.rule_el(i)
        for c in pick:
            el.evaluate("""(r, c) => {
                const b = [...r.querySelectorAll('button, .letter, div, span')]
                    .find(x => x.children.length === 0 && x.innerText.trim().toLowerCase() === c);
                if (b) b.click();
            }""", c)
            time.sleep(0.2)
        el.evaluate("""r => {
            const b = [...r.querySelectorAll('button')].find(x => /sacrifice/i.test(x.innerText));
            if (b) b.click();
        }""")
        self.sacrificed = set(pick)
        time.sleep(0.5)

    # ---- building the password

    def browser_time(self):
        return self.page.evaluate("() => { const d = new Date(); return [d.getHours(), d.getMinutes()]; }")

    def build(self):
        vis, k = self.visible, self.k
        top = max(vis) if vis else 0
        has = lambda n: top >= n
        parts = ["!"]                                   # rule 4; also a plain first char
        if has(3): parts.append("He")                   # uppercase + two-letter element
        if has(8): parts.append(self.v(8, ["pepsi", "shell", "starbucks"]))
        if has(6): parts.append(self.v(6, ["may", "june", "july", "march"]))
        roman_part = "XXXV" if has(7) else ""
        parts.append(roman_part)
        if has(10): parts.append(k.get("captcha", ""))
        if has(11): parts.append(k.get("wordle", ""))
        if has(13): parts.append(moon_emoji(dt.datetime.now(dt.timezone.utc), self.v(13, [0, -1, 1])))
        if has(14): parts.append(self.v(14, k.get("country", [""])).replace(" ", ""))
        if has(15): parts.append(self.v(15, ["2000", "0", "4"]))
        if has(16): parts.append(self.v(16, k.get("chess", [""])))
        if has(17): parts.append(CHICKEN if (has(23) or CHICKEN in self.text_cache) else EGG)
        if has(21): parts.append(LIFTER * 3)
        if has(22): parts.append(self.v(22, ["iamloved", "i am loved", "I am loved"]))
        if has(24): parts.append(self.v(24, k.get("youtube", [""])))
        if has(28): parts.append(k.get("hex", ""))
        if has(35):
            h, mi = self.browser_time()
            parts.append(self.v(35, [f"{h % 12 or 12}:{mi:02d}", f"{h}:{mi:02d}", f"{h:02d}:{mi:02d}"]))

        # atomic padding (rule 18)
        base = join_parts(parts)
        if has(18):
            need = k.get("atomic", 200) - atomic_sum(base)
            parts.append(self.element_pad(need, base))
        worms = WORM * WORMS_TARGET if has(23) else ""
        measure = LENGTH_MODES[self.length_mode]
        need_len = has(32)
        target_digits = k.get("digits", 25)

        for L in range(5, 400):
            if has(33) and not is_prime(L):
                continue
            lstr = str(L) if need_len else ""
            pre = join_parts(parts + [lstr])
            dpad = ""
            if has(2):
                rem = (target_digits if has(5) else 1) - digit_sum(pre)
                if rem < 0:
                    if need_len: continue
                    rem = 0
                dpad = "9" * (rem // 9) + (str(rem % 9) if rem % 9 else "")
            body = join_parts(parts + [dpad, lstr])
            if not need_len:
                filler = self.filler(max(0, 5 - measure(body + worms)), body)
                text = join_parts([body, filler]) + worms
                break
            gap = L - measure(body + "." + worms)  # worst case joiner
            if gap < 0:
                continue
            filler = self.filler(gap, body)
            text = join_parts([body, filler]) + worms
            if measure(text) != L:
                filler = self.filler(gap + (L - measure(text)), body)
                text = join_parts([body, filler]) + worms
            if measure(text) == L:
                break
        start = text.find(roman_part) if roman_part else -1
        roman_idx = set(range(start, start + len(roman_part))) if start >= 0 else set()
        return {"text": text, "roman": roman_idx}

    def element_pad(self, need, base):
        if need <= 0:
            return ""
        counts = {}
        for c in base.lower():
            counts[c] = counts.get(c, 0) + 1
        cap = len(self.sizes or []) or 12
        items = [(s, n) for s, n in ATOMIC.items()
                 if s[0] not in ROMAN and not ({c.lower() for c in s} & self.sacrificed)
                 and all(counts.get(c.lower(), 0) + 2 < cap for c in s)]
        best = {0: []}
        for s, n in items:                              # 0/1 knapsack, fewest symbols
            for tot in sorted(best, reverse=True):
                nt = tot + n
                if nt <= need and (nt not in best or len(best[nt]) > len(best[tot]) + 1):
                    best[nt] = best[tot] + [s]
        pad = best.get(need)
        if pad is None:
            log("cannot pad atomic sum by", need)
            return ""
        # two-letter symbols first so a trailing single letter never grabs a lowercase
        return "".join(sorted(pad, key=lambda s: -len(s)))

    def filler(self, n, body):
        counts = {}
        for c in body.lower():
            counts[c] = counts.get(c, 0) + 1
        pool = [c for c in "bcdfghjklmnpqrstvwxz" if c not in self.sacrificed]
        out = []
        for _ in range(n):
            c = min(pool, key=lambda ch: counts.get(ch, 0))
            counts[c] = counts.get(c, 0) + 1
            out.append(c)
        return "".join(out)

    # ---- writing to the page

    def type_password(self, text):
        ed = self.editor()
        ed.click()
        self.page.keyboard.press("ControlOrMeta+A")
        self.page.keyboard.insert_text(text)            # one transaction: Paul never leaves
        time.sleep(0.15)

    def toolbar(self):
        return self.page.evaluate("""() => {
            const sel = [...document.querySelectorAll('select')].map((s, i) => ({i,
                opts: [...s.options].map(o => o.text.trim())}));
            return {selects: sel};
        }""")

    def select_range(self, start, end):
        return self.page.evaluate("""([start, end]) => {
            const root = document.querySelector('.ProseMirror') || document.querySelector('[contenteditable=true]');
            root.focus();
            const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
            let pos = 0, n, s = null, so = 0, e = null, eo = 0, last = null;
            while ((n = w.nextNode())) {
                const L = n.data.length;
                if (!s && start < pos + L) { s = n; so = start - pos; }
                if (!e && end <= pos + L) { e = n; eo = end - pos; }
                pos += L; last = n;
            }
            if (!s) return false;
            if (!e) { e = last; eo = last.data.length; }
            const r = document.createRange(); r.setStart(s, so); r.setEnd(e, eo);
            const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
            document.dispatchEvent(new Event('selectionchange'));
            return true;
        }""", [start, end])

    def click_button(self, names, shortcut):
        hit = self.page.evaluate("""names => {
            const b = [...document.querySelectorAll('button')].find(x =>
                names.includes(x.innerText.trim().toLowerCase()) || names.includes((x.title||'').toLowerCase()));
            if (b) { b.click(); return true; } return false;
        }""", names)
        if not hit:
            self.page.keyboard.press(shortcut)

    def choose(self, kind, label):
        sels = self.toolbar()["selects"]
        for s in sels:
            if (kind == "font" and any("wingdings" in o.lower() for o in s["opts"])) or \
               (kind == "size" and any(o.endswith("px") for o in s["opts"])):
                opt = next((o for o in s["opts"] if o.lower() == label.lower()), None)
                if opt:
                    self.page.locator("select").nth(s["i"]).select_option(label=opt)
                    return True
        return False

    def read_sizes(self):
        for s in self.toolbar()["selects"]:
            px = [int(o[:-2]) for o in s["opts"] if re.fullmatch(r"\d+px", o)]
            if px:
                self.sizes = px
                cur = self.page.locator("select").nth(s["i"]).evaluate("e => e.options[e.selectedIndex].text")
                if re.fullmatch(r"\d+px", cur or ""):
                    self.default_size = int(cur[:-2])
                return

    def format_ops(self, plan):
        text, vis = plan["text"], self.visible
        top = max(vis) if vis else 0
        cps = list(text)
        ops = []                                         # (start_cp, end_cp, action, arg)

        def runs(pred):
            i = 0
            while i < len(cps):
                if pred(i):
                    j = i
                    while j < len(cps) and pred(j): j += 1
                    yield i, j; i = j
                else:
                    i += 1

        if top >= 26: ops.append((1, len(cps), "italic", None))
        if top >= 19: ops += [(a, b, "bold", None) for a, b in runs(lambda i: cps[i] in VOWELS)]
        if top >= 27: ops += [(a, b, "font", "Wingdings") for a, b in runs(lambda i: i > 0 and i not in plan["roman"] and cps[i] != WORM)]
        if top >= 29: ops += [(a, b, "font", "Times New Roman") for a, b in runs(lambda i: i in plan["roman"])]
        sizes = {}
        if top >= 30:
            for i, c in enumerate(cps):
                if c.isdigit(): sizes[i] = int(c) ** 2
        if top >= 31:
            avail = [s for s in (self.sizes or []) if s != self.default_size]
            seen = {}
            for i, c in enumerate(cps):
                if c.isalpha():
                    n = seen.get(c.lower(), 0); seen[c.lower()] = n + 1
                    if n > 0:
                        if n - 1 < len(avail): sizes[i] = avail[n - 1]
                        else: log(f"too many '{c}' for distinct font sizes")
        idx = sorted(sizes)
        while idx:
            a = idx.pop(0); b = a + 1
            while idx and idx[0] == b and sizes[b] == sizes[a]: idx.pop(0); b += 1
            ops.append((a, b, "size", f"{sizes[a]}px"))
        return ops

    def apply_format(self, plan):
        if self.sizes is None:
            self.read_sizes()
        text = plan["text"]
        for a, b, action, arg in self.format_ops(plan):
            cur = self.text()
            if FIRE in cur:
                return False
            if cur.rstrip(WORM) != text.rstrip(WORM):
                log("text changed mid-format; re-rendering"); return False
            self.feed(cur)
            self.select_range(utf16_len(text[:a]), utf16_len(text[:min(b, len(cur))]))
            time.sleep(0.05)
            if action == "bold": self.click_button(["bold", "b"], "ControlOrMeta+b")
            elif action == "italic": self.click_button(["italic", "i"], "ControlOrMeta+i")
            else: self.choose(action, arg)
            time.sleep(0.05)
        return True

    def render(self, plan):
        log("password:", plan["text"])
        for _ in range(3):
            self.type_password(plan["text"])
            if self.page.locator("select").count() == 0 or self.apply_format(plan):
                break
        self.last_render = time.time()
        self.calibrate_length()

    def calibrate_length(self):
        shown = self.page.evaluate("""() => { const e = document.querySelector('.password-length');
            return e ? e.innerText : null; }""")
        if shown and shown.strip().isdigit():
            n, cur = int(shown), self.text()
            for mode, f in LENGTH_MODES.items():
                if f(cur) == n and mode != self.length_mode:
                    log("length counted as", mode); self.length_mode = mode

    def feed(self, cur=None):
        if 23 not in self.visible:
            return
        cur = cur if cur is not None else self.text()
        missing = WORMS_TARGET - cur.count(WORM)
        if missing > 0 and CHICKEN in cur:
            self.editor().evaluate("e => e.focus()")
            self.page.keyboard.press("ControlOrMeta+End")
            self.page.keyboard.insert_text(WORM * missing)

    # ---- main loop

    def finish(self):
        yes = self.page.locator("button", has_text=re.compile(r"^\s*yes\s*$", re.I))
        if yes.count() and yes.first.is_visible():
            final = self.text()
            log("confirming final password")
            yes.first.click(); time.sleep(1.5)
            box = self.page.locator("input:visible, textarea:visible").first
            if box.count():
                box.fill(final.replace(FIRE, ""))
                self.page.keyboard.press("Enter")
            return True
        return False

    def run(self):
        self.page.goto(URL)
        self.editor().wait_for()
        while True:
            if self.game_over():
                log("game over :("); return False
            rules = self.read_rules()
            self.visible = {r["id"] for r in rules if r["id"]}
            self.text_cache = self.text()
            self.acquire(rules)
            plan = self.build()
            cur = self.text_cache
            failing = [r for r in rules if not r["ok"]]
            need = FIRE in cur or cur.rstrip(WORM) != plan["text"].rstrip(WORM)
            # while Paul is mid-meal the length rules flicker; don't judge them then
            settled = (time.time() - self.last_render > 1.5
                       and (23 not in self.visible or cur.count(WORM) == WORMS_TARGET))
            if not need and failing and settled:
                now = time.time()
                for r in failing:
                    rid = r["id"]
                    since = self.fail_since.setdefault(rid, now)
                    if now - since < 1.5:
                        continue
                    log(f"rule {rid} still failing: {r['text'].splitlines()[-1][:80]}")
                    self.variant[rid] = self.variant.get(rid, 0) + 1
                    if rid == 32 or rid == 33:
                        modes = list(LENGTH_MODES)
                        self.length_mode = modes[(modes.index(self.length_mode) + 1) % len(modes)]
                    self.fail_since[rid] = now
                    need = True
                plan = self.build()
            for r in rules:
                if r["ok"]: self.fail_since.pop(r["id"], None)
            if need:
                self.render(plan)
            self.feed()
            if not failing and self.finish():
                log("done! 🎉"); return True
            time.sleep(0.3)


def main():
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--headless", action="store_true")
    ap.add_argument("--no-human", action="store_true", help="never prompt in the terminal")
    ap.add_argument("--slow-mo", type=int, default=0)
    args = ap.parse_args()
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=args.headless, slow_mo=args.slow_mo)
        page = browser.new_page(viewport={"width": 1280, "height": 1000})
        ok = Agent(page, allow_human=not args.no_human).run()
        if not args.headless:
            input("Press Enter to close the browser...")
        browser.close()
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
