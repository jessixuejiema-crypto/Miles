import os as _os
REPO = _os.path.dirname(_os.path.dirname(_os.path.abspath(__file__)))
WORK = _os.environ.get('EPH_WORK', _os.path.join(REPO, 'tools', 'work'))
from PIL import Image
import os, shutil
Image.MAX_IMAGE_PIXELS = None
C = _os.path.join(WORK, 'src/CelestiaContent/textures')
G = _os.path.join(WORK, 'src/gemb-planet-textures')
OUT = _os.path.join(REPO, 'textures')
# (output name, source, max width)
SPEC = [
  ('earth', f'{C}/hires/earth.png', 4096), ('earth-night', f'{C}/hires/earth-night.jpg', 2048),
  ('mercury', f'{C}/hires/mercury.jpg', 2048), ('venus', f'{C}/medres/venus-clouds.jpg', 2048),
  ('venus-surface', f'{C}/hires/venus.jpg', 2048), ('moon', f'{C}/hires/moon.jpg', 4096),
  ('mars', f'{C}/hires/mars.jpg', 2048), ('jupiter', f'{C}/hires/jupiter.jpg', 4096),
  ('saturn', f'{C}/hires/saturn.jpg', 2048), ('uranus', f'{C}/hires/uranus.jpg', 1024),
  ('neptune', f'{C}/hires/neptune.jpg', 2048), ('pluto', f'{C}/hires/pluto.jpg', 2048),
  ('charon', f'{C}/hires/charon.jpg', 2048), ('ceres', f'{C}/hires/ceres.jpg', 2048),
  ('vesta', f'{C}/hires/vesta.jpg', 2048), ('io', f'{C}/hires/io.png', 2048),
  ('europa', f'{C}/hires/europa.jpg', 2048), ('ganymede', f'{C}/hires/ganymede.jpg', 2048),
  ('callisto', f'{C}/hires/callisto.jpg', 2048), ('mimas', f'{C}/hires/mimas.jpg', 2048),
  ('enceladus', f'{C}/hires/enceladus.jpg', 2048), ('tethys', f'{C}/hires/tethys.jpg', 2048),
  ('dione', f'{C}/hires/dione.jpg', 2048), ('rhea', f'{C}/hires/rhea.jpg', 2048),
  ('titan', f'{C}/hires/titan.png', 2048), ('titan-haze', f'{C}/hires/titan-clouds.jpg', 1024),
  ('iapetus', f'{C}/hires/iapetus.jpg', 2048), ('phoebe', f'{C}/hires/phoebe.jpg', 1024),
  ('hyperion', f'{C}/medres/hyperion.jpg', 1024), ('ariel', f'{C}/hires/ariel.jpg', 2048),
  ('miranda', f'{C}/hires/miranda.jpg', 2048), ('umbriel', f'{C}/medres/umbriel.jpg', 2048),
  ('titania', f'{C}/medres/titania.jpg', 2048), ('oberon', f'{C}/medres/oberon.jpg', 2048),
  ('puck', f'{C}/medres/puck.jpg', 1024), ('triton', f'{C}/hires/triton.jpg', 2048),
  ('proteus', f'{C}/lores/proteus.jpg', 1024), ('larissa', f'{C}/lores/larissa.jpg', 1024),
  ('nix', f'{C}/medres/nix.jpg', 1024), ('hydra', f'{C}/lores/hydra.jpg', 1024),
  ('phobos', f'{C}/hires/phobos.jpg', 1024), ('deimos', f'{C}/hires/deimos.jpg', 1024),
  ('amalthea', f'{C}/lores/amalthea.jpg', 1024), ('thebe', f'{C}/lores/thebe.jpg', 1024),
  ('metis', f'{C}/lores/metis.jpg', 1024), ('janus', f'{C}/lores/janus.jpg', 512),
  ('epimetheus', f'{C}/lores/epimetheus.jpg', 1024), ('prometheus', f'{C}/lores/prometheus.jpg', 512),
  ('eros', f'{C}/hires/eros.jpg', 1024), ('itokawa', f'{C}/hires/itokawa.jpg', 1024),
  ('bennu', f'{C}/hires/bennu.jpg', 1024), ('ryugu', f'{C}/hires/ryugu.jpg', 1024),
  ('arrokoth', f'{C}/hires/arrokoth.jpg', 1024), ('67p', f'{C}/medres/67p.jpg', 1024),
  ('didymos', f'{C}/medres/didymos.jpg', 1024), ('dimorphos', f'{C}/medres/dimorphos.jpg', 1024),
  ('dinkinesh', f'{C}/medres/dinkinesh.jpg', 1024), ('selam', f'{C}/lores/selam.jpg', 512),
  ('donaldjohanson', f'{C}/medres/donaldjohanson.jpg', 1024), ('gaspra', f'{C}/medres/gaspra.jpg', 1024),
  ('ida', f'{C}/medres/ida.jpg', 1024), ('lutetia', f'{C}/medres/lutetia.jpg', 1024),
  ('mathilde', f'{C}/medres/mathilde.jpg', 1024), ('steins', f'{C}/lores/steins.jpg', 512),
  ('torifune', f'{C}/medres/torifune.jpg', 1024), ('kamooalewa', f'{C}/lores/kamooalewa.jpg', 512),
  ('asteroid', f'{C}/hires/asteroid.jpg', 1024), ('icy', f'{C}/hires/icy.jpg', 1024),
  ('icymoon', f'{C}/lores/icymoon.jpg', 512), ('rocky', f'{C}/hires/rocky.jpg', 1024),
  ('star-g', f'{C}/hires/gstar.jpg', 2048), ('star-o', f'{C}/hires/ostar.jpg', 1024),
  ('star-b', f'{C}/hires/bstar.jpg', 1024), ('star-a', f'{C}/hires/astar.jpg', 1024),
  ('star-f', f'{C}/hires/fstar.jpg', 1024), ('star-k', f'{C}/hires/kstar.jpg', 1024),
  ('star-m', f'{C}/hires/mstar.jpg', 1024), ('star-wd', f'{C}/hires/whitedwarf.jpg', 1024),
  ('star-giant', f'{C}/hires/redgiant.jpg', 1024), ('star-bd', f'{C}/hires/browndwarf.jpg', 1024),
  ('milkyway', f'{G}/2k_stars_milky_way.jpg', 2048),
]
total = 0
for name, src, w in SPEC:
    im = Image.open(src)
    if im.mode in ('RGBA', 'LA', 'P'):
        im = im.convert('RGB')
    if im.size[0] > w:
        im = im.resize((w, w // 2), Image.LANCZOS)
    out = f'{OUT}/{name}.jpg'
    im.save(out, quality=82, optimize=True, progressive=True)
    total += os.path.getsize(out)
# clouds: alpha channel as density map
cl = Image.open(f'{C}/hires/earth-clouds.png').getchannel('A').resize((2048, 1024), Image.LANCZOS)
cl.save(f'{OUT}/earth-clouds.jpg', quality=80, optimize=True); total += os.path.getsize(f'{OUT}/earth-clouds.jpg')
# rings: 1-D strips, keep RGBA
for name, src in [('saturn-rings', f'{C}/hires/saturn-rings.png'), ('uranus-rings', f'{C}/hires/uranus-rings.png'),
                  ('neptune-rings', f'{C}/medres/neptune-rings.png'), ('jupiter-rings', f'{C}/lores/jupiter-rings.png'),
                  ('chariklo-rings', f'{C}/lores/chariklo-rings.png'), ('haumea-rings', f'{C}/lores/haumea-rings.png'),
                  ('quaoar-rings', f'{C}/medres/quaoar-rings.png'), ('chiron-rings', f'{C}/lores/chiron-rings.png')]:
    im = Image.open(src).convert('RGBA')
    if im.size[0] > 2048: im = im.resize((2048, 1), Image.LANCZOS)
    im.save(f'{OUT}/{name}.png', optimize=True); total += os.path.getsize(f'{OUT}/{name}.png')
print('textures total', total // 1024, 'KB', len(os.listdir(OUT)), 'files')
