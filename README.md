# Miles

Two self-contained browser toys. No build step, no dependencies — open the file.

| File | What it is |
| --- | --- |
| `index.html` | **My Little Garden** — a growing/harvesting garden sim. |
| `wave-ai.html` | **Wave AI** — a neural network learning to play Geometry Dash's wave gamemode from scratch. |

---

## Wave AI

Open `wave-ai.html`. A swarm of ~100 wave craft starts out flailing at random and,
within about a minute of wall-clock training, the whole swarm flies the level
cleanly from start to finish.

### The game it plays

Exactly the wave gamemode, and nothing more:

* forward speed is constant — it can never slow down or stop
* the only input is up or down, always at **45°**
* it reverses **the instant** it decides to, at any height. The brain decides
  every physics frame (60Hz, the rate the real game runs at), so there is no
  minimum leg and no lag — back-to-back frames can hold opposite directions
* touching a spike, block, slope, ceiling or floor is instant death
* death restarts the run at the very beginning of the level

Agents overlap freely and never collide with each other.

Because forward speed is constant, clones launched on the same frame would stay
locked to the same x for their whole run and could only ever differ in height.
So the swarm launches **staggered**, spread across one full level traversal —
at any moment there are clones at every point of the level, each somewhere
different in its own run. ("Spread starts" turns this off for raw throughput.)

### The learning

There is **one brain**, and every craft on screen is that same brain wearing a
small random perturbation. A generation runs all ~100 clones at once; when they
are all dead (or have finished), every crash and every success is folded back
into that single brain in one update, so the whole swarm learns from each other's
mistakes and stays synchronized. This is an evolution strategy:

* **mirrored sampling** — clones come in ± pairs, so the noise cancels
* **rank shaping** — clones are scored by rank, not raw distance, which keeps one
  freak run from dominating the update
* **the unmutated brain runs too** (agent 0), as a clean, noise-free measurement
  of what the shared brain currently knows — that is the "Brain solo" stat, and
  the rollback and mutation-rate controllers are both driven by it
* **σ anneals as the swarm succeeds**, so a solved level converges from "one
  clone got lucky" to "every clone clears it"

Two details matter more than they look:

* *Fitness ties are dangerous.* Forward speed is constant, so every clone that
  clears the level does so in identical time. Their scores tie perfectly, the
  ranking collapses onto whatever tiny tiebreak term is left, and the swarm
  optimizes for that instead — which quietly destroys the solution. Finishers are
  therefore separated by **how much clearance they flew with**, which pressures
  the brain toward play that survives mutation.
* *A generation where everyone died in the same spot teaches nothing.* The
  ordering is then pure tie-breaking noise, so that update is skipped rather than
  random-walking the brain away from what already works.

### What the AI can see

Nine raycasts (±90° through forward), its current direction, its height in the
corridor, how far into the level it is, and its own last decision — into a
14→16→1 network, deciding 20 times a second. The panel draws the live network.

### The levels

Procedurally generated and **provably beatable**: every level is built around a
centre line that never slopes more than 0.85 (the wave can hold 1.0), and every
spike, pillar and ramp is grown out of the wall away from a guaranteed-clear
channel. Decorations are measured across their whole width, never at a single
point — on a sloped wall a one-point sample lets a spike tip drift into the
channel and quietly makes the level impossible.

### Controls

**Drag the level** to look anywhere in it, or drag the strip along the bottom to
scrub. That strip is the whole level at a glance: every living clone as a tick at
its own position, the death histogram beneath, and a box showing the slice you're
looking at. Double-click or `F` to follow the leader again.

`P` pause · `M` play it yourself (hold space/tap to fly up) · `N` new level ·
`R` wipe the brain · `↑`/`↓` simulation speed.

Sliders cover simulation speed, population size, mutation σ and learning rate.
"New level" keeps the brain and swaps the level, which is the interesting test —
it shows how much the brain learned to *fly* versus how much it memorized.

The red columns are the death map: every crash the swarm has ever had, at the
place it happened.
