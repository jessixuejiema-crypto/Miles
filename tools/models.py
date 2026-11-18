import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
WORK = _os.environ.get('EPH_WORK', _os.path.join(REPO, 'tools', 'work'))
import sys, os, glob, shutil
sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
import meshconv
from PIL import Image
C = _os.path.join(WORK, 'src/CelestiaContent')
OUT = _os.path.join(REPO, 'models')
total = 0
info = {}
def tri_count(path):
    mats, meshes = meshconv.read_3ds(path) if path.endswith('.3ds') else meshconv.read_cmod(path)
    return sum(len(g[1]) for m in meshes for g in m[3]) // 3
for src in sorted(glob.glob(f'{C}/models/*.cmod')) + [f'{C}/extras-standard/99942_apophis/models/apophis.cmod']:
    name = os.path.basename(src)[:-5]
    n = tri_count(src)
    cells = None
    if n > 24000: cells = 72
    h = meshconv.convert(src, f'{OUT}/{name}.msh', cells)
    if cells and h["icount"] // 3 > 30000:
        h = meshconv.convert(src, f"{OUT}/{name}.msh", 56)
    sz = os.path.getsize(f'{OUT}/{name}.msh'); total += sz
    info[name] = (n, h['icount'] // 3, sz // 1024)
# spacecraft / stations with textures
for name, src, cells, nq in [('iss', f'{C}/extras-standard/iss/models/iss.cmod', 300, 3),
                             ('mir', f'{C}/extras-standard/mir/models/mir.cmod', 120, 1),
                             ('hubble', f'{C}/extras-standard/hubble/models/hubble.cmod', None, 3),
                             ('skylab', f'{C}/extras-standard/skylab/models/skylab.3ds', None, 3)]:
    texdir = f'{OUT}/{name}'
    os.makedirs(texdir, exist_ok=True)
    def rename(t, name=name):
        base = os.path.splitext(os.path.basename(t))[0]
        return f'{name}/{base}'
    h = meshconv.convert(src, f'{OUT}/{name}.msh', cells, rename_tex=rename, nq=nq)
    sz = os.path.getsize(f'{OUT}/{name}.msh'); total += sz
    texs = sorted({m['texture'] for m in h['materials'] if m['texture']})
    for t in texs:
        base = os.path.basename(t)
        cands = [c for c in glob.glob(f'{C}/extras-standard/{name}/textures/medres/{base}.*') if not c.endswith('.license')]
        if not cands:
            print('  missing texture', name, t); continue
        im = Image.open(cands[0])
        has_alpha = im.mode in ('RGBA', 'LA') and im.getchannel('A').getextrema()[0] < 250
        if has_alpha:
            outp = f'{texdir}/{base}.png'; im.save(outp, optimize=True)
        else:
            outp = f'{texdir}/{base}.jpg'; im.convert('RGB').save(outp, quality=82, optimize=True)
        total += os.path.getsize(outp)
    info[name] = (None, h['icount'] // 3, sz // 1024, texs)
for k, v in info.items(): print(k, v)
print('models total', total // 1024, 'KB')
