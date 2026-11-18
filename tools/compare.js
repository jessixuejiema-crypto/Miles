global.window = {};
const fs = require('fs');
eval(fs.readFileSync(require('path').join(__dirname, '..', 'data', 'catalog.js'), 'utf8'));
eval(fs.readFileSync(require('path').join(__dirname, '..', 'js', 'core.js'), 'utf8'));
const E = window.EPH; E.buildTree();
const H = JSON.parse(fs.readFileSync('val/horizons.json', 'utf8'));
const rows = [];
for (const key of Object.keys(H)) {
  const [id, jds] = key.split('@'); const jd = +jds; const h = H[key];
  if (!h) continue;
  E.updateAll(jd);
  const b = E.byId.get(id);
  if (!b || !b.present) { rows.push([id, jd, 'not present']); continue; }
  const p = b.parent && b.parent.id !== 'sun' ? b.parent.pos : [0, 0, 0];
  const r = [b.pos[0] - p[0], b.pos[1] - p[1], b.pos[2] - p[2]];
  const lr = Math.hypot(...r), lh = Math.hypot(...h);
  const ang = Math.acos(Math.max(-1, Math.min(1, (r[0] * h[0] + r[1] * h[1] + r[2] * h[2]) / (lr * lh)))) * 180 / Math.PI;
  const derr = Math.hypot(r[0] - h[0], r[1] - h[1], r[2] - h[2]);
  rows.push([id, jd, ang.toFixed(3) + '°', (100 * derr / lh).toFixed(3) + '%', Math.round(derr) + ' km']);
}
for (const r of rows) console.log(r.join('\t'));
