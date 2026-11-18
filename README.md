# Ephemeris — a real-scale 3D atlas of the solar system

Open `index.html` through a web server (for example `python3 -m http.server` in this folder, then visit
http://localhost:8000). Opened straight from disk, the browser blocks the photo textures and the asteroid catalogue.

## What is in it

| | Count | Source |
|---|---|---|
| Sun, 8 planets | 9 | JPL approximate planetary elements (Standish), IAU rotation models |
| Planetary moons | 461 | Every satellite in JPL's planetary-satellite tables, phased to JPL Horizons |
| Moons of dwarf planets and asteroids | 35 | Celestia catalogue (Dysnomia, Hiʻiaka, Namaka, Dactyl, Dimorphos before/after DART, …) |
| Dwarf planets and candidates | 12 | JPL Small-Body Database |
| Asteroids | 1,581,258 | Entire JPL Small-Body Database, animated on the GPU |
| Featured asteroids | 84 | Including Apophis, Bennu, Ryugu, Cruithne, Kamoʻoalewa, 2024 YR4, 2024 PT5, Kaʻepaokaʻawela |
| Comets | 4,088 | Entire JPL Small-Body Database (26 featured, with photos or shape models where they exist) |
| Interstellar objects | 3 | ʻOumuamua, 2I/Borisov, 3I/ATLAS on their hyperbolic paths |
| Space stations | 7 | ISS and Tiangong (CelesTrak orbits); Skylab, Salyut 7, Mir, Tiangong-1 and -2 |
| Other | — | Hubble, Starman's Tesla Roadster, Shoemaker–Levy 9 and its 1994 impacts |
| Stars | 12,172 | HYG v4.1: every naked-eye star and every star within 100 light-years |
| Black holes | 12 | From Gaia BH1 (1,560 ly) to Sagittarius A* and M87* |

Stations that have re-entered do not move: after their re-entry date they stay fixed at their debris site on
Earth. Before launch, or after destruction, an object is hidden; selecting it jumps to a date when it existed.

Surface maps are spacecraft photo mosaics (NASA, ESA, JAXA, USGS) assembled by the Celestia community; small bodies
use their real shape models where one exists. Objects never imaged up close use representative textures, and the
info panel says so.

## Using it

- Click anything — or its label — to fly there. The camera stays centred exactly on the selected object.
- Drag to look around, scroll or pinch to zoom, double-click to move closer.
- **Up** (or Backspace) goes to the parent body. **Recenter** (or C) reframes the selection.
- Search finds planets, moons, stars, comets, any of 26,636 named asteroids, any asteroid number (`433`) and
  provisional designations (`2024 YR4`).
- Time runs at real speed. Use « and » (or , and .) to step from 1 s/s up to 10 years/s, forwards or backwards;
  space pauses; **Now** returns to the present; the calendar jumps to any date between 1000 and 3000.

## Accuracy

This is a reference atlas, not a precision simulator, but positions are checked against JPL Horizons
(`tools/compare.js`):

- Planets: 0.001–0.09° (JPL approximate elements, valid 1800–2050).
- The Moon: within about 30 km (main terms of the ELP-2000/82 lunar theory).
- Moons: the 66 regular moons use mean elements re-derived from Horizons with a 3-monthly correction table; the 393
  irregular moons use Horizons osculating elements sampled every 1–2 years (1950–2050). Across 86 randomly chosen
  moons at independent dates in 1987 and 2033, the median error is 0.66° and 90% are within 2.1° (as seen from the
  planet). Titan, Iapetus, Io, Miranda and Charon are within 0.1°.
- Asteroids and comets: JPL osculating elements propagated as two-body orbits — excellent near the 2026 epoch,
  drifting by degrees decades away. The 1.58 million catalogue asteroids are compressed to about 0.0002 AU.
- Space stations: about 20 km near the orbit's date (CelesTrak, 17 Nov 2026), degrading quickly weeks away. Times are
  UTC; orbits are evaluated in TDB with a ΔT model.

## Rebuilding the data

The scripts in `tools/` regenerate `data/`, `textures/` and `models/`. They read from a working folder
(`EPH_WORK`, default `tools/work`) containing the downloaded sources: JPL SBDB query results, the JPL satellite
tables, JPL Horizons vectors (`anchor.py`), the CelestiaContent and HYG-Database repositories, and a Solar System
Scope Milky Way panorama.

## Credits

Orbital data: NASA/JPL Solar System Dynamics, JPL Small-Body Database and Horizons; CelesTrak.
Catalogue, imagery and shape models: CelestiaProject/CelestiaContent and its contributors (see `Credits` in the app for
per-map attribution; licences include CC BY, CC BY-SA, CC BY-NC-SA and CC0).
Stars: HYG database by David Nash (CC BY-SA 4.0). Milky Way: Solar System Scope (CC BY 4.0).
Rendering: three.js r128. Fonts: Michroma, IBM Plex Sans and IBM Plex Mono (SIL OFL).
