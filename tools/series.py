import json, subprocess, urllib.parse, os, time, sys
d = json.load(open('jpl/jpl_tables.json'))
CENTER = {'Earth': '399', 'Mars': '499', 'Jupiter': '599', 'Saturn': '699', 'Uranus': '799', 'Neptune': '899', 'Pluto': '999'}
OUT = 'val/series.json'
out = json.load(open(OUT)) if os.path.exists(OUT) else {}
RANGES = [('1950-01-01', '2050-01-02'), ('1980-01-01', '2040-01-02'), ('2000-01-01', '2035-01-02'), ('2015-01-01', '2032-01-02')]
def query(code, center, kind, start, stop, step):
    q = {'format': 'json', 'COMMAND': f"'{code}'", 'EPHEM_TYPE': kind, 'CENTER': f"'500@{center}'", 'REF_PLANE': 'ECLIPTIC',
         'REF_SYSTEM': 'J2000', 'OUT_UNITS': 'KM-S', 'START_TIME': f"'{start}'", 'STOP_TIME': f"'{stop}'", 'STEP_SIZE': f"'{step}'",
         'CSV_FORMAT': 'YES', 'OBJ_DATA': 'NO'}
    if kind == 'VECTORS': q['VEC_TABLE'] = '1'
    url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)
    r = subprocess.run(['curl', '-s', '--max-time', '120', url], capture_output=True, text=True).stdout
    res = json.loads(r)['result']
    rows = res.split('$$SOE')[1].split('$$EOE')[0].strip().split('\n')
    return [[float(x) for i, x in enumerate(row.split(',')) if i != 1 and x.strip()] for row in rows]
n = 0
for r in d['el'][1:]:
    code, planet, frame = r[3], r[1], r[5]
    if code in out or planet == 'Earth':
        continue
    kind, step = ('ELEMENTS', '2Y') if frame == 'ecliptic' else ('VECTORS', '3MO')
    data = None
    for (a, b) in RANGES:
        for attempt in range(2):
            try:
                data = query(code, CENTER[planet], kind, a, b, step); break
            except Exception:
                time.sleep(2)
        if data: break
    out[code] = {'kind': kind, 'rows': data}
    n += 1
    if n % 25 == 0:
        json.dump(out, open(OUT, 'w')); print(n, flush=True)
json.dump(out, open(OUT, 'w'))
print('done', sum(1 for v in out.values() if v['rows']), 'of', len(out))
