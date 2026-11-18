global.window = {};
const fs = require('fs');
eval(fs.readFileSync(require('path').join(__dirname, '..', 'data', 'catalog.js'), 'utf8'));
eval(fs.readFileSync(require('path').join(__dirname, '..', 'js', 'core.js'), 'utf8'));
const E = window.EPH; E.buildTree();
const byCode = new Map(); for (const b of E.bodies) if (b.d.code) byCode.set(String(b.d.code), b);
const C = JSON.parse(fs.readFileSync('val/check2.json', 'utf8'));
const errs = [];
for (const key of Object.keys(C)) {
  const [code, jds] = key.split('@'); const jd = +jds, h = C[key];
  const b = byCode.get(code); if (!b) continue;
  E.updateAll(jd);
  const r = [b.pos[0] - b.parent.pos[0], b.pos[1] - b.parent.pos[1], b.pos[2] - b.parent.pos[2]];
  const ang = Math.acos(Math.max(-1, Math.min(1, (r[0]*h[0]+r[1]*h[1]+r[2]*h[2]) / (Math.hypot(...r) * Math.hypot(...h))))) * 180 / Math.PI;
  const rel = Math.hypot(r[0]-h[0], r[1]-h[1], r[2]-h[2]) / Math.hypot(...h) * 100;
  errs.push([ang, rel, b.name, b.parent.name, jd < 2450000 ? 1987 : 2033, b.orb.t]);
}
errs.sort((a, b) => a[0] - b[0]);
const q = (p) => errs[Math.floor(p * (errs.length - 1))][0].toFixed(3);
console.log(`n=${errs.length}  median ${q(0.5)}°  90th pct ${q(0.9)}°  max ${errs[errs.length-1][0].toFixed(2)}°`);
for (const e of errs.slice(-8)) console.log('  worst:', e[2], e[3], e[4], e[5], e[0].toFixed(2) + '°', e[1].toFixed(2) + '%');
