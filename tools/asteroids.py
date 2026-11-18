import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
WORK = _os.environ.get('EPH_WORK', _os.path.join(REPO, 'tools', 'work'))
import json, glob, math, re, struct, os
import numpy as np
SB = _os.path.join(WORK, 'jpl/sbfp')
OUT = _os.path.join(REPO, 'data/asteroids')
E0 = 2461200.5
K = 0.01720209895 * 180 / math.pi  # Gaussian constant, deg/day
CLASSES = ['AST', 'MBA', 'IMB', 'OMB', 'APO', 'ATE', 'AMO', 'IEO', 'MCA', 'TJN', 'CEN', 'TNO', 'PAA', 'HYA']
CI = {c: i for i, c in enumerate(CLASSES)}
LNA0, LNA1 = math.log(0.1), math.log(5000.0)
CHUNK = 200000

def rows(prefix):
    for f in sorted(glob.glob(f'{SB}/{prefix}_*.json')):
        d = json.load(open(f))
        fields = d['fields']
        for r in d['data']:
            yield dict(zip(fields, r))

def fnum(x):
    try: return float(x)
    except (TypeError, ValueError): return None

def encode(r):
    a, e, i, om, w, ma, ep = (fnum(r[k]) for k in ('a', 'e', 'i', 'om', 'w', 'ma', 'epoch'))
    H, D = fnum(r['H']), fnum(r['diameter'])
    rec = [0] * 8
    if None in (a, e, i, om, w, ma, ep) or a <= 0 or e >= 1:
        return rec, False
    n = K / a ** 1.5
    M = (ma + n * (E0 - ep)) % 360.0
    rec[0] = max(1, min(65535, round((math.log(a) - LNA0) / (LNA1 - LNA0) * 65535)))
    rec[1] = min(65535, round(e * 65535))
    rec[2] = min(65535, round(i / 180 * 65535))
    rec[3] = round(om % 360 / 360 * 65535) % 65536
    rec[4] = round(w % 360 / 360 * 65535) % 65536
    rec[5] = round(M / 360 * 65535) % 65536
    if D and D > 0:
        rec[6] = max(1, min(65535, round(math.log10(D * 1000) / 7 * 65535)))
    hc = 0 if H is None else max(1, min(255, round((H + 2) * 8)))
    rec[7] = (hc << 8) | CI.get(r['class'], 0)
    return rec, True

DES = re.compile(r'^(\d{4}) ([A-Z])([A-Z])(\d*)$')
def pack_desig(s):
    m = DES.match(s)
    if not m: return None
    y, l1, l2, num = int(m.group(1)), ord(m.group(2)) - 65, ord(m.group(3)) - 65, int(m.group(4) or 0)
    if not (1800 <= y < 2824) or num > 4095: return None
    return ((y - 1800) << 22) | (l1 << 17) | (l2 << 12) | num

meta = {'epoch': E0, 'classes': CLASSES, 'lnA': [LNA0, LNA1], 'chunks': []}
names = {}
exceptions = {}
stats = {'valid': 0, 'invalid': 0}

def flush(kind, recs, first, desigs, idx):
    fn = f'a{idx:02d}.bin'
    arr = np.array(recs, dtype='<u2')
    with open(f'{OUT}/{fn}', 'wb') as f:
        f.write(b'AST2'); f.write(struct.pack('<III', len(recs), first, 1 if desigs is not None else 0))
        f.write(arr.tobytes())
        if desigs is not None:
            f.write(np.array(desigs, dtype='<u4').tobytes())
    meta['chunks'].append({'file': fn, 'count': len(recs), 'first': first, 'kind': kind, 'bytes': os.path.getsize(f'{OUT}/{fn}')})

idx = 0
recs = []; first = 1
for r in rows('num'):
    fn_ = r['full_name'].strip()
    num = int(fn_.split()[0])
    m = re.match(r'^\d+ ([^(]+?)\s*(\(|$)', fn_)
    if m and m.group(1).strip():
        names[num] = m.group(1).strip()
    rec, ok = encode(r); stats['valid' if ok else 'invalid'] += 1
    recs.append(rec)
    if len(recs) == CHUNK:
        flush('numbered', recs, first, None, idx); idx += 1; first += len(recs); recs = []
if recs:
    flush('numbered', recs, first, None, idx); idx += 1; recs = []
desigs = []; ex = {}
for r in rows('unn'):
    s = r['full_name'].strip().strip('()').strip()
    rec, ok = encode(r); stats['valid' if ok else 'invalid'] += 1
    p = pack_desig(s)
    if p is None:
        ex[len(recs)] = s; p = 0
    recs.append(rec); desigs.append(p)
    if len(recs) == CHUNK:
        exceptions[f'a{idx:02d}.bin'] = ex; flush('provisional', recs, 0, desigs, idx); idx += 1; recs = []; desigs = []; ex = {}
if recs:
    exceptions[f'a{idx:02d}.bin'] = ex; flush('provisional', recs, 0, desigs, idx); idx += 1
meta['total'] = sum(c['count'] for c in meta['chunks'])
meta['stats'] = stats
json.dump(names, open(f'{OUT}/names.json', 'w'), separators=(',', ':'), ensure_ascii=False)
json.dump(exceptions, open(f'{OUT}/exceptions.json', 'w'), separators=(',', ':'))
json.dump(meta, open(f'{OUT}/index.json', 'w'), indent=1)
print(json.dumps(meta['stats']), meta['total'], 'named', len(names), 'exceptions', sum(len(v) for v in exceptions.values()))
