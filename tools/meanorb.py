import json, subprocess, urllib.parse, os, time
d = json.load(open('jpl/jpl_tables.json'))
CENTER = {'Mars': '499', 'Jupiter': '599', 'Saturn': '699', 'Uranus': '799', 'Neptune': '899', 'Pluto': '999'}
OUT = 'val/meanorb.json'
out = json.load(open(OUT)) if os.path.exists(OUT) else {}
T0 = 2461041.5
ser = json.load(open('val/series.json'))
for r in d['el'][1:]:
    code, planet, frame, a, P = r[3], r[1], r[5], float(r[7]), float(r[13])
    if planet == 'Earth' or code in out:
        continue
    far = frame != 'ecliptic' and a > 5e6
    if frame == 'ecliptic' and not far:
        continue
    if far:  # treat as irregular: elements series
        q = {'format': 'json', 'COMMAND': f"'{code}'", 'EPHEM_TYPE': 'ELEMENTS', 'CENTER': f"'500@{CENTER[planet]}'", 'REF_PLANE': 'ECLIPTIC',
             'REF_SYSTEM': 'J2000', 'OUT_UNITS': 'KM-S', 'START_TIME': "'1950-01-01'", 'STOP_TIME': "'2050-01-02'", 'STEP_SIZE': "'2Y'", 'CSV_FORMAT': 'YES', 'OBJ_DATA': 'NO'}
        res = subprocess.run(['curl', '-s', '--max-time', '120', 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)], capture_output=True, text=True).stdout
        rows = json.loads(res)['result'].split('$$SOE')[1].split('$$EOE')[0].strip().split('\n')
        ser[code] = {'kind': 'ELEMENTS', 'rows': [[float(x) for i, x in enumerate(row.split(',')) if i != 1 and x.strip()] for row in rows]}
        out[code] = 'irregular'
        print('irregular', r[2], flush=True)
        continue
    q = {'format': 'json', 'COMMAND': f"'{code}'", 'EPHEM_TYPE': 'VECTORS', 'CENTER': f"'500@{CENTER[planet]}'", 'REF_PLANE': 'ECLIPTIC',
         'REF_SYSTEM': 'J2000', 'OUT_UNITS': 'KM-S', 'START_TIME': f"'JD{T0}'", 'STOP_TIME': f"'JD{T0 + P}'", 'STEP_SIZE': "'72'",
         'VEC_TABLE': '2', 'CSV_FORMAT': 'YES', 'OBJ_DATA': 'NO'}
    for attempt in range(3):
        try:
            res = subprocess.run(['curl', '-s', '--max-time', '120', 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)], capture_output=True, text=True).stdout
            rows = json.loads(res)['result'].split('$$SOE')[1].split('$$EOE')[0].strip().split('\n')
            out[code] = [[float(x) for i, x in enumerate(row.split(',')) if i != 1 and x.strip()] for row in rows]
            break
        except Exception:
            time.sleep(2)
json.dump(out, open(OUT, 'w')); json.dump(ser, open('val/series.json', 'w'))
print('done', len(out))
