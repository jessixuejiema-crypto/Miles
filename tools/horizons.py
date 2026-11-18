import json, subprocess, urllib.parse, sys
# (catalog id, Horizons target, Horizons center)
TARGETS = [('earth','399','500@10'), ('mars','499','500@10'), ('jupiter','599','500@10'), ('neptune','899','500@10'), ('pluto','999','500@10'),
           ('moon','301','500@399'), ('io','501','500@599'), ('europa','502','500@599'), ('titan','606','500@699'), ('mimas','601','500@699'),
           ('iapetus','608','500@699'), ('miranda','705','500@799'), ('titania','703','500@799'), ('triton','801','500@899'), ('charon','901','500@999'),
           ('phobos','401','500@499'), ('himalia','506','500@599'), ('phoebe','609','500@699'), ('nereid','802','500@899'),
           ('eros','433;','500@10'), ('ceres','1;','500@10'), ('apophis','99942;','500@10'), ('1p-halley','DES=1P;CAP','500@10'), ('eris','136199;','500@10'),
           ('iss','-125544','500@399')]
JDS = [2451545.0, 2461362.5, 2455000.5]
out = {}
for cid, tgt, ctr in TARGETS:
    for jd in JDS:
        q = {'format': 'json', 'COMMAND': f"'{tgt}'", 'EPHEM_TYPE': 'VECTORS', 'CENTER': f"'{ctr}'", 'REF_PLANE': 'ECLIPTIC', 'REF_SYSTEM': 'J2000',
             'OUT_UNITS': 'KM-S', 'TLIST': f"'{jd}'", 'VEC_TABLE': '1', 'CSV_FORMAT': 'YES', 'OBJ_DATA': 'NO'}
        url = 'https://ssd.jpl.nasa.gov/api/horizons.api?' + urllib.parse.urlencode(q)
        r = subprocess.run(['curl', '-s', '--max-time', '60', url], capture_output=True, text=True).stdout
        try:
            res = json.loads(r)['result']
            body = res.split('$$SOE')[1].split('$$EOE')[0].strip().split(',')
            out[f'{cid}@{jd}'] = [float(body[2]), float(body[3]), float(body[4])]
        except Exception as ex:
            out[f'{cid}@{jd}'] = None
            print('fail', cid, jd, (r[:200] if r else ''), file=sys.stderr)
json.dump(out, open('val/horizons.json', 'w'), indent=0)
print(len([v for v in out.values() if v]), 'vectors')
