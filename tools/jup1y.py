import json, subprocess, urllib.parse, time
d = json.load(open('jpl/jpl_tables.json'))
ser = json.load(open('val/series.json'))
n = 0
for r in d['el'][1:]:
    if r[1] != 'Jupiter' or r[5] != 'ecliptic': continue
    code = r[3]
    if ser.get(code, {}).get('step') == '1Y': continue
    q = {'format': 'json', 'COMMAND': f"'{code}'", 'EPHEM_TYPE': 'ELEMENTS', 'CENTER': "'500@599'", 'REF_PLANE': 'ECLIPTIC', 'REF_SYSTEM': 'J2000',
         'OUT_UNITS': 'KM-S', 'START_TIME': "'1950-01-01'", 'STOP_TIME': "'2050-01-02'", 'STEP_SIZE': "'1Y'", 'CSV_FORMAT': 'YES', 'OBJ_DATA': 'NO'}
    for attempt in range(3):
        try:
            res = subprocess.run(['curl', '-s', '--max-time', '120', 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)], capture_output=True, text=True).stdout
            rows = json.loads(res)['result'].split('$$SOE')[1].split('$$EOE')[0].strip().split('\n')
            ser[code] = {'kind': 'ELEMENTS', 'step': '1Y', 'rows': [[float(x) for i, x in enumerate(row.split(',')) if i != 1 and x.strip()] for row in rows]}
            break
        except Exception:
            time.sleep(3)
    n += 1
json.dump(ser, open('val/series.json', 'w'))
print('updated', n)
