# Password Game agent

A bot that plays [The Password Game](https://neal.fun/password-game/) in a real Chromium window.

```bash
pip install -r requirements.txt
playwright install chromium
export ANTHROPIC_API_KEY=...      # optional: used for the chess board and as a fallback for the country
python agent.py                   # add --headless, --slow-mo 50, or --no-human
```

## How it works

Each tick it reads the visible rules and builds a password that satisfies all of them at once.
It counts every digit, element symbol and roman numeral, including the ones inside the captcha,
the chess move, the YouTube ID and the hex color, then adds padding to hit the totals.
It types the whole password as one edit, so Paul is never out of the password, even for a moment.
After that it applies bold, italic, fonts and sizes through the game's toolbar.

| Rule | How it's solved |
|---|---|
| Captcha / hex color | read from the page, refreshed until few digits |
| Wordle | neal.fun's own API, then NYT's API |
| Moon phase | computed locally |
| Country | coordinates from the Street View iframe, looked up with OpenStreetMap |
| Chess | Claude reads the board into a FEN, then Stockfish if installed, else a mate-in-2 search |
| YouTube | `yt-dlp` search for a video of exactly the right length, with an ID that contains no roman numerals |
| Paul | worms kept at the end of the password and topped up as he eats |
| Fire | the password is retyped, which puts the fire out |
| Length / prime | padding with consonants until the length is prime and the length's own digits are included |

When a rule stays red, the agent tries the next variant: another sponsor or month, a neighbouring
moon phase, the time in 24-hour format, or another way of counting the length. If a puzzle can't be
solved automatically, it asks you in the terminal (turn that off with `--no-human`).

## Caveats

The page selectors (`.rule`, `.ProseMirror`, the toolbar) come from how the game was built and
haven't been tested against the live site, so expect to adjust a selector or two on the first run.
