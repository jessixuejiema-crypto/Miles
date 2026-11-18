"""Build data/catalog.js and data/stars.js for the Ephemeris explorer."""
import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
WORK = _os.environ.get('EPH_WORK', _os.path.join(REPO, 'tools', 'work'))
import csv, datetime, glob, json, math, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import ssc
from facts import FACTS, STAR_FACTS, BLACK_HOLES, STATIONS_HISTORIC, SL9_IMPACTS, DWARF_IAU, DWARF_CANDIDATES

ROOT = WORK
OUT = os.path.join(REPO, 'data')
AU = 149597870.7
GM_SUN = 1.32712440018e11
TEX_DIR = os.path.join(REPO, 'textures')
MODEL_DIR = os.path.join(REPO, 'models')
HAVE_TEX = {os.path.splitext(f)[0] for f in os.listdir(TEX_DIR)}
HAVE_MODEL = {os.path.splitext(f)[0] for f in os.listdir(MODEL_DIR) if f.endswith('.msh')}

bodies = []
by_id = {}


def slug(s):
    s = s.lower().replace('ʻ', '').replace("'", '').replace('!', '').replace('|', '')
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s


def add(b):
    base = b['id']
    k = 2
    while b['id'] in by_id:
        b['id'] = f'{base}-{k}'; k += 1
    bodies.append(b); by_id[b['id']] = b
    return b


def jd_from_date(s):
    """'2000-01-01.5' -> JD"""
    y, m, d = s.split('-')
    df = float(d)
    dt = datetime.datetime(int(y), int(m), 1) + datetime.timedelta(days=df - 1)
    return 2440587.5 + (dt - datetime.datetime(1970, 1, 1)).total_seconds() / 86400


def jd_from_iso(s):
    dt = datetime.datetime.fromisoformat(s)
    return 2440587.5 + (dt - datetime.datetime(1970, 1, 1)).total_seconds() / 86400


def r6(x, n=6):
    return float(f'{x:.{n}g}')


# ---------------------------------------------------------------------------
# Sun & planets
# ---------------------------------------------------------------------------
STANDISH = {  # a, e, I, L, long.peri, long.node  and rates per Julian century (Standish 1992, Table 1)
    'mercury': [0.38709927, 0.20563593, 7.00497902, 252.25032350, 77.45779628, 48.33076593,
                0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081],
    'venus': [0.72333566, 0.00677672, 3.39467605, 181.97909950, 131.60246718, 76.67984255,
              0.00000390, -0.00004107, -0.00078890, 58517.81538729, 0.00268329, -0.27769418],
    'earth': [1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0,
              0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0],
    'mars': [1.52371034, 0.09339410, 1.84969142, -4.55343205, -23.94362959, 49.55953891,
             0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343],
    'jupiter': [5.20288700, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909,
                -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106],
    'saturn': [9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448,
               -0.00125060, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794],
    'uranus': [19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.95427630, 74.01692503,
               -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589],
    'neptune': [30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574,
                0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664],
    'pluto': [39.48211675, 0.24882730, 17.14001206, 238.92903833, 224.06891629, 110.30393684,
              -0.00031596, 0.00005170, 0.00004818, 145.20780515, -0.04062942, -0.01183482],
}
# IAU WGCCRE 2015 rotation: [ra0, dec0, W0, Wdot(deg/day)]
IAU = {
    'sun': [286.13, 63.87, 84.176, 14.1844], 'mercury': [281.0103, 61.4155, 329.5988, 6.1385108],
    'venus': [272.76, 67.16, 160.20, -1.4813688], 'earth': [0.0, 90.0, 190.147, 360.9856235],
    'moon': [269.9949, 66.5392, 38.3213, 13.17635815], 'mars': [317.269202, 54.432516, 176.049863, 350.891982443297],
    'jupiter': [268.056595, 64.495303, 284.95, 870.536], 'saturn': [40.589, 83.537, 38.90, 810.7939024],
    'uranus': [257.311, -15.175, 203.81, -501.1600928], 'neptune': [299.36, 43.46, 249.978, 541.1397757],
    'pluto': [132.993, -6.163, 302.695, 56.3625225], 'charon': [132.993, -6.163, 122.695, 56.3625225],
    'ceres': [291.418, 66.764, 170.650, 952.1532], 'vesta': [309.031, 42.235, 285.39, 1617.3329428],
    'io': [268.05, 64.50, 200.39, 203.4889538], 'europa': [268.08, 64.51, 36.022, 101.3747235],
    'ganymede': [268.20, 64.57, 44.064, 50.3176081], 'callisto': [268.72, 64.83, 259.51, 21.5710715],
    'mimas': [40.66, 83.52, 333.46, 381.994555], 'enceladus': [40.66, 83.52, 6.32, 262.7318996],
    'tethys': [40.66, 83.52, 8.95, 190.6979085], 'dione': [40.66, 83.52, 357.6, 131.5349316],
    'rhea': [40.38, 83.55, 235.16, 79.6900478], 'titan': [39.4827, 83.4279, 186.5855, 22.5769768],
    'iapetus': [318.16, 75.03, 355.2, 4.5379572], 'miranda': [257.43, -15.08, 30.70, -254.6906892],
    'ariel': [257.43, -15.10, 156.22, -142.8356681], 'umbriel': [257.43, -15.10, 108.05, -86.8688923],
    'titania': [257.43, -15.10, 77.74, -41.3514316], 'oberon': [257.43, -15.10, 6.77, -26.7394932],
    'triton': [299.36, 41.17, 296.53, -61.2572637], 'phobos': [317.68, 52.90, 35.06, 1128.844585],
    'deimos': [316.65, 53.52, 79.41, 285.161897],
}
GM = {'sun': GM_SUN, 'mercury': 22031.86855, 'venus': 324858.592, 'earth': 398600.435436, 'mars': 42828.375214,
      'jupiter': 126712764.8, 'saturn': 37940585.2, 'uranus': 5794548.6, 'neptune': 6836527.1, 'pluto': 869.6,
      'moon': 4902.800066}
PLANETS = [
    # id, name, eq radius, polar radius, texture, extra
    ('mercury', 'Mercury', 2440.53, 2438.26, 'mercury', {}),
    ('venus', 'Venus', 6051.8, 6051.8, 'venus', {'atm': '#e8c98a'}),
    ('earth', 'Earth', 6378.137, 6356.752, 'earth', {'atm': '#7fb6ff', 'clouds': 'earth-clouds', 'night': 'earth-night'}),
    ('mars', 'Mars', 3396.19, 3376.2, 'mars', {'atm': '#e0a07a'}),
    ('jupiter', 'Jupiter', 71492, 66854, 'jupiter', {'ring': {'in': 92000, 'out': 226000, 'tex': 'jupiter-rings', 'op': 0.35}}),
    ('saturn', 'Saturn', 60268, 54364, 'saturn', {'ring': {'in': 74510, 'out': 140245, 'tex': 'saturn-rings', 'op': 1}}),
    ('uranus', 'Uranus', 25559, 24973, 'uranus', {'atm': '#bfeff2', 'ring': {'in': 38000, 'out': 51149, 'tex': 'uranus-rings', 'op': 1}}),
    ('neptune', 'Neptune', 24764, 24341, 'neptune', {'atm': '#6f8fff', 'ring': {'in': 40900, 'out': 62940, 'tex': 'neptune-rings', 'op': 1}}),
]

add({'id': 'sun', 'n': 'Sun', 'k': 'star', 'p': None, 'r': 695700, 'tex': 'star-g', 'emit': 1,
     'rot': {'t': 'iau', 'v': IAU['sun']}, 'orb': {'t': 'origin'}, 'gm': GM_SUN,
     'src': 'Position: solar system origin (heliocentric frame)', 'img': 'star-g'})
for pid, name, req, rpo, tex, extra in PLANETS:
    b = {'id': pid, 'n': name, 'k': 'planet', 'p': 'sun', 'r': req, 'rp': rpo, 'tex': tex,
         'orb': {'t': 'std', 'el': STANDISH[pid]}, 'rot': {'t': 'iau', 'v': IAU[pid]}, 'gm': GM[pid],
         'src': 'Orbit: JPL approximate planetary elements (Standish), valid 1800–2050', 'img': tex}
    b.update(extra)
    add(b)
add({'id': 'pluto', 'n': 'Pluto', 'k': 'dwarf', 'p': 'sun', 'r': 1188.3, 'tex': 'pluto', 'atm': '#cfd8ff',
     'orb': {'t': 'std', 'el': STANDISH['pluto']}, 'rot': {'t': 'iau', 'v': IAU['pluto']}, 'gm': GM['pluto'],
     'num': 134340, 'cls': 'TNO', 'src': 'Orbit: JPL approximate planetary elements (Standish), valid 1800–2050', 'img': 'pluto'})
by_id['earth']['emb'] = True  # Standish gives the Earth–Moon barycentre

# ---------------------------------------------------------------------------
# Celestia data (sizes, textures, models, small-body moons, rings)
# ---------------------------------------------------------------------------
CEL = {}
CEL_ALL = []
for f in ['solarsys', 'minormoons', 'dwarfplanets', 'asteroids', 'outersys', 'comets']:
    for e in ssc.parse_file(os.path.join(ROOT, 'probe', f + '.ssc')):
        if e['disp'] in ('Modify', 'AltSurface', 'Location', 'ReferencePoint', 'SurfaceObject'):
            continue
        CEL_ALL.append(e)
        for n in e['names']:
            CEL.setdefault(n.strip().lower(), e)


def cel_lookup(*names):
    for n in names:
        if n and n.lower() in CEL:
            return CEL[n.lower()]
    return None


def cel_shape(e, b):
    """Copy size/texture/model hints from a Celestia entry."""
    if not e:
        return
    p = e['p']
    if 'SemiAxes' in p and isinstance(p['SemiAxes'], list):
        ax = [float(x) for x in p['SemiAxes']]
        b.setdefault('r', r6(sum(ax) / 3))
        if max(ax) / max(min(ax), 1e-9) > 1.02:
            b['ax'] = [r6(a) for a in ax]
    elif 'Radius' in p and isinstance(p['Radius'], float):
        b.setdefault('r', p['Radius'])
    mesh = p.get('Mesh')
    if isinstance(mesh, str):
        m = os.path.splitext(mesh)[0]
        if m in HAVE_MODEL:
            b['model'] = m
    tex = p.get('Texture')
    if isinstance(tex, str):
        t = tex.split('.')[0]
        if t in HAVE_TEX and 'tex' not in b:
            b['tex'] = t
    col = p.get('Color')
    if isinstance(col, list) and len(col) == 3:
        b.setdefault('col', '#%02x%02x%02x' % tuple(min(255, int(c * 255)) for c in col))
    rings = p.get('Rings')
    if isinstance(rings, dict) and 'Inner' in rings and 'ring' not in b:
        tex = rings.get('Texture')
        rt = tex.split('.')[0] if isinstance(tex, str) else None
        b['ring'] = {'in': rings['Inner'], 'out': rings['Outer'], 'tex': rt if rt in HAVE_TEX else None, 'op': 0.8}
    ur = p.get('UniformRotation')
    rp = None
    if isinstance(ur, dict) and isinstance(ur.get('Period'), float):
        rp = ur['Period']
    elif isinstance(p.get('RotationPeriod'), float):
        rp = p['RotationPeriod']
    if rp and 'rotP' not in b:
        b['rotP'] = rp


for b in bodies:
    cel_shape(cel_lookup(b['n']), b)
for pid in ('mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'):
    by_id[pid].pop('ax', None)
    by_id[pid].pop('model', None)
by_id['venus']['tex'] = 'venus'
by_id['sun']['tex'] = 'star-g'

# ---------------------------------------------------------------------------
# Planetary satellites: JPL SSD mean elements (every satellite JPL tracks)
# ---------------------------------------------------------------------------
jpl = json.load(open(os.path.join(ROOT, 'jpl', 'jpl_tables.json')))
phys_r = {}
for r in jpl['ph'][2:]:
    if len(r) >= 5:
        v = r[4].split('\n')[0].strip()
        try:
            phys_r[r[2]] = float(v)
        except ValueError:
            pass
gm_moon = {}
for r in jpl['ph'][2:]:
    if len(r) >= 4:
        try:
            gm_moon[r[2]] = float(r[3].split('\n')[0].strip())
        except ValueError:
            pass

SYNC = {'moon', 'phobos', 'deimos', 'io', 'europa', 'ganymede', 'callisto', 'amalthea', 'thebe', 'metis', 'adrastea',
        'mimas', 'enceladus', 'tethys', 'dione', 'rhea', 'titan', 'iapetus', 'janus', 'epimetheus', 'pan', 'daphnis',
        'atlas', 'prometheus', 'pandora', 'telesto', 'calypso', 'helene', 'polydeuces', 'methone', 'pallene', 'anthe',
        'miranda', 'ariel', 'umbriel', 'titania', 'oberon', 'puck', 'triton', 'proteus', 'larissa', 'galatea',
        'despina', 'thalassa', 'naiad', 'charon'}
PARENT_ID = {'Earth': 'earth', 'Mars': 'mars', 'Jupiter': 'jupiter', 'Saturn': 'saturn', 'Uranus': 'uranus',
             'Neptune': 'neptune', 'Pluto': 'pluto'}


def moon_name(s):
    m = re.match(r'^S(\d{4})_([A-Z])_(\d+)$', s)
    if m:
        return f'S/{m.group(1)} {m.group(2)} {m.group(3)}'
    return s.replace('_', ' ')


n_moons = {}
for row in jpl['el'][1:]:
    _, planet, sname, code, ephem, frame, epoch, a, e, w, M, i, node, P, Pap, Pnode, ra, dec, tilt, ref = row[:20]
    name = moon_name(sname)
    pid = PARENT_ID[planet]
    n_moons[pid] = n_moons.get(pid, 0) + 1
    a, e, w, M, i, node, P = map(float, (a, e, w, M, i, node, P))
    ep = jd_from_date(epoch)
    # JPL's period column is the sidereal period (mean-longitude rate) except for the JUP365 and MAR099
    # ephemerides, whose rows give the anomalistic period (mean-anomaly rate).
    anomalistic = ephem in ('JUP365', 'MAR099')
    nP = 360.0 / P
    orb = {'t': 'kep', 'a': a, 'e': e, 'i': i, 'O': node, 'w': w, 'M': M, 'ep': round(ep, 4), 'n': nP}
    if not anomalistic:
        orb['nl'] = 1
    retro = i > 90
    sgn = -1 if retro else 1
    try:
        Pap, Pnode = float(Pap), float(Pnode)
    except ValueError:
        Pap = Pnode = 0
    if Pnode > 0:
        orb['dO'] = -360.0 / (Pnode * 365.25)  # nodes regress for both prograde and retrograde moons
    mid0 = 'moon' if pid == 'earth' else slug(name)
    if Pap > 0:
        orb['dw'] = sgn * 360.0 / (Pap * 365.25)  # Papsis: precession period of the argument of periapsis
        if mid0 == 'hyperion':
            orb['dw'] = -orb['dw']  # the 4:3 resonance with Titan makes Hyperion's periapsis regress
        if anomalistic and mid0 in IAU:
            # signed apsidal rate from the synchronous rotation rate (Io's and Europa's periapses regress)
            orb['dw'] = (abs(IAU[mid0][3]) - nP) - orb.get('dO', 0)
    if frame == 'ecliptic':
        orb['fr'] = 'ecl'
    elif frame == 'Laplace':
        orb['fr'] = 'pole'; orb['pole'] = [float(ra), float(dec)]
    else:  # equatorial: referred to the planet's equator, using its right-hand rotation pole
        ra0, de0, _, wd = IAU[pid]
        orb['fr'] = 'pole'; orb['pole'] = [ra0, de0] if wd > 0 else [(ra0 + 180) % 360, -de0]
    mid = slug(name)
    if pid == 'earth':
        mid = 'moon'
    b = {'id': mid, 'n': name, 'k': 'moon', 'p': pid, 'orb': orb, 'code': int(code),
         'src': f'Orbit: JPL SSD planetary satellite mean elements ({ephem}, {frame} frame)'}
    if code in phys_r:
        b['r'] = phys_r[code]
    if code in gm_moon:
        b['gm'] = gm_moon[code]
    ce = cel_lookup(name, name.replace('S/', 'S '), sname)
    cel_shape(ce, b)
    if 'r' not in b:
        b['r'] = 1.5; b['rEst'] = 1
    if mid == 'moon':
        b['rot'] = {'t': 'iau', 'v': IAU[mid]}
    elif mid in SYNC or (a < 3e6 and not retro and e < 0.05 and b['r'] > 5 and pid != 'earth'):
        b['rot'] = {'t': 'sync'}
    if mid in HAVE_TEX and mid not in ('asteroid',):
        b['tex'] = mid
    if mid in HAVE_MODEL:
        b['model'] = mid
    if 'tex' not in b:
        b['tex'] = 'icymoon' if (pid in ('saturn', 'uranus', 'neptune') and a < 2e6) else 'asteroid'
        b['texGeneric'] = 1
    b['img'] = b['tex']
    add(b)

# ---------------------------------------------------------------------------
# Anchor every planetary satellite to JPL Horizons (2026-01-01 and 2000-01-01):
# keep the JPL orbit shape, plane and precession, re-phase the mean anomaly at 2026 and fit the
# mean-anomaly rate so both epochs match exactly.
# ---------------------------------------------------------------------------
def _radec(ra, dec):
    r, d = math.radians(ra), math.radians(dec)
    return [math.cos(d) * math.cos(r), math.cos(d) * math.sin(r), math.sin(d)]
_cE, _sE = math.cos(math.radians(23.4392911)), math.sin(math.radians(23.4392911))
def _icrf2ecl(v):
    return [v[0], v[1] * _cE + v[2] * _sE, -v[1] * _sE + v[2] * _cE]
def _frame(o):
    if o.get('fr') == 'icrf':
        return [1, 0, 0], [0, _cE, -_sE], [0, _sE, _cE]
    if o.get('fr') == 'pole':
        ra = math.radians(o['pole'][0])
        p = _radec(*o['pole'])
        N = [-math.sin(ra), math.cos(ra), 0]
        Q = [p[1] * N[2] - p[2] * N[1], p[2] * N[0] - p[0] * N[2], p[0] * N[1] - p[1] * N[0]]
        return _icrf2ecl(N), _icrf2ecl(Q), _icrf2ecl(p)
    return [1, 0, 0], [0, 1, 0], [0, 0, 1]
def _pq(o, jd):
    dt = jd - o['ep']
    O = math.radians(o['O'] + o.get('dO', 0) * dt); w = math.radians(o['w'] + o.get('dw', 0) * dt); i = math.radians(o['i'])
    cO, sO, cw, sw, ci, si = math.cos(O), math.sin(O), math.cos(w), math.sin(w), math.cos(i), math.sin(i)
    X, Y, Z = _frame(o)
    pf = (cw * cO - sw * sO * ci, cw * sO + sw * cO * ci, sw * si)
    qf = (-sw * cO - cw * sO * ci, -sw * sO + cw * cO * ci, cw * si)
    P = [pf[0] * X[k] + pf[1] * Y[k] + pf[2] * Z[k] for k in range(3)]
    Q = [qf[0] * X[k] + qf[1] * Y[k] + qf[2] * Z[k] for k in range(3)]
    return P, Q
def _mean_anomaly(o, r, jd):
    P, Q = _pq(o, jd)
    nu = math.atan2(sum(r[k] * Q[k] for k in range(3)), sum(r[k] * P[k] for k in range(3)))
    e = o['e']
    E = 2 * math.atan(math.sqrt((1 - e) / (1 + e)) * math.tan(nu / 2))
    return math.degrees(E - e * math.sin(E)) % 360


# ---------------------------------------------------------------------------
# Mean orbit orientation for regular moons: average JPL Horizons osculating elements over one orbit
# (2026-01-01) in each moon's reference frame. Replaces the table's e, i, node and periapsis.
# ---------------------------------------------------------------------------
MEANORB = os.path.join(ROOT, 'val', 'meanorb.json')
GM_SYS = {'mars': 42828.375, 'jupiter': 126712764.8, 'saturn': 37940585.2, 'uranus': 5794548.6, 'neptune': 6836527.1, 'pluto': 975.5}
if os.path.exists(MEANORB):
    mo = json.load(open(MEANORB))
    nmean = 0
    for b in bodies:
        if b['k'] != 'moon' or 'code' not in b:
            continue
        samples = mo.get(str(b['code']))
        if not isinstance(samples, list) or len(samples) < 10:
            continue
        o = b['orb']
        X, Y, Z = _frame(o)
        mu = GM_SYS[b['p']]
        hs = [0.0, 0.0, 0.0]; es = [0.0, 0.0, 0.0]
        for row in samples:
            r = [row[1], row[2], row[3]]; v = [row[4], row[5], row[6]]
            rf = [sum(r[k] * B[k] for k in range(3)) for B in (X, Y, Z)]
            vf = [sum(v[k] * B[k] for k in range(3)) for B in (X, Y, Z)]
            h = [rf[1] * vf[2] - rf[2] * vf[1], rf[2] * vf[0] - rf[0] * vf[2], rf[0] * vf[1] - rf[1] * vf[0]]
            hn = math.sqrt(sum(x * x for x in h)); rn = math.sqrt(sum(x * x for x in rf))
            vxh = [vf[1] * h[2] - vf[2] * h[1], vf[2] * h[0] - vf[0] * h[2], vf[0] * h[1] - vf[1] * h[0]]
            ev = [vxh[k] / mu - rf[k] / rn for k in range(3)]
            for k in range(3):
                hs[k] += h[k] / hn; es[k] += ev[k]
        n = len(samples)
        hs = [x / n for x in hs]; es = [x / n for x in es]
        hl = math.sqrt(sum(x * x for x in hs)); hs = [x / hl for x in hs]
        inc = math.degrees(math.acos(max(-1, min(1, hs[2]))))
        node = [-hs[1], hs[0], 0.0]; nl = math.hypot(node[0], node[1])
        if nl < 1e-9:
            node = [1.0, 0.0, 0.0]; nl = 1.0
        node = [x / nl for x in node]
        Om = math.degrees(math.atan2(node[1], node[0])) % 360
        ecc = math.sqrt(sum(x * x for x in es))
        cr = [node[1] * es[2] - node[2] * es[1], node[2] * es[0] - node[0] * es[2], node[0] * es[1] - node[1] * es[0]]
        om = math.degrees(math.atan2(sum(cr[k] * hs[k] for k in range(3)), sum(node[k] * es[k] for k in range(3)))) % 360
        T = samples[0][0]
        if ecc > max(0.2, 3 * o['e'] + 0.05):
            print('  skipped mean orientation (barycentric or chaotic orbit):', b['n'], round(ecc, 3))
            continue
        o.update({'e': round(ecc, 7), 'i': round(inc, 5), 'O': round(Om, 5), 'w': round(om, 5), 'ep': T})
        # the epoch moved, so re-express the mean anomaly rate convention: keep n as mean-longitude rate if flagged
        nmean += 1
    print('mean orientation from Horizons for', nmean, 'regular moons')

ANCHOR = os.path.join(ROOT, 'val', 'anchor.json')
T0, T1 = 2461041.5, 2451545.0
if os.path.exists(ANCHOR):
    anc = json.load(open(ANCHOR))
    fitted = phased = 0
    for b in bodies:
        if b['k'] != 'moon' or 'code' not in b or b['id'] == 'moon':
            continue
        o = b['orb']
        r0 = anc.get(f"{b['code']}@{T0}"); r1 = anc.get(f"{b['code']}@{T1}")
        if not r0:
            continue
        rateM = o['n'] - (o.get('dO', 0) + o.get('dw', 0) if o.get('nl') else 0)
        M0 = _mean_anomaly(o, r0[:3], T0)
        newo = dict(o)
        dt = T0 - o['ep']
        newo['O'] = (o['O'] + o.get('dO', 0) * dt) % 360
        newo['w'] = (o['w'] + o.get('dw', 0) * dt) % 360
        newo['ep'] = T0; newo['M'] = M0; newo.pop('nl', None); newo['n'] = rateM
        if r1:
            M1 = _mean_anomaly(newo, r1[:3], T1)
            pred = rateM * (T1 - T0)
            d0 = M1 - M0
            k = round((pred - d0) / 360)
            newo['n'] = (d0 + 360 * k) / (T1 - T0)
            fitted += 1
        else:
            phased += 1
        newo.pop('_fb', None)
        b['orb'] = newo
        b['src'] = b['src'].replace('mean elements', 'mean elements, phased to JPL Horizons')
    print('anchored moons: fitted', fitted, 'phase-only', phased)


# ---------------------------------------------------------------------------
# Time series from JPL Horizons (1950–2050):
#   irregular moons -> tabulated osculating elements every 2 years (blended in the app)
#   regular moons   -> mean-anomaly corrections every 3 months on top of the anchored mean elements
# ---------------------------------------------------------------------------
def _pos(o, jd):
    dt = jd - o['ep']
    rate = o['n'] - ((o.get('dO', 0) + o.get('dw', 0)) if o.get('nl') else 0)
    M = math.radians(o['M'] + rate * dt); e = o['e']
    E = M
    for _ in range(60):
        E -= (E - e * math.sin(E) - M) / (1 - e * math.cos(E))
    x, y = o['a'] * (math.cos(E) - e), o['a'] * math.sqrt(1 - e * e) * math.sin(E)
    P, Q = _pq(o, jd)
    return [x * P[k] + y * Q[k] for k in range(3)], P, Q

SERIES = os.path.join(ROOT, 'val', 'series.json')
if os.path.exists(SERIES):
    ser = json.load(open(SERIES))
    ntab = ncorr = 0
    for b in bodies:
        if b['k'] != 'moon' or 'code' not in b or b['id'] == 'moon':
            continue
        sr = ser.get(str(b['code']))
        if not sr or not sr.get('rows'):
            continue
        rows = sr['rows']
        if sr['kind'] == 'ELEMENTS':
            t0 = rows[0][0]
            tab = []
            for r in rows:
                jd, e, q, inc, O, w, Tp, n, M, TA, a = r[:11]
                if not (0 <= e < 1) or a <= 0:
                    tab = None; break
                tab.append([round(jd - t0, 3), round(a, 1), round(e, 7), round(inc, 5), round(O % 360, 5), round(w % 360, 5),
                            round(M % 360, 5), float(f'{n * 86400:.9g}')])
            if tab:
                b['orb'] = {'t': 'tab', 't0': t0, 'rows': tab}
                b['src'] = 'Orbit: JPL Horizons osculating elements, sampled every 2 years (1950–2050)'
                ntab += 1
        else:
            o = b['orb']
            t0 = rows[0][0]
            dvals, offs = [], []
            prev = None
            for r in rows:
                jd, x, y, z = r[0], r[1], r[2], r[3]
                m, P, Q = _pos(o, jd)
                lt = math.degrees(math.atan2(x * Q[0] + y * Q[1] + z * Q[2], x * P[0] + y * P[1] + z * P[2]))
                lm = math.degrees(math.atan2(sum(m[k] * Q[k] for k in range(3)), sum(m[k] * P[k] for k in range(3))))
                d = lt - lm
                if prev is not None:
                    d -= 360 * round((d - prev) / 360)
                else:
                    d -= 360 * round(d / 360)
                prev = d
                offs.append(round(jd - t0, 2)); dvals.append(round(d, 3))
            o['dM'] = {'t0': t0, 'd': offs, 'v': dvals}
            b['src'] = b['src'].replace('phased to JPL Horizons', 'corrected against JPL Horizons every 3 months (1950–2050)')
            ncorr += 1
    print('series: tabulated', ntab, 'corrected', ncorr)

by_id['moon']['n'] = 'Moon'
by_id['moon']['orb']['lunar'] = 1
by_id['moon']['src'] = 'Orbit: ELP-2000/82 lunar theory, main terms (Meeus); mean elements for the orbit outline'
by_id['titan']['haze'] = 'titan-haze'
by_id['titan']['atm'] = '#d9a654'
by_id['triton']['atm'] = '#d4e6ff'

# ---------------------------------------------------------------------------
# Featured small bodies from JPL SBDB (full-precision osculating elements)
# ---------------------------------------------------------------------------
INTERSTELLAR = {'1I', '2I', '3I'}
SHORT_NAMES = {}


def phys(d, key):
    for p in d.get('phys_par', []):
        if p['name'] == key and p['value'] not in (None, ''):
            return p['value']
    return None


def sb_orbit(d):
    el = {e['name']: e['value'] for e in d['orbit']['elements']}
    f = lambda k: float(el[k]) if el.get(k) not in (None, '') else None
    e = f('e'); i = f('i'); om = f('om'); w = f('w')
    ep = float(d['orbit']['epoch'])
    if e < 1:
        a = f('a') * AU
        n = f('n')
        ma = f('ma')
        if ma is None:
            tp = f('tp'); ma = (n * (ep - tp)) % 360
        return {'t': 'kep', 'a': a, 'e': e, 'i': i, 'O': om, 'w': w, 'M': ma % 360, 'ep': ep, 'n': n, 'fr': 'ecl'}
    return {'t': 'hyp', 'q': f('q') * AU, 'e': e, 'i': i, 'O': om, 'w': w, 'tp': f('tp'), 'mu': GM_SUN, 'fr': 'ecl'}


def h_to_d(H, p=0.14):
    return 1329 / math.sqrt(p) * 10 ** (-H / 5)


featured_desigs = set()
for fn in sorted(glob.glob(os.path.join(ROOT, 'jpl', 'obj', '*.json'))):
    d = json.load(open(fn))
    o = d['object']
    full = o['fullname'].strip()
    key = os.path.basename(fn)[:-5].replace('_', ' ')
    kind = o['kind']
    pdes = o.get('des')
    featured_desigs.add(pdes)
    if 'prefix' in o and o.get('prefix'):
        pass
    name = o.get('shortname') or full
    num = None
    m = re.match(r'^(\d+) (.+?)(?: \((.+)\))?$', full)
    if kind.startswith('a') and m:
        num = int(m.group(1))
        name = m.group(2)
        if name.startswith('(') and name.endswith(')'):  # numbered but unnamed: "(153591) 2001 SN263"
            name = f'({num}) {name[1:-1]}'
    elif kind.startswith('a'):
        name = re.sub(r'^\((.*)\)$', r'\1', full)
    else:
        name = full
    name = name.replace('`', 'ʻ')
    name = {'1I': 'ʻOumuamua', '2I': '2I/Borisov', '3I': '3I/ATLAS'}.get(key, name)
    cls = (o.get('orbit_class') or {}).get('code')
    is_comet = kind.startswith('c')
    k = 'comet' if is_comet else 'asteroid'
    if key in INTERSTELLAR:
        k = 'interstellar'
    if num == 134340:
        continue  # Pluto already handled
    if num in DWARF_IAU or num in DWARF_CANDIDATES:
        k = 'dwarf'
    bid = slug(name if not name.startswith('(') else (o.get('des') or name))
    if num == 1:
        bid = 'ceres'
    b = {'id': bid, 'n': name, 'k': k, 'p': 'sun', 'orb': sb_orbit(d), 'cls': cls, 'full': full,
         'src': f"Orbit: JPL Small-Body Database, osculating elements at JD {d['orbit']['epoch']}"}
    if num:
        b['num'] = num
    if num in DWARF_CANDIDATES:
        b['cand'] = 1
    D = phys(d, 'diameter')
    ext = phys(d, 'extent')
    H = phys(d, 'H')
    if D:
        b['r'] = float(D) / 2
    if ext:
        try:
            ax = [float(x) / 2 for x in re.split(r'\s*x\s*', ext.strip())]
            if len(ax) == 3:
                b['ax'] = ax
                b.setdefault('r', r6(sum(ax) / 3))
        except ValueError:
            pass
    rp = phys(d, 'rot_per')
    if rp:
        b['rotP'] = float(rp)
    pole = phys(d, 'pole')
    if pole and '/' in pole:
        try:
            pr, pd = (float(x) for x in pole.split('/'))
            b['pole'] = [pr, pd]
        except ValueError:
            pass
    if H:
        b['H'] = float(H)
    alb = phys(d, 'albedo')
    if alb:
        b['alb'] = float(alb)
    gm = phys(d, 'GM')
    if gm:
        b['gm'] = float(gm)
    dens = phys(d, 'density')
    if dens:
        b['rho'] = float(dens)
    disc = d.get('discovery') or {}
    if disc.get('discovery'):
        b['disc'] = disc['discovery']
    elif disc.get('date'):
        b['disc'] = f"Discovered {disc['date']}" + (f" at {disc['location']}" if disc.get('location') else '')
    if disc.get('citation'):
        b['cite'] = re.sub(r'\s+', ' ', disc['citation']).strip()
    names_for_cel = [name, full, (o.get('des') or ''), f'{num} {name}' if num else '', key]
    ce = cel_lookup(*names_for_cel)
    cel_shape(ce, b)
    if 'r' not in b:
        if H:
            b['r'] = h_to_d(float(H), 0.04 if is_comet else 0.14) / 2; b['rEst'] = 1
        else:
            b['r'] = 2.0 if is_comet else 0.5; b['rEst'] = 1
    if 'tex' not in b:
        icy = cls in ('TNO', 'CEN') or is_comet or k == 'dwarf'
        b['tex'] = 'icy' if icy and not is_comet else 'asteroid'
        b['texGeneric'] = 1
    b['img'] = b['tex']
    if 'model' not in b and bid in HAVE_MODEL:
        b['model'] = bid
    if b.get('pole') and b.get('rotP'):
        b['rot'] = {'t': 'spin', 'pole': b.pop('pole'), 'P': b['rotP']}
    elif b.get('rotP'):
        b['rot'] = {'t': 'spin', 'P': b['rotP']}
    add(b)
    SHORT_NAMES[key] = b['id']
for did, tex in [('ceres', 'ceres'), ('vesta', 'vesta')]:
    if did in by_id:
        by_id[did]['tex'] = tex; by_id[did]['img'] = tex; by_id[did].pop('texGeneric', None)
        by_id[did]['rot'] = {'t': 'iau', 'v': IAU[did]}
        if did == 'ceres':
            by_id[did].pop('model', None); by_id[did].pop('ax', None)
for bid, mid in [('halley', 'halley')]:
    pass
if '1p-halley' in by_id:
    by_id['1p-halley']['model'] = 'halley'
if '67p-churyumov-gerasimenko' in by_id:
    by_id['67p-churyumov-gerasimenko'].update({'model': '67p', 'tex': '67p', 'img': '67p'})
    by_id['67p-churyumov-gerasimenko'].pop('texGeneric', None)

# ---------------------------------------------------------------------------
# Moons of dwarf planets and asteroids (Celestia catalog)
# ---------------------------------------------------------------------------
cel_parent_map = {}
for b in bodies:
    if b['k'] in ('asteroid', 'dwarf', 'comet', 'interstellar') or b['id'] in ('pluto',):
        for n in [b['n'], b.get('full', ''), str(b.get('num', ''))]:
            cel_parent_map[n.lower()] = b['id']
        ce = cel_lookup(b['n'], b.get('full', ''))
        if ce:
            for n in ce['names']:
                cel_parent_map[n.lower()] = b['id']
added_small_moons = []
for e in CEL_ALL:
    par = e['parent']
    if not par.startswith('Sol/'):
        continue
    pname = par.split('/', 1)[1]
    if pname in ('Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'):
        continue
    pid = cel_parent_map.get(pname.lower())
    if not pid:
        print('  no parent for', e['names'][0], pname)
        continue
    p = e['p']

    def cel_orbit(eo, of):
        a = eo['SemiMajorAxis']
        u = eo.get('SemiMajorAxis_unit')
        if u == 'AU': a *= AU
        elif u == 'm': a /= 1000
        ecc = eo.get('Eccentricity', 0.0); inc = eo.get('Inclination', 0.0)
        node = eo.get('AscendingNode', 0.0)
        w = eo['ArgOfPericenter'] if 'ArgOfPericenter' in eo else eo.get('LongOfPericenter', 0.0) - node
        M = eo['MeanAnomaly'] if 'MeanAnomaly' in eo else eo.get('MeanLongitude', 0.0) - (w + node)
        ep = eo.get('Epoch', 2451545.0)
        if isinstance(ep, str): ep = 2451545.0
        P = eo['Period']
        pu = eo.get('Period_unit')
        if pu == 'h': P /= 24
        elif pu == 'y': P *= 365.25
        fr = 'icrf' if (isinstance(of, dict) and 'EquatorJ2000' in of) else 'ecl'
        return {'t': 'kep', 'a': a, 'e': ecc, 'i': inc, 'O': node % 360, 'w': w % 360, 'M': M % 360, 'ep': ep,
                'n': 360.0 / P, 'fr': fr}

    if isinstance(p.get('EllipticalOrbit'), dict):
        orbit = cel_orbit(p['EllipticalOrbit'], p.get('OrbitFrame'))
    elif isinstance(p.get('Timeline'), list):
        phases = []
        for ph in p['Timeline']:
            if isinstance(ph, dict) and isinstance(ph.get('EllipticalOrbit'), dict):
                o = cel_orbit(ph['EllipticalOrbit'], ph.get('OrbitFrame'))
                phases.append({'end': ph.get('Ending'), 'o': o})
        orbit = {'t': 'tl', 'ph': phases}
    else:
        print('  no elliptical orbit for', e['names'][0]); continue
    name = e['names'][0]
    b = {'id': slug(name), 'n': name, 'k': 'moon', 'p': pid,
         'orb': orbit,
         'src': 'Orbit: Celestia catalog (published discovery/orbit solutions)'}
    if len(e['names']) > 1:
        b['alt'] = [n for n in e['names'][1:4]]
    cel_shape(e, b)
    if 'r' not in b:
        b['r'] = 1.0; b['rEst'] = 1
    if b['id'] in HAVE_TEX:
        b['tex'] = b['id']
    if b['id'] in HAVE_MODEL:
        b['model'] = b['id']
    if 'tex' not in b:
        b['tex'] = 'asteroid'; b['texGeneric'] = 1
    if b['tex'] in ('asteroid', 'icy', 'icymoon', 'rocky') and b['id'] not in HAVE_TEX:
        b['texGeneric'] = 1
    b['img'] = b['tex']
    b['rot'] = {'t': 'sync'}
    add(b)
    added_small_moons.append(name)
print('small-body moons:', len(added_small_moons))

# Rings on small bodies (Celestia)
for bid, rid in [('10199-chariklo', 'chariklo'), ('chariklo', 'chariklo'), ('haumea', 'haumea'), ('quaoar', 'quaoar'), ('chiron', 'chiron')]:
    if bid in by_id and 'ring' in by_id[bid] and not by_id[bid]['ring'].get('tex'):
        by_id[bid]['ring']['tex'] = f'{rid}-rings' if f'{rid}-rings' in HAVE_TEX else None

# ---------------------------------------------------------------------------
# Space stations (CelesTrak TLEs) and historic stations
# ---------------------------------------------------------------------------
def parse_tle(l1, l2):
    yy = int(l1[18:20]); doy = float(l1[20:32])
    year = 2000 + yy if yy < 57 else 1900 + yy
    ep = jd_from_iso(f'{year}-01-01T00:00:00') + doy - 1
    ndot2 = float(l1[33:43])
    inc = float(l2[8:16]); raan = float(l2[17:25]); ecc = float('0.' + l2[26:33].strip())
    argp = float(l2[34:42]); ma = float(l2[43:51]); nrev = float(l2[52:63])
    n = nrev * 360.0  # deg/day
    mu = GM['earth']
    nrad = nrev * 2 * math.pi / 86400
    a = (mu / nrad ** 2) ** (1 / 3)
    J2, Re = 1.08262668e-3, 6378.137
    pp = a * (1 - ecc ** 2)
    fac = 1.5 * n * J2 * (Re / pp) ** 2
    dO = -fac * math.cos(math.radians(inc))
    dw = fac * (2 - 2.5 * math.sin(math.radians(inc)) ** 2)
    ep += 69.184 / 86400  # TLE epochs are UTC; the app evaluates orbits in TDB
    raan -= 0.0128 * ((ep - 2451545.0) / 365.25)  # TEME (equinox of date) -> J2000: precession in right ascension
    return {'t': 'kep', 'a': round(a, 3), 'e': ecc, 'i': inc, 'O': raan, 'w': argp, 'M': ma, 'ep': round(ep, 7),
            'n': n, 'dO': dO, 'dw': dw, 'm2': ndot2 * 360.0, 'fr': 'icrf'}, ep


tl = [l.rstrip() for l in open(os.path.join(ROOT, 'jpl', 'tles.txt')) if l.strip()]
tles = {}
for k in range(0, len(tl) - 2, 3):
    tles[tl[k].strip()] = (tl[k + 1], tl[k + 2])
STATIONS = [
    ('iss', 'International Space Station', 'ISS (ZARYA)', 'iss', 0.0545, '1998-11-20'),
    ('tiangong', 'Tiangong Space Station', 'CSS (TIANHE)', None, 0.0275, '2021-04-29'),
    ('hubble', 'Hubble Space Telescope', 'HST', 'hubble', 0.0066, '1990-04-25'),
]
for sid, name, tname, model, size, launch in STATIONS:
    if tname not in tles:
        print('  missing TLE', tname); continue
    orb, ep = parse_tle(*tles[tname])
    b = {'id': sid, 'n': name, 'k': 'station' if sid != 'hubble' else 'spacecraft', 'p': 'earth', 'r': size,
         'orb': orb, 'life': [jd_from_iso(launch + 'T00:00:00'), None], 'tleEp': ep,
         'src': f'Orbit: CelesTrak TLE (epoch JD {ep:.3f}), propagated with J2 secular rates'}
    if model:
        b['model'] = model; b['img'] = 'model:' + model
    add(b)
for h in STATIONS_HISTORIC:
    a = 6378.137 + h['alt']
    n = math.degrees(math.sqrt(GM['earth'] / a ** 3)) * 86400
    life = [jd_from_iso(h['launch'] + 'T00:00:00'), jd_from_iso(h['end'] + 'T00:00:00')]
    b = {'id': h['id'], 'n': h['n'], 'k': 'station', 'p': 'earth', 'r': h['size'], 'hist': 1,
         'orb': {'t': 'kep', 'a': a, 'e': 0.0005, 'i': h['inc'], 'O': h.get('O', 0), 'w': 0, 'M': 0, 'ep': life[0], 'n': n,
                 'fr': 'icrf', 'approx': 1},
         'post': {'t': 'fix', 'lat': h['lat'], 'lon': h['lon']}, 'life': life, 'site': h['site'],
         'src': 'Orbit while active: approximate (inclination and altitude only). After re-entry: fixed at its debris/re-entry site.'}
    if h.get('model'):
        b['model'] = h['model']; b['img'] = 'model:' + h['model']
    add(b)

# Tesla Roadster (JPL Horizons, heliocentric ecliptic J2000)
add({'id': 'tesla-roadster', 'n': "Starman's Tesla Roadster", 'k': 'spacecraft', 'p': 'sun', 'r': 0.002,
     'orb': {'t': 'kep', 'a': 1.982564925418293e8, 'e': 0.2559605479459477, 'i': 1.07477945878957, 'O': 316.8723236093807,
             'w': 177.789221264071, 'M': 273.3210878363136, 'ep': 2461362.5, 'n': 7.477171149897862e-06 * 86400, 'fr': 'ecl'},
     'life': [jd_from_iso('2018-02-07T00:00:00'), None],
     'src': 'Orbit: JPL Horizons osculating elements (target -143205) at 2026-11-18'})

# ---------------------------------------------------------------------------
# Shoemaker–Levy 9: reconstructed final orbit around Jupiter
# ---------------------------------------------------------------------------
GMJ = GM['jupiter']
P_sl9 = 741.0
a_sl9 = (GMJ * (P_sl9 * 86400 / (2 * math.pi)) ** 2) ** (1 / 3)
q_sl9 = 55000.0
e_sl9 = 1 - q_sl9 / a_sl9
first = True
for frag, when in SL9_IMPACTS:
    tp = jd_from_iso(when)
    b = {'id': 'sl9-' + slug(frag), 'n': f'Shoemaker–Levy 9 fragment {frag}', 'k': 'historic', 'p': 'jupiter', 'r': 0.5,
         'orb': {'t': 'kep', 'a': a_sl9, 'e': e_sl9, 'i': 96.0, 'O': 291.0, 'w': 316.0, 'M': 0.0, 'ep': tp,
                 'n': 360.0 / P_sl9, 'fr': 'pole', 'pole': IAU['jupiter'][:2], 'approx': 1},
         'life': [jd_from_iso('1992-07-08T00:00:00'), tp], 'tex': 'asteroid', 'texGeneric': 1, 'img': 'asteroid', 'grp': 'sl9',
         'rEst': 1, 'src': 'Orbit: approximate reconstruction (2-year Jupiter orbit, perijove inside Jupiter). Impact time from observations.'}
    if first:
        b['id'] = 'shoemaker-levy-9'; b['n'] = 'Shoemaker–Levy 9 (fragment A)'; first = False
    add(b)
add({'id': 'sl9-impacts', 'n': 'Shoemaker–Levy 9 impact sites', 'k': 'historic', 'p': 'jupiter', 'r': 6000,
     'orb': {'t': 'fix', 'lat': -44.0, 'lon': 40.0}, 'life': [jd_from_iso('1994-07-16T20:00:00'), jd_from_iso('1994-12-31T00:00:00')],
     'grp': 'sl9', 'marker': 1, 'src': 'Impact latitude 44°S from observations; longitude shown is indicative.'})

# ---------------------------------------------------------------------------
# Black holes (fixed positions, heliocentric distance)
# ---------------------------------------------------------------------------
LY = 9.4607304725808e12
for h in BLACK_HOLES:
    add({'id': h['id'], 'n': h['n'], 'k': 'blackhole', 'p': 'sun', 'r': 2.953 * h['mass'],
         'orb': {'t': 'radec', 'ra': h['ra'], 'dec': h['dec'], 'd': h['ly'] * LY}, 'mass': h['mass'], 'ly': h['ly'],
         'src': 'Position: catalog right ascension, declination and distance (fixed reference point)'})

# ---------------------------------------------------------------------------
# Facts & counts
# ---------------------------------------------------------------------------
for b in bodies:
    f = FACTS.get(b['id'])
    if f:
        b['fact'] = f
for pid, n in n_moons.items():
    by_id[pid]['nMoons'] = n

# ---------------------------------------------------------------------------
# Comets: entire SBDB comet list (minus featured ones), compact rows
# ---------------------------------------------------------------------------
cm = json.load(open(os.path.join(ROOT, 'jpl', 'sb', 'comets_fp.json')))
comets = []
feat_comet_names = {b.get('full', '') for b in bodies if b['k'] in ('comet', 'interstellar')}
for r in cm['data']:
    name, e, q, tp, i, om, w, a, ep, cls, D, M1 = r
    name = name.strip()
    if name in feat_comet_names:
        continue
    try:
        e, q, tp, i, om, w = map(float, (e, q, tp, i, om, w))
    except (TypeError, ValueError):
        continue
    comets.append([name, round(q, 7), round(e, 7), round(tp, 5), round(i, 5), round(om, 5), round(w, 5), cls])

# ---------------------------------------------------------------------------
# Stars (HYG v4.1): naked-eye stars and everything within 100 light-years
# ---------------------------------------------------------------------------
stars = []
hyg = os.path.join(ROOT, 'src', 'HYG-Database', 'hyg', 'CURRENT', 'hygdata_v41.csv')
for r in csv.DictReader(open(hyg)):
    if r['proper'] == 'Sol':
        continue
    mag = float(r['mag']); dist = float(r['dist'])
    if dist <= 0 or dist >= 100000:
        continue
    ly = dist * 3.26156
    if not (mag <= 6.5 or ly <= 100):
        continue
    nm = r['proper']
    if not nm and r['bf']:
        nm = r['bf'].strip()
    if not nm and r['gl']:
        nm = r['gl'].strip()
    if not nm and r['hip']:
        nm = 'HIP ' + r['hip']
    if not nm and r['hd']:
        nm = 'HD ' + r['hd']
    ci = r['ci']
    stars.append([round(float(r['x']), 5), round(float(r['y']), 5), round(float(r['z']), 5), round(float(r['absmag']), 2),
                  round(float(ci), 3) if ci else 0.65, r['spect'][:10], nm, r['con'], 1 if r['proper'] else 0])
print('stars', len(stars))

catalog = {
    'generated': datetime.date.today().isoformat(),
    'bodies': bodies,
    'comets': comets,
    'starFacts': STAR_FACTS,
}
with open(os.path.join(OUT, 'catalog.js'), 'w') as f:
    f.write('window.CATALOG=' + json.dumps(catalog, separators=(',', ':'), ensure_ascii=False) + ';\n')
with open(os.path.join(OUT, 'stars.js'), 'w') as f:
    f.write('window.STARS=' + json.dumps(stars, separators=(',', ':'), ensure_ascii=False) + ';\n')
from collections import Counter
print('bodies', len(bodies), Counter(b['k'] for b in bodies))
print('comets', len(comets))
print('catalog.js', os.path.getsize(os.path.join(OUT, 'catalog.js')) // 1024, 'KB; stars.js', os.path.getsize(os.path.join(OUT, 'stars.js')) // 1024, 'KB')
