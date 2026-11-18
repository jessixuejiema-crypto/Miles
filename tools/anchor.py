import json, subprocess, urllib.parse, sys, os, time
d = json.load(open('jpl/jpl_tables.json'))
CENTER = {'Earth': '399', 'Mars': '499', 'Jupiter': '599', 'Saturn': '699', 'Uranus': '799', 'Neptune': '899', 'Pluto': '999'}
T0 = 2461041.5  # 2026-01-01
T1 = 2451545.0
out = json.load(open('val/anchor.json')) if os.path.exists('val/anchor.json') else {}
n = 0
for r in d['el'][1:]:
    code, planet = r[3], r[1]
    for T in (T0, T1):
        key = f'{code}@{T}'
        if key in out: continue
        q = {'format': 'json', 'COMMAND': f"'{code}'", 'EPHEM_TYPE': 'VECTORS', 'CENTER': f"'500@{CENTER[planet]}'", 'REF_PLANE': 'ECLIPTIC',
             'REF_SYSTEM': 'J2000', 'OUT_UNITS': 'KM-S', 'TLIST': f"'{T}'", 'VEC_TABLE': '2', 'CSV_FORMAT': 'YES', 'OBJ_DATA': 'NO'}
        url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)
        for attempt in range(3):
            res = subprocess.run(['curl', '-s', '--max-time', '60', url], capture_output=True, text=True).stdout
            try:
                body = json.loads(res)['result'].split('$$SOE')[1].split('$$EOE')[0].strip().split(',')
                out[key] = [float(x) for x in body[2:8]]
                break
            except Exception:
                out[key] = None
                time.sleep(2)
        n += 1
        if n % 40 == 0:
            json.dump(out, open('val/anchor.json', 'w'))
            print(n, flush=True)
json.dump(out, open('val/anchor.json', 'w'))
print('done', sum(1 for v in out.values() if v), 'of', len(out))
