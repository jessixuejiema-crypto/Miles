/* Ephemeris — interface: search, catalogue drawer, info panel, labels, time controls and the main loop. */
(function () {
  'use strict';
  const E = window.EPH, V = E.V, S = E.S, state = E.state;
  const AU = E.AU, LY = E.LY;
  const $ = (s) => document.querySelector(s);
  const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
  const STARROWS = window.STARS || [];
  const CAT = window.CATALOG;

  E.buildTree();

  /* ---------------- vocabulary ---------------- */
  const KIND_LABEL = {
    star: 'Star', planet: 'Planet', dwarf: 'Dwarf planet', moon: 'Moon', asteroid: 'Asteroid', comet: 'Comet',
    interstellar: 'Interstellar object', station: 'Space station', spacecraft: 'Spacecraft', historic: 'Historic', blackhole: 'Black hole',
  };
  const CLASS_LABEL = {
    MBA: 'Main-belt asteroid', IMB: 'Inner main-belt asteroid', OMB: 'Outer main-belt asteroid', APO: 'Apollo · Earth-crossing',
    ATE: 'Aten · Earth-crossing', AMO: 'Amor · near-Earth', IEO: 'Atira · inside Earth’s orbit', MCA: 'Mars-crosser',
    TJN: 'Jupiter trojan', CEN: 'Centaur', TNO: 'Trans-Neptunian object', PAA: 'Parabolic orbit', HYA: 'Hyperbolic orbit',
    AST: 'Asteroid', JFc: 'Jupiter-family comet', JFC: 'Jupiter-family comet', HTC: 'Halley-type comet', ETc: 'Encke-type comet',
    CTc: 'Chiron-type comet', COM: 'Long-period comet', HYP: 'Hyperbolic comet', PAR: 'Parabolic comet',
  };
  const AST_CLASSES = ['AST', 'MBA', 'IMB', 'OMB', 'APO', 'ATE', 'AMO', 'IEO', 'MCA', 'TJN', 'CEN', 'TNO', 'PAA', 'HYA'];

  const IMG = {
    'star-g': 'NASA SDO imagery, processed by MrSpace43 & AstroChara (Celestia), CC BY-SA 4.0',
    mercury: 'MESSENGER / USGS colour map (Celestia)', venus: 'Cloud tops from Björn Jónsson, recoloured by FarGetaNik (Celestia)',
    earth: 'NASA Blue Marble Next Generation & Natural Earth composite (Celestia)', moon: 'NASA LRO & CGI Moon Kit (Celestia)',
    mars: 'Viking & Mars Global Surveyor, USGS (Celestia)',
    jupiter: 'NASA/JPL-Caltech/SwRI/MSSS (Cassini & Juno), Björn Jónsson & Askaniy (Celestia), CC BY 3.0',
    saturn: 'NASA/JPL-Caltech Cassini, Björn Jónsson & Askaniy (Celestia), CC BY 3.0',
    uranus: 'NASA/JPL-Caltech Voyager 2, Björn Jónsson & Askaniy (Celestia), CC BY-NC-SA 3.0',
    neptune: 'NASA/JPL-Caltech Voyager 2, Björn Jónsson & Askaniy (Celestia), CC BY 3.0',
    pluto: 'NASA New Horizons, Askaniy (Celestia), CC BY-NC-SA 3.0', charon: 'NASA New Horizons, Steve Albers & USGS, Askaniy (Celestia), CC BY-NC-SA 3.0',
    ceres: 'NASA Dawn colour mosaics (Celestia)', vesta: 'NASA Dawn mosaics (Celestia)',
    io: 'USGS Galileo mosaic & Juno (Eichstädt, Perry, Rogers), ItzImcool (Celestia), CC BY 4.0',
    europa: 'Galileo & Voyager, John van Vliet (Celestia)', ganymede: 'NASA/JPL-Caltech/ASI/USGS & Juno, Askaniy (Celestia), CC BY 3.0',
    callisto: 'Galileo & Voyager, Askaniy from John van Vliet (Celestia)',
    mimas: 'NASA Cassini, Paul Schenk enhanced colour map (Celestia)', enceladus: 'NASA Cassini, Paul Schenk enhanced colour map (Celestia)',
    tethys: 'NASA Cassini, Paul Schenk enhanced colour map (Celestia)', dione: 'NASA Cassini, Paul Schenk enhanced colour map (Celestia)',
    rhea: 'NASA Cassini, Björn Jónsson & JPL (Celestia)', iapetus: 'NASA Cassini, Paul Schenk enhanced colour map (Celestia)',
    titan: 'Cassini–Huygens, Askaniy, Pedro Garcia & AstroChara (Celestia), CC BY 3.0', phoebe: 'NASA Cassini, John van Vliet (Celestia)',
    hyperion: 'NASA Cassini, ItzImcool (Celestia), CC BY 4.0',
    ariel: 'Voyager 2, Paul Schenk & Ted Stryk, ItzImcool (Celestia), CC BY-SA 4.0', miranda: 'Voyager 2, Paul Schenk & Ted Stryk, ItzImcool (Celestia), CC BY-SA 4.0',
    umbriel: 'Voyager 2, Paul Schenk, Phil Stooke & Ted Stryk (Celestia), CC BY-SA 4.0', titania: 'Voyager 2, Paul Schenk & Ted Stryk, ItzImcool (Celestia), CC BY-SA 4.0',
    oberon: 'Voyager 2, Paul Schenk & Ted Stryk, ItzImcool (Celestia), CC BY-SA 4.0', puck: 'Voyager 2, Askaniy & Evan Davis (Celestia), CC BY 3.0',
    triton: 'Voyager 2, NASA/JPL/USGS, Askaniy (Celestia), CC BY 3.0', proteus: 'Voyager 2, Astra-Planetshine (Celestia)', larissa: 'Voyager 2, Phil Stooke & Astra-Planetshine (Celestia)',
    nix: 'New Horizons, Askaniy (Celestia), CC BY 3.0', hydra: 'New Horizons, Askaniy (Celestia), CC BY 3.0',
    phobos: 'Phil Stooke Small Bodies Maps (NASA PDS), Askaniy, CC BY 3.0', deimos: 'Phil Stooke Small Bodies Maps (NASA PDS), CC0',
    amalthea: 'Galileo, ItzImcool (Celestia), CC BY 4.0', thebe: 'Galileo, ItzImcool (Celestia), CC BY 4.0', metis: 'Galileo, ItzImcool (Celestia), CC BY 4.0',
    janus: 'Cassini, Phil Stooke (Celestia)', epimetheus: 'Cassini, Phil Stooke (Celestia)', prometheus: 'Cassini, Phil Stooke (Celestia)',
    eros: 'NEAR Shoemaker, Phil Stooke & Askaniy', itokawa: 'Hayabusa, Phil Stooke (NASA PDS), CC0', bennu: 'OSIRIS-REx (Univ. of Arizona), Askaniy, CC BY 3.0',
    ryugu: 'Hayabusa2 (ISAS/JAXA), Askaniy, CC BY 4.0', arrokoth: 'New Horizons, Roman Tkachenko & Askaniy, CC BY 3.0',
    '67p': 'ESA/Rosetta NAVCAM & OSIRIS, ItzImcool, CC BY-SA 4.0', didymos: 'NASA DART shape-model archive (PDS), CC0', dimorphos: 'NASA DART shape-model archive (PDS), CC0',
    dinkinesh: 'NASA Lucy, ItzImcool, CC BY 4.0', selam: 'NASA Lucy, ItzImcool, CC BY 4.0', donaldjohanson: 'NASA Lucy, ItzImcool, CC BY 4.0',
    gaspra: 'Galileo, ItzImcool, CC BY 4.0', ida: 'Galileo, ItzImcool, CC BY 4.0', lutetia: 'ESA Rosetta OSIRIS, ItzImcool, CC BY-SA 4.0',
    steins: 'ESA Rosetta OSIRIS, ItzImcool, CC BY-SA 4.0', mathilde: 'NEAR Shoemaker, Phil Stooke & Askaniy, CC BY 3.0',
    torifune: 'Hayabusa2 (ISAS/JAXA), ItzImcool, CC BY 4.0', kamooalewa: 'Hand-painted map (Celestia) — no spacecraft images yet',
  };
  const MODEL = {
    iss: 'NASA 3D model (configuration 2011–2015), converted by DaveBowman2001', mir: 'Model by DaveBowman2001 (1996–2001 configuration)',
    eros: 'Rob Gaskell shape model (NASA PDS)', itokawa: 'Rob Gaskell shape model (NASA PDS)', mimas: 'Rob Gaskell shape model (NASA PDS)', phoebe: 'Rob Gaskell shape model (NASA PDS)',
    bennu: 'OSIRIS-REx Altimetry Working Group SPOv54', ryugu: 'Watanabe et al. 2019 (JAXA)', vesta: 'NASA Dawn shape model (PDS)',
    '67p': 'ESA Rosetta NAVCAM shape model, CC BY-SA IGO 3.0', arrokoth: 'Porter (2024), NASA New Horizons', phobos: 'Ernst et al. 2023', deimos: 'Ernst et al. 2023',
    didymos: 'NASA DART (PDS)', dimorphos: 'NASA DART (PDS)', apophis: 'Brozović et al. 2018 radar model (PDS)',
    toutatis: 'Scott Hudson radar model', geographos: 'Scott Hudson radar model', castalia: 'Scott Hudson radar model', golevka: 'Scott Hudson radar model',
    bacchus: 'Scott Hudson radar model', ky26: 'Scott Hudson radar model', nix: 'Simon Porter', hydra: 'Simon Porter', ida: 'Peter Thomas (PDS)',
  };

  /* ---------------- formatting ---------------- */
  const nf = (x, d = 0) => x.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });
  const sig = (x, s = 3) => { if (!isFinite(x)) return '—'; if (x === 0) return '0'; const d = Math.max(0, s - 1 - Math.floor(Math.log10(Math.abs(x)))); return nf(x, Math.min(d, 6)); };
  function fmtDist(km) {
    if (!isFinite(km)) return '—';
    if (km < 1) return `${nf(km * 1000, 0)} m`;
    if (km < 2e6) return `${nf(km, km < 100 ? 1 : 0)} km`;
    if (km < 0.05 * LY) return `${sig(km / AU, 4)} AU`;
    if (km < 1e6 * LY) return `${sig(km / LY, 4)} light-years`;
    return `${sig(km / LY / 1e6, 4)} million light-years`;
  }
  function fmtDur(days) {
    if (!isFinite(days) || days <= 0) return '—';
    if (days < 1 / 24) return `${sig(days * 1440, 3)} minutes`;
    if (days < 2) return `${sig(days * 24, 3)} hours`;
    if (days < 730) return `${sig(days, 4)} days`;
    return `${sig(days / 365.25, 4)} years`;
  }
  function fmtMass(kg) {
    const earth = 5.9722e24;
    if (kg > 1e28) return `${sig(kg / 1.98847e30, 3)} × Sun`;
    if (kg > 1e22) return `${sig(kg / earth, 3)} × Earth`;
    const ex = Math.floor(Math.log10(kg));
    return `${sig(kg / Math.pow(10, ex), 3)} × 10${String(ex).split('').map((c) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+c]).join('')} kg`;
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const pad = (n) => String(n).padStart(2, '0');
  function fmtDate(jd, withTime) {
    const d = E.jdToDate(jd);
    const s = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    return withTime ? `${s}, ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC` : s;
  }
  const normKey = (s) => (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[ʻ`'’!|]/g, '').toLowerCase();

  /* ---------------- dynamic bodies: stars, comets and catalogue asteroids ---------------- */
  function spectralTexture(sp) {
    const s = (sp || '').trim();
    if (/^D/.test(s)) return 'star-wd';
    const c = s.charAt(0).toUpperCase();
    const giant = /(I{1,3}|II|Ia|Ib)(?![VX])/.test(s.slice(1)) && !/IV|V/.test(s.slice(1));
    if (giant && (c === 'K' || c === 'M')) return 'star-giant';
    return { O: 'star-o', B: 'star-b', A: 'star-a', F: 'star-f', G: 'star-g', K: 'star-k', M: 'star-m', L: 'star-bd', T: 'star-bd' }[c] || 'star-g';
  }
  function starBody(k) {
    const id = 'star-' + k;
    if (E.byId.has(id)) return E.byId.get(id);
    const s = STARROWS[k];
    const r = Math.max(2000, Math.min(1.5e9, E.starRadiusKm(s[3], s[4])));
    const name = s[6] + (s[8] || !s[7] || /^(HIP|HD|Gl|GJ|Wo|NN)/.test(s[6]) ? '' : ` ${s[7]}`);
    const b = E.addBody({ id, n: name, k: 'star', r, tex: spectralTexture(s[5]), tint: E.starColor(s[4]), orb: { t: 'pos', p: S.starEcl[k] },
      src: 'Position: HYG stellar database v4.1 (Hipparcos, Yale Bright Star, Gliese catalogues)', star: s }, null);
    b.starIndex = k;
    E.resetOrder();
    return b;
  }
  function cometBody(k) {
    const row = S.cometRows[k];
    const id = 'comet-' + k;
    if (E.byId.has(id)) return E.byId.get(id);
    const b = E.addBody({ id, n: row[0], k: 'comet', p: 'sun', r: 1.5, rEst: 1, tex: 'asteroid', texGeneric: 1, cls: row[7],
      orb: S.cometOrbs[k], src: 'Orbit: JPL Small-Body Database (all known comets)' });
    E.resetOrder();
    return b;
  }
  let astNames = null, astNamePromise = null;
  function loadAstNames() {
    if (astNamePromise) return astNamePromise;
    astNamePromise = fetch('data/asteroids/names.json').then((r) => r.json()).then((j) => { astNames = j; buildAstSearch(); return j; }).catch(() => ({}));
    return astNamePromise;
  }
  function decodeDesig(v, ch, i) {
    if (!v) { const ex = astExceptions && astExceptions[ch.meta.file]; return ex && ex[i] ? ex[i] : 'unnamed'; }
    const y = (v >>> 22) + 1800, l1 = String.fromCharCode(65 + ((v >>> 17) & 31)), l2 = String.fromCharCode(65 + ((v >>> 12) & 31)), n = v & 4095;
    return `${y} ${l1}${l2}${n || ''}`;
  }
  let astExceptions = null;
  fetch('data/asteroids/exceptions.json').then((r) => r.json()).then((j) => { astExceptions = j; }).catch(() => {});
  function asteroidBody(ch, i) {
    const num = ch.meta.kind === 'numbered' ? ch.meta.first + i : null;
    const id = num ? `ast-${num}` : `ast-${ch.meta.file}-${i}`;
    if (E.byId.has(id)) return E.byId.get(id);
    // featured objects already in the catalogue win
    if (num) { for (const b of E.bodies) if (b.d.num === num) return b; }
    const el = S.asteroidElements(ch, i);
    if (!el) return null;
    let name;
    if (num) name = astNames && astNames[num] ? `${astNames[num]}` : `(${num})`;
    else name = decodeDesig(ch.desig ? ch.desig[i] : 0, ch, i);
    const D = el.D || (el.H != null ? (1329 / Math.sqrt(0.14)) * Math.pow(10, -el.H / 5) : 1);
    const cls = AST_CLASSES[el.cls] || 'AST';
    const n = (0.01720209895 / Math.pow(el.a, 1.5)) * (180 / Math.PI);
    const b = E.addBody({
      id, n: name, k: cls === 'TNO' ? 'asteroid' : 'asteroid', p: 'sun', r: D / 2, rEst: el.D ? 0 : 1, H: el.H, num, cls,
      tex: cls === 'TNO' || cls === 'CEN' ? 'icy' : 'asteroid', texGeneric: 1,
      orb: { t: 'kep', a: el.a * AU, e: el.e, i: el.i, O: el.O, w: el.w, M: el.M, ep: 2461200.5, n, fr: 'ecl' },
      src: 'Orbit: JPL Small-Body Database, full asteroid catalogue (elements compressed for display; ≈0.0002 AU precision)',
      full: num ? `(${num})${astNames && astNames[num] ? ' ' + astNames[num] : ''}` : name,
    });
    E.resetOrder();
    return b;
  }

  /* ---------------- focusing ---------------- */
  let toastT = 0;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.classList.add('on');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 4200);
  }
  E.toast = toast;
  function lifeOf(b) { return b.d.life || null; }
  function select(b, opts = {}) {
    if (!b) return;
    const L = lifeOf(b);
    if (L && !b.orbitAt(state.jd)) {
      // jump to a moment when the object exists
      const target = b.d.grp === 'sl9' && L[1] ? L[1] - 1.5 : L[1] ? (L[0] + L[1]) / 2 : L[0] + 30;
      state.jd = target;
      if (b.d.grp === 'sl9') setRate(rateIndexOf(3600));
      toast(`${b.name} did not exist on that date — jumped to ${fmtDate(target)}.`);
    }
    if (b.kind === 'blackhole' && !state.layers.bh) setLayer('bh', true);
    S.focus(b, opts);
    closeResults();
    if (window.innerWidth < 760) $('#drawer').classList.remove('open');
  }
  E.select = select;
  S.onFocus = (b) => { renderInfo(b); renderCrumbs(b); };

  S.onClick = async (x, y) => {
    const b = S.pickBody(x, y);
    if (b) { select(b); return; }
    const st = S.pickStar(x, y);
    if (st >= 0) { select(starBody(st)); return; }
    const c = S.pickComet(x, y);
    if (c >= 0) { select(cometBody(c)); return; }
    if (state.layers.asteroids && S.ast.chunks.length) {
      document.body.classList.add('busy');
      await new Promise((r) => setTimeout(r, 16));
      const hit = S.pickAsteroid(x, y);
      document.body.classList.remove('busy');
      if (hit) { await loadAstNames(); const ab = asteroidBody(hit.ch, hit.i); if (ab) select(ab); }
    }
  };
  S.onDoubleClick = (x, y) => {
    const b = S.pickBody(x, y) || S.cam.focus;
    if (b) S.focus(b, { dist: S.viewDistance(b) * 0.55 });
  };

  /* ---------------- breadcrumbs ---------------- */
  function renderCrumbs(b) {
    const nav = $('#crumbs');
    nav.textContent = '';
    const chain = [];
    for (let x = b; x; x = x.parent) chain.unshift(x);
    chain.forEach((x, k) => {
      if (k) nav.appendChild(el('span', 'sep', '/'));
      const a = el('button', k === chain.length - 1 ? 'crumb cur' : 'crumb', x.name);
      if (k < chain.length - 1) a.addEventListener('click', () => select(x));
      nav.appendChild(a);
    });
    $('#up').hidden = !b.parent && b.id === 'sun';
    $('#up').title = b.parent ? `Up to ${b.parent.name}` : 'Whole solar system';
  }
  function goUp() {
    const f = S.cam.focus;
    if (!f) return;
    if (f.parent) select(f.parent);
    else if (f.id === 'sun') S.focus(f, { dist: 55 * AU, keepAngle: true });
    else select(E.sun());
  }
  $('#up').addEventListener('click', goUp);

  /* ---------------- info panel ---------------- */
  const info = $('#info');
  let infoBody = null, liveRows = {};
  function kv(dl, k, v, live) {
    const dt = el('dt', null, k), dd = el('dd', null, v);
    dl.append(dt, dd);
    if (live) liveRows[live] = dd;
    return dd;
  }
  function moonCountLabel(b) {
    const n = b.children.filter((c) => c.kind === 'moon').length;
    return n;
  }
  function renderInfo(b) {
    infoBody = b; liveRows = {};
    const d = b.d;
    info.hidden = false;
    info.classList.toggle('collapsed', window.innerWidth < 760 && !info.classList.contains('expanded'));
    const box = $('#infoBody');
    box.textContent = '';
    const head = el('div', 'ihead');
    let chip = KIND_LABEL[b.kind] || 'Object';
    if (b.kind === 'dwarf' && d.cand) chip = 'Dwarf planet candidate';
    if (b.kind === 'station' && d.hist) chip = 'Space station · historic';
    const chipEl = el('span', `chip k-${b.kind}`, chip);
    head.appendChild(chipEl);
    if (d.cls && CLASS_LABEL[d.cls] && b.kind !== 'interstellar') head.appendChild(el('span', 'chip sub', CLASS_LABEL[d.cls]));
    box.appendChild(head);
    const h = el('h2', 'iname', b.name);
    box.appendChild(h);
    const alts = [];
    if (d.full && d.full !== b.name) alts.push(d.full);
    if (d.alt) alts.push(...d.alt);
    if (b.kind === 'moon' && b.parent) alts.unshift(`Moon of ${b.parent.name}`);
    if (alts.length) box.appendChild(el('p', 'ialt', alts.join(' · ')));

    // existence notes
    const L = d.life;
    if (L) {
      const note = el('div', 'note');
      const present = !!b.orbitAt(state.jd) && !(L[1] && state.jd > L[1]);
      if (d.grp === 'sl9') {
        note.textContent = b.id === 'sl9-impacts' ? 'Impact scars visible on Jupiter after July 1994.' : `Destroyed on impact with Jupiter, ${fmtDate(L[1], true)}.`;
        if (!present && b.id !== 'sl9-impacts') addJump(note, 'Watch the impacts (July 1994)', L[1] - 1.2, 3600);
      } else if (d.hist) {
        note.textContent = state.jd > L[1] ? `Re-entered ${fmtDate(L[1])}. Shown fixed at its re-entry site: ${d.site}.` : `In orbit ${fmtDate(L[0])} – ${fmtDate(L[1])}. Orbit shown is approximate.`;
        if (state.jd > L[1]) addJump(note, `See it in orbit (${E.jdToDate((L[0] + L[1]) / 2).getUTCFullYear()})`, (L[0] + L[1]) / 2, 60);
      } else if (L[0]) {
        note.textContent = `Launched ${fmtDate(L[0])}.`;
      }
      if (d.tleEp && Math.abs(state.jd - d.tleEp) > 21) note.textContent += ` Position is propagated from orbital elements of ${fmtDate(d.tleEp)}, so it is approximate this far from that date.`;
      box.appendChild(note);
    }
    if (d.orb && d.orb.approx && d.grp === 'sl9') box.appendChild(el('div', 'note', 'Orbit is an approximate reconstruction for illustration.'));

    const dl = el('dl', 'stats');
    // size
    if (b.kind === 'blackhole') {
      kv(dl, 'Mass', `${sig(d.mass, 3)} × Sun`);
      kv(dl, 'Event horizon radius', fmtDist(b.r));
      kv(dl, 'Distance', `${sig(d.ly, 4)} light-years`);
    } else if (b.kind === 'star' && d.star) {
      const s = d.star;
      const dly = V.len(b.pos) / LY;
      kv(dl, 'Spectral type', s[5] || '—');
      kv(dl, 'Distance from Sun', `${sig(dly, 4)} light-years`);
      kv(dl, 'Brightness from Earth', `magnitude ${sig(s[3] + 5 * Math.log10(dly / 3.26156) - 5, 3)}`);
      kv(dl, 'Luminosity', `${sig(Math.pow(10, (4.83 - s[3]) / 2.5), 3)} × Sun`);
      kv(dl, 'Surface temperature', `≈ ${nf(Math.round(E.starTemp(s[4]) / 10) * 10)} K`);
      kv(dl, 'Radius (estimated)', `${sig(b.r / 695700, 3)} × Sun`);
      if (s[7]) kv(dl, 'Constellation', s[7]);
    } else {
      if (d.ax && d.model) kv(dl, 'Dimensions', d.ax.map((a) => fmtDist(a * 2)).join(' × '));
      else if (b.kind === 'station' || b.kind === 'spacecraft') kv(dl, 'Size', fmtDist(b.r * 2) + ' across');
      else kv(dl, d.rEst ? 'Diameter (estimated)' : 'Mean diameter', d.rEst && b.kind === 'moon' ? 'not measured, likely a few km' : fmtDist(b.r * 2));
      if (d.gm) kv(dl, 'Mass', fmtMass(d.gm / 6.6743e-20));
      if (d.rho) kv(dl, 'Density', `${d.rho} g/cm³`);
      if (d.rot && d.rot.t === 'iau' && b.id !== 'sun') kv(dl, 'Rotation period', fmtDur(Math.abs(360 / d.rot.v[3])) + (d.rot.v[3] < 0 ? ' (retrograde)' : ''));
      else if (d.rot && d.rot.t === 'sync') kv(dl, 'Rotation', 'Tidally locked');
      else if (d.rotP) kv(dl, 'Rotation period', fmtDur(d.rotP / 24));
      if (d.H != null) kv(dl, 'Absolute magnitude (H)', String(d.H));
      if (d.nMoons) kv(dl, 'Moons in this atlas', String(d.nMoons));
      else { const nm = moonCountLabel(b); if (nm) kv(dl, 'Known moons', String(nm)); }
      // orbit
      const o = b._orbUsed || b.orb;
      if (o && b.parent && (o.t === 'kep' || o.t === 'std' || o.t === 'tl')) {
        const oo = o.t === 'tl' ? o.ph[o.ph.length - 1].o : o;
        const a = oo.t === 'std' ? oo.el[0] * AU : oo.a;
        const e = oo.t === 'std' ? oo.el[1] : oo.e;
        const inc = oo.t === 'std' ? oo.el[2] : oo.i;
        kv(dl, 'Orbital period', fmtDur(b.period) + (inc > 90 ? ' (retrograde)' : ''));
        kv(dl, b.parent.id === 'sun' ? 'Average distance from Sun' : `Average distance from ${b.parent.name}`, fmtDist(a));
        kv(dl, 'Closest · farthest', `${fmtDist(a * (1 - e))} · ${fmtDist(a * (1 + e))}`);
        kv(dl, 'Eccentricity · inclination', `${sig(e, 3)} · ${sig(inc, 3)}°`);
      } else if (o && o.t === 'hyp') {
        kv(dl, 'Orbit', `Hyperbolic (e = ${sig(o.e, 4)}) — not bound to the Sun`);
        kv(dl, 'Closest to the Sun', `${fmtDist(o.q)} on ${fmtDate(o.tp)}`);
      } else if (o && o.t === 'fix' && b.parent) {
        kv(dl, 'Location', `${Math.abs(o.lat).toFixed(1)}°${o.lat < 0 ? 'S' : 'N'}, ${Math.abs(o.lon).toFixed(1)}°${o.lon < 0 ? 'W' : 'E'} on ${b.parent.name}`);
      }
      if (b.id !== 'sun') {
        kv(dl, 'Distance from Sun', '…', 'dsun');
        if (b.id !== 'earth') kv(dl, 'Distance from Earth', '…', 'dearth');
        if (b.id !== 'earth') kv(dl, 'Light travel time from Earth', '…', 'light');
        if (b.parent && o && o.t !== 'fix') kv(dl, `Speed relative to ${b.parent.name}`, '…', 'speed');
      }
    }
    box.appendChild(dl);

    const fact = d.fact || autoFact(b);
    if (fact) box.appendChild(el('p', 'fact', fact));
    if (d.cite) { const p = el('p', 'cite'); p.append(el('span', 'lbl', 'Name citation'), document.createTextNode(d.cite)); box.appendChild(p); }
    if (d.disc) box.appendChild(el('p', 'disc', d.disc));

    // children list
    let kids = b.children.filter((c) => c.kind !== 'historic' || c.d.grp !== 'sl9' || c.id === 'shoemaker-levy-9');
    if (b.id === 'sun') kids = kids.filter((c) => c.kind === 'planet' || (c.kind === 'dwarf' && !c.d.cand));
    if (kids.length) box.appendChild(childList(b, kids));

    // provenance
    const prov = el('div', 'prov');
    if (d.src) prov.appendChild(el('p', null, d.src));
    const imgKey = d.img || d.tex;
    if (d.model && MODEL[d.model]) prov.appendChild(el('p', null, `Shape: ${MODEL[d.model]}`));
    else if (d.model) prov.appendChild(el('p', null, 'Shape: spacecraft or radar shape model (NASA PDS, via Celestia)'));
    if (imgKey && IMG[imgKey] && !d.texGeneric) prov.appendChild(el('p', null, `Surface imagery: ${IMG[imgKey]}`));
    else if (b.kind === 'blackhole') prov.appendChild(el('p', null, (b.id === 'sgr-a' || b.id === 'm87') ? 'Shown as an illustration; the Event Horizon Telescope has imaged its shadow.' : 'Shown as an illustration — no image of this black hole exists.'));
    else if (b.kind === 'star' && b.id !== 'sun') prov.appendChild(el('p', null, 'Surface: Sun-derived (SDO) texture tinted to this star’s temperature — no close-up images exist.'));
    else if (b.kind !== 'star' && !d.model) prov.appendChild(el('p', null, 'Surface: representative texture — no spacecraft has photographed this object up close.'));
    box.appendChild(prov);
    updateLive(true);
  }
  function addJump(note, label, jd, rateSec) {
    const btn = el('button', 'jump', label);
    btn.addEventListener('click', () => { state.jd = jd; setRate(rateIndexOf(rateSec)); state.paused = false; syncPause(); if (infoBody) S.focus(infoBody); });
    note.appendChild(document.createElement('br'));
    note.appendChild(btn);
  }
  function autoFact(b) {
    const d = b.d;
    if (b.kind === 'moon' && b.parent) {
      const o = b.orb && b.orb.t === 'kep' ? b.orb : null;
      if (!o) return '';
      const retro = o.i > 90;
      const far = o.a > 3e6;
      const kind = far ? `an irregular ${retro ? 'retrograde' : 'prograde'} moon` : 'a regular inner moon';
      return `${b.name} is ${kind} of ${b.parent.name}, circling ${fmtDist(o.a)} out once every ${fmtDur(360 / o.n)}${far ? '. Irregular moons like this are thought to be captured fragments of asteroids or comets.' : '.'}`;
    }
    if (b.kind === 'star' && d.star) {
      const name = d.star[6];
      return CAT.starFacts[name] || '';
    }
    if (b.kind === 'comet' && b.orb) return b.orb.t === 'hyp' ? 'This comet is on an open, hyperbolic path and will not return.' : `This comet returns to the inner solar system about every ${fmtDur(b.period)}.`;
    if (b.kind === 'asteroid' && d.cls && CLASS_LABEL[d.cls]) return `One of ${nf(S.ast.total || 1581258)} asteroids in this atlas: a ${CLASS_LABEL[d.cls].toLowerCase()}.`;
    return '';
  }
  function childList(b, kids) {
    const wrap = el('section', 'kids');
    const moons = kids.filter((k) => k.kind === 'moon');
    const others = kids.filter((k) => k.kind !== 'moon');
    const title = b.id === 'sun' ? 'Planets and dwarf planets' : moons.length ? `${moons.length} moon${moons.length > 1 ? 's' : ''}` : 'Nearby';
    const h = el('div', 'kidsHead');
    h.appendChild(el('h3', null, title + (others.length && moons.length ? ` · ${others.length} more` : '')));
    let filter = null;
    if (kids.length > 12) { filter = el('input', 'kidFilter'); filter.placeholder = 'Filter'; filter.setAttribute('aria-label', 'Filter list'); h.appendChild(filter); }
    wrap.appendChild(h);
    const ul = el('ul', 'kidList');
    const items = [...moons, ...others].sort((x, y) => (x.size || 0) - (y.size || 0));
    const render = (q) => {
      ul.textContent = '';
      const nq = normKey(q || '');
      for (const k of items) {
        if (nq && !normKey(k.name).includes(nq)) continue;
        const li = el('li');
        const btn = el('button', 'kid');
        btn.appendChild(el('span', `dot k-${k.kind}`));
        btn.appendChild(el('span', 'kn', k.name));
        const ka = k.orb && k.orb.t === 'kep' ? k.orb.a : k.orb && k.orb.t === 'std' ? k.orb.el[0] * AU : 0;
        const meta = ka ? fmtDist(ka) : (KIND_LABEL[k.kind] || '');
        btn.appendChild(el('span', 'km', meta));
        btn.addEventListener('click', () => select(k));
        li.appendChild(btn); ul.appendChild(li);
      }
    };
    render('');
    if (filter) filter.addEventListener('input', () => render(filter.value));
    wrap.appendChild(ul);
    return wrap;
  }
  const lp = [0, 0, 0], lq = [0, 0, 0];
  function updateLive(force) {
    const b = infoBody;
    if (!b || !b.present) { for (const k in liveRows) liveRows[k].textContent = '—'; return; }
    const earth = E.byId.get('earth');
    if (liveRows.dsun) liveRows.dsun.textContent = fmtDist(V.len(b.pos));
    if (liveRows.dearth) liveRows.dearth.textContent = fmtDist(V.dist(b.pos, earth.pos));
    if (liveRows.light) liveRows.light.textContent = fmtDur(V.dist(b.pos, earth.pos) / 299792.458 / 86400);
    if (liveRows.speed && b.parent) {
      const h = 1 / 1440, jt = E.tdb(state.jd);
      E.positionAt(b, jt + h, lp); E.positionAt(b.parent, jt + h, lq);
      V.sub(lp, lp, lq);
      E.positionAt(b, jt - h, lq);
      const pp = [0, 0, 0]; E.positionAt(b.parent, jt - h, pp);
      V.sub(lq, lq, pp);
      const v = V.dist(lp, lq) / (2 * h * 86400);
      liveRows.speed.textContent = `${sig(v, 4)} km/s`;
    }
  }
  $('#infoToggle').addEventListener('click', () => { info.classList.toggle('expanded'); info.classList.toggle('collapsed', !info.classList.contains('expanded')); });
  $('#recenter').addEventListener('click', () => { if (S.cam.focus) S.focus(S.cam.focus); });

  /* ---------------- labels ---------------- */
  const labelBox = $('#labels');
  const pool = [];
  function labelEl(k) {
    while (pool.length <= k) {
      const n = el('button', 'lbl');
      n.tabIndex = -1;
      n.addEventListener('click', () => { if (n._b) select(n._b); });
      labelBox.appendChild(n); pool.push(n);
    }
    return pool[k];
  }
  const PRI = { star: 7000, planet: 6000, dwarf: 3500, station: 2600, spacecraft: 1500, interstellar: 2000, comet: 1200, asteroid: 1100, moon: 900, historic: 1300, blackhole: 800 };
  const placed = [];
  let namedStars = null, starLabelCache = [], blocks = [];
  function refreshBlocks() {
    blocks = [];
    for (const sel of ['#top', '#layers .set', '#layers #layersBtn', '#info', '#time', '#drawer.open', '#crumbs']) {
      const n = document.querySelector(sel);
      if (!n || n.hidden || !n.getClientRects().length || getComputedStyle(n).display === 'none') continue;
      const r = n.getBoundingClientRect();
      if (r.width && r.height) blocks.push([r.left - 4, r.top - 4, r.right + 4, r.bottom + 4]);
    }
  }
  function updateLabels() {
    const { W, H } = S.size();
    const L = state.layers;
    let used = 0;
    if (frameNoUI % 30 === 1) refreshBlocks();
    if (L.labels) {
      const f = S.cam.focus;
      const camSun = V.len(S.cam.pos);
      const deep = camSun > 1500 * AU || (f && (f.kind === 'star' || f.kind === 'blackhole') && f.id !== 'sun');
      const cand = [];
      let small = 0;
      for (const [b, s] of S.screen) {
        if (!b.present || b === f) continue;
        if (s.x < -40 || s.x > W + 40 || s.y < -20 || s.y > H + 20) continue;
        if (b.kind === 'blackhole' && (!L.bh || (!deep && f !== b))) continue;
        const shown = (b.markerAlpha || 0) > 0.2 || s.px > 1.5 || b.kind === 'blackhole' || (b.kind === 'star' && b.id !== 'sun');
        if (!shown) continue;
        let p = PRI[b.kind] || 500;
        const smallBody = b.kind === 'asteroid' || b.kind === 'comet' || b.kind === 'interstellar' || (b.kind === 'dwarf' && b.d.cand);
        if (f) {
          if (b === f.parent) p += 9000;
          else if (b.parent === f && !(f.id === 'sun' && smallBody)) p += 8000 + Math.log10(b.r + 1) * 100;
          else if (f.parent && b.parent === f.parent && f.parent.id !== 'sun') p += 4000;
        }
        if (b.kind === 'moon') {
          if (b.d.rEst) p -= 600;
          p += Math.log10(b.r + 1) * 120;
          if (b.parent !== f && b.parent !== (f && f.parent) && s.px < 1.5) p -= 300;
        }
        if (b.id === 'sun') p = camSun > 0.004 * LY ? 7500 : 7000;
        if (smallBody && b.parent === E.sun() && f && f.id === 'sun' && s.dist > 4 * AU) p -= 700;
        cand.push([p, b, s]);
      }
      // star names when travelling between the stars
      const starMode = L.stars && deep;
      if (starMode) {
        if (!namedStars) { namedStars = []; for (let k = 0; k < STARROWS.length; k++) if (STARROWS[k][8]) namedStars.push(k); }
        if (frameNoUI % 12 === 0) {
          starLabelCache = [];
          const p = [0, 0, 0], q = { x: 0, y: 0, z: 0 };
          for (const k of namedStars) {
            const e = S.starEcl[k];
            V.set(p, e[0] - S.cam.pos[0], e[1] - S.cam.pos[1], e[2] - S.cam.pos[2]);
            if (!S.project(p, q)) continue;
            const dly = V.len(p) / LY;
            if (dly < 0.004) continue;
            const m = STARROWS[k][3] + 5 * Math.log10(dly / 3.26156) - 5;
            if (m < 2.6) starLabelCache.push({ k, x: q.x, y: q.y, m, dist: dly * LY });
          }
          starLabelCache.sort((a, b) => a.m - b.m);
        }
        for (const s of starLabelCache.slice(0, 18)) cand.push([600 - s.m * 50, { name: STARROWS[s.k][6], kind: 'star', starIndex: s.k, _fake: true }, s]);
      }
      cand.sort((a, b) => b[0] - a[0]);
      placed.length = 0;
      const occ = [];
      for (const [ob, os] of S.screen) if (os.px > 5 && ob.present) occ.push([ob, os]);
      for (const [, b, s] of cand) {
        if (used >= 90) break;
        const w = b.name.length * 6.6 + 18, h = 16;
        const x0 = s.x + 7, y0 = s.y - 8;
        let hit = false;
        for (const [ob, os] of occ) { if (ob !== b && os.dist < s.dist && Math.hypot(s.x - os.x, s.y - os.y) < os.px * 0.97) { hit = true; break; } }
        if (hit) continue;
        for (const r of placed) { if (x0 < r[2] && x0 + w > r[0] && y0 < r[3] && y0 + h > r[1]) { hit = true; break; } }
        if (!hit) for (const r of blocks) { if (x0 < r[2] && x0 + w > r[0] && y0 < r[3] && y0 + h > r[1]) { hit = true; break; } }
        if (hit) continue;
        const isSmall = b.kind === 'asteroid' || b.kind === 'comet' || b.kind === 'interstellar';
        if (isSmall && b !== (f && f.parent) && b.parent !== f && ++small > 14) continue;
        placed.push([x0, y0, x0 + w, y0 + h]);
        const n = labelEl(used++);
        if (n._name !== b.name) { n.textContent = b.name; n._name = b.name; }
        const cls = `lbl k-${b.kind}${b.parent && f && (b.parent === f || b === f.parent) ? ' near' : ''}`;
        if (n.className !== cls) n.className = cls;
        n._b = b._fake ? null : b;
        if (b._fake) n.onclick = () => select(starBody(b.starIndex)); else n.onclick = null;
        n.style.transform = `translate(${Math.round(x0)}px, ${Math.round(y0)}px)`;
        n.hidden = false;
      }
    }
    for (let k = used; k < pool.length; k++) if (!pool[k].hidden) pool[k].hidden = true;
  }

  /* ---------------- search ---------------- */
  const qInput = $('#q'), results = $('#results');
  const index = [];
  const KRANK = { star: 0, planet: 1, dwarf: 2, moon: 3, station: 4, spacecraft: 5, interstellar: 6, comet: 7, asteroid: 8, historic: 9, blackhole: 10 };
  for (const b of E.bodies) {
    if (b.d.grp === 'sl9' && b.id !== 'shoemaker-levy-9' && b.id !== 'sl9-impacts') continue;
    const keys = [b.name, b.d.full, ...(b.d.alt || [])];
    if (b.d.num) keys.push(String(b.d.num));
    if (b.id === 'shoemaker-levy-9') keys.push('SL9', 'Shoemaker Levy 9', 'D/1993 F2');
    if (b.id === 'iss') keys.push('ISS');
    if (b.id === 'tiangong') keys.push('CSS', 'Chinese Space Station', 'Tianhe');
    if (b.id === 'sgr-a') keys.push('Sgr A*', 'Milky Way centre', 'galactic center');
    index.push({ keys: keys.filter(Boolean).map(normKey), label: b.name, kind: b.kind, rank: KRANK[b.kind] ?? 9, get: () => b, sub: b.parent && b.kind === 'moon' ? `Moon of ${b.parent.name}` : KIND_LABEL[b.kind] });
  }
  S.cometRows.forEach((r, k) => index.push({ keys: [normKey(r[0])], label: r[0], kind: 'comet', rank: 7, get: () => cometBody(k), sub: CLASS_LABEL[r[7]] || 'Comet' }));
  STARROWS.forEach((s, k) => {
    if (!s[6]) return;
    index.push({ keys: [normKey(s[6]), normKey(`${s[6]} ${s[7]}`)], label: s[8] ? s[6] : `${s[6]}${s[7] && !/^(HIP|HD|Gl|GJ)/.test(s[6]) ? ' ' + s[7] : ''}`, kind: 'star', rank: s[8] ? 0 : 11,
      get: () => starBody(k), sub: `Star · ${sig(Math.hypot(s[0], s[1], s[2]) * 3.26156, 3)} light-years` });
  });
  let astIndex = [];
  const featuredNums = new Set(E.bodies.filter((b) => b.d.num).map((b) => b.d.num));
  const featuredNames = new Set(E.bodies.map((b) => normKey(b.name)));
  function buildAstSearch() {
    astIndex = [];
    for (const num in astNames) {
      if (featuredNums.has(+num)) continue;
      const nm = astNames[num];
      astIndex.push({ keys: [normKey(nm)], label: nm, kind: 'asteroid', rank: 8, num: +num, sub: `Asteroid (${nf(+num)})` });
    }
    if (qInput.value) runSearch();
  }
  function findAsteroidByNumber(num) {
    for (const ch of S.ast.chunks) {
      if (ch.meta.kind !== 'numbered') continue;
      if (num >= ch.meta.first && num < ch.meta.first + ch.count) return { ch, i: num - ch.meta.first };
    }
    return null;
  }
  function packDesig(q) {
    const m = q.trim().toUpperCase().match(/^(\d{4})\s*([A-Z])([A-Z])(\d*)$/);
    if (!m) return null;
    const y = +m[1], l1 = m[2].charCodeAt(0) - 65, l2 = m[3].charCodeAt(0) - 65, n = +(m[4] || 0);
    if (y < 1800 || n > 4095) return null;
    return (((y - 1800) << 22) | (l1 << 17) | (l2 << 12) | n) >>> 0;
  }
  let activeIdx = -1, current = [];
  function runSearch() {
    const raw = qInput.value.trim();
    const q = normKey(raw);
    current = [];
    if (!q) { closeResults(); return; }
    const scored = [];
    const scan = (list) => {
      for (const it of list) {
        let best = 9;
        for (const k of it.keys) {
          if (k === q) { best = 0; break; }
          if (k.startsWith(q)) best = Math.min(best, 1);
          else if (k.includes(' ' + q) || k.includes('/' + q) || k.includes('(' + q)) best = Math.min(best, 2);
          else if (q.length > 2 && k.includes(q)) best = Math.min(best, 3);
        }
        if (best < 9) scored.push([best, it.rank, it.label.length, it]);
      }
    };
    scan(index);
    if (astIndex.length) scan(astIndex);
    scored.sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
    current = scored.slice(0, 14).map((s) => s[3]);
    // numbered asteroid lookup
    if (/^\d+$/.test(raw)) {
      const num = +raw;
      if (num > 0 && num <= 895910 && !current.some((c) => c.num === num || (c.get && c.get().d && c.get().d.num === num))) {
        current.unshift({ label: astNames && astNames[num] ? `${astNames[num]}` : `Asteroid (${nf(num)})`, kind: 'asteroid', sub: `Numbered asteroid ${nf(num)}`, num });
      }
    }
    const pk = packDesig(raw);
    if (pk) {
      for (const ch of S.ast.chunks) {
        if (!ch.desig) continue;
        const i = ch.desig.indexOf(pk);
        if (i >= 0) {
          if (!featuredNames.has(normKey(decodeDesig(pk)))) current.unshift({ label: decodeDesig(pk), kind: 'asteroid', sub: 'Asteroid · provisional designation', hit: { ch, i } });
          break;
        }
      }
    }
    renderResults();
  }
  function renderResults() {
    results.textContent = '';
    activeIdx = current.length ? 0 : -1;
    if (!current.length) {
      results.appendChild(el('div', 'empty', `No object named “${qInput.value.trim()}”. Try a name, an asteroid number like 433, or a designation like 2024 YR4.`));
    }
    current.forEach((it, k) => {
      const b = el('button', 'res' + (k === activeIdx ? ' on' : ''));
      b.setAttribute('role', 'option');
      b.appendChild(el('span', `dot k-${it.kind}`));
      b.appendChild(el('span', 'rn', it.label));
      b.appendChild(el('span', 'rs', it.sub || ''));
      b.addEventListener('click', () => choose(it));
      results.appendChild(b);
    });
    results.hidden = false;
    $('#search').classList.add('open');
  }
  function closeResults() { results.hidden = true; $('#search').classList.remove('open'); }
  async function choose(it) {
    if (it.get) { select(it.get()); qInput.value = ''; qInput.blur(); return; }
    if (it.hit) { await loadAstNames(); select(asteroidBody(it.hit.ch, it.hit.i)); qInput.value = ''; qInput.blur(); return; }
    if (it.num) {
      for (const b of E.bodies) if (b.d.num === it.num) { select(b); qInput.value = ''; qInput.blur(); return; }
      const hit = findAsteroidByNumber(it.num);
      if (!hit) { toast('That part of the asteroid catalogue is still loading — try again in a moment.'); return; }
      await loadAstNames();
      select(asteroidBody(hit.ch, hit.i));
      qInput.value = ''; qInput.blur();
    }
  }
  qInput.addEventListener('focus', () => { loadAstNames(); if (qInput.value) runSearch(); });
  qInput.addEventListener('input', runSearch);
  qInput.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!current.length) return;
      activeIdx = (activeIdx + (e.key === 'ArrowDown' ? 1 : -1) + current.length) % current.length;
      [...results.querySelectorAll('.res')].forEach((n, k) => n.classList.toggle('on', k === activeIdx));
    } else if (e.key === 'Enter') {
      if (current[activeIdx]) choose(current[activeIdx]);
    } else if (e.key === 'Escape') {
      qInput.value = ''; closeResults(); qInput.blur();
    }
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#search')) closeResults(); });

  /* ---------------- catalogue drawer ---------------- */
  const drawer = $('#drawer');
  $('#catalogBtn').addEventListener('click', () => { drawer.classList.toggle('open'); if (drawer.classList.contains('open') && !drawer.dataset.built) buildDrawer(); });
  $('#drawerClose').addEventListener('click', () => drawer.classList.remove('open'));
  function row(b, extra) {
    const btn = el('button', 'row');
    btn.appendChild(el('span', `dot k-${b.kind}`));
    btn.appendChild(el('span', 'rn', b.name));
    if (extra) btn.appendChild(el('span', 'rs', extra));
    btn.addEventListener('click', () => select(b));
    return btn;
  }
  function section(title, note) {
    const s = el('section', 'dsec');
    s.appendChild(el('h3', null, title));
    if (note) s.appendChild(el('p', 'dnote', note));
    return s;
  }
  function buildDrawer() {
    drawer.dataset.built = '1';
    const box = $('#drawerBody');
    const B = (id) => E.byId.get(id);
    const nMoons = (b) => b.children.filter((c) => c.kind === 'moon').length;
    let s = section('The Sun and planets');
    s.appendChild(row(B('sun'), 'G2V star'));
    for (const id of ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']) {
      const b = B(id); const n = nMoons(b);
      s.appendChild(row(b, n ? `${n} moon${n > 1 ? 's' : ''}` : 'no moons'));
    }
    box.appendChild(s);
    s = section('Dwarf planets', 'IAU dwarf planets, then likely candidates.');
    const dw = E.bodies.filter((b) => b.kind === 'dwarf');
    dw.sort((a, b) => (!!a.d.cand - !!b.d.cand) || a.size - b.size);
    for (const b of dw) { const n = nMoons(b); s.appendChild(row(b, (b.d.cand ? 'candidate' : 'dwarf planet') + (n ? ` · ${n} moon${n > 1 ? 's' : ''}` : ''))); }
    box.appendChild(s);
    s = section('Space stations', 'Active stations orbit in real time. Stations that have re-entered stay fixed at their debris sites.');
    for (const b of E.bodies.filter((x) => x.kind === 'station')) {
      const L = b.d.life;
      s.appendChild(row(b, b.d.hist ? `${E.jdToDate(L[0]).getUTCFullYear()}–${E.jdToDate(L[1]).getUTCFullYear()}` : `since ${E.jdToDate(L[0]).getUTCFullYear()}`));
    }
    for (const b of E.bodies.filter((x) => x.kind === 'spacecraft')) s.appendChild(row(b, 'spacecraft'));
    box.appendChild(s);
    s = section('Interstellar visitors');
    for (const b of E.bodies.filter((x) => x.kind === 'interstellar')) s.appendChild(row(b, 'hyperbolic'));
    box.appendChild(s);
    s = section('Uncommon and historic');
    s.appendChild(row(B('shoemaker-levy-9'), 'hit Jupiter 1994'));
    for (const id of ['kaepaokaawela', 'cruithne', 'kamooalewa', '2024-pt5', '2024-yr4', 'apophis', 'phaethon', 'damocles', 'hidalgo', 'chariklo', 'leleakuhonua', '2018-ag37', 'sedna', 'tesla-roadster']) {
      const b = B(id); if (b) s.appendChild(row(b, CLASS_LABEL[b.d.cls] || KIND_LABEL[b.kind]));
    }
    box.appendChild(s);
    s = section('Asteroids visited or imaged', `Plus ${nf(1581258)} more in the asteroid layer — click any dot or search by name, number or designation.`);
    const ast = E.bodies.filter((b) => b.kind === 'asteroid' && (b.d.model || !b.d.texGeneric));
    ast.sort((a, b) => (a.d.num || 1e9) - (b.d.num || 1e9));
    for (const b of ast) s.appendChild(row(b, b.d.num ? `(${nf(b.d.num)})` : ''));
    box.appendChild(s);
    s = section('More notable asteroids');
    const ast2 = E.bodies.filter((b) => b.kind === 'asteroid' && !(b.d.model || !b.d.texGeneric));
    ast2.sort((a, b) => (a.d.num || 1e9) - (b.d.num || 1e9));
    for (const b of ast2) s.appendChild(row(b, CLASS_LABEL[b.d.cls] || ''));
    box.appendChild(s);
    s = section('Comets', `Famous comets below; all ${nf(S.cometRows.length + 26)} known comets are in the comet layer and search.`);
    for (const b of E.bodies.filter((x) => x.kind === 'comet')) s.appendChild(row(b, CLASS_LABEL[b.d.cls] || ''));
    box.appendChild(s);
    s = section('Nearest stars', 'Distances from the Sun. Positions from the HYG database.');
    const near = STARROWS.map((r, k) => [Math.hypot(r[0], r[1], r[2]), k]).sort((a, b) => a[0] - b[0]).slice(0, 30);
    for (const [dpc, k] of near) {
      const r = STARROWS[k];
      const btn = el('button', 'row');
      btn.appendChild(el('span', 'dot k-star'));
      btn.appendChild(el('span', 'rn', r[6]));
      btn.appendChild(el('span', 'rs', `${sig(dpc * 3.26156, 3)} ly`));
      btn.addEventListener('click', () => select(starBody(k)));
      s.appendChild(btn);
    }
    box.appendChild(s);
    s = section('Black holes', 'Fixed reference points at their catalogue positions.');
    for (const b of E.bodies.filter((x) => x.kind === 'blackhole')) s.appendChild(row(b, `${sig(b.d.ly, 3)} ly`));
    box.appendChild(s);
  }

  /* ---------------- layers ---------------- */
  function setLayer(k, v) {
    state.layers[k] = v;
    const b = document.querySelector(`[data-layer="${k}"]`);
    if (b) b.setAttribute('aria-pressed', String(v));
  }
  document.querySelectorAll('[data-layer]').forEach((b) => {
    b.addEventListener('click', () => setLayer(b.dataset.layer, !state.layers[b.dataset.layer]));
  });
  $('#layersBtn').addEventListener('click', () => $('#layers').classList.toggle('open'));
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('#layers')) $('#layers').classList.remove('open'); });

  /* ---------------- time ---------------- */
  const RATES = [-315576000, -31557600, -2629800, -604800, -86400, -21600, -3600, -600, -60, -1, 1, 60, 600, 3600, 21600, 86400, 604800, 2629800, 31557600, 315576000];
  const RATE_NAME = { 1: 'Real time', 60: '1 min / s', 600: '10 min / s', 3600: '1 hour / s', 21600: '6 hours / s', 86400: '1 day / s', 604800: '1 week / s', 2629800: '1 month / s', 31557600: '1 year / s', 315576000: '10 years / s' };
  let rateIdx = 10;
  const rateIndexOf = (sec) => Math.max(0, RATES.indexOf(sec));
  function setRate(i) {
    rateIdx = Math.max(0, Math.min(RATES.length - 1, i));
    const r = RATES[rateIdx];
    state.rate = r / 86400;
    const name = r < 0 ? `Reverse · ${RATE_NAME[-r] === 'Real time' ? '1 s / s' : RATE_NAME[-r]}` : RATE_NAME[r];
    $('#rate').textContent = name;
    $('#rate').classList.toggle('fast', r !== 1);
  }
  function syncPause() {
    const p = $('#play');
    p.setAttribute('aria-label', state.paused ? 'Play' : 'Pause');
    p.innerHTML = state.paused
      ? '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 2.5v11l9-5.5z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 16 16" width="14" height="14"><path d="M4 2.5h3v11H4zM9 2.5h3v11H9z" fill="currentColor"/></svg>';
    document.body.classList.toggle('paused', state.paused);
  }
  $('#slower').addEventListener('click', () => setRate(rateIdx - 1));
  $('#faster').addEventListener('click', () => setRate(rateIdx + 1));
  $('#play').addEventListener('click', () => { state.paused = !state.paused; syncPause(); });
  $('#now').addEventListener('click', () => { state.jd = E.nowJD(); setRate(10); state.paused = false; syncPause(); });
  const dateInput = $('#dateInput');
  $('#dateBtn').addEventListener('click', () => {
    const d = E.jdToDate(state.jd);
    dateInput.value = `${String(d.getUTCFullYear()).padStart(4, '0')}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    $('#datePop').hidden = !$('#datePop').hidden;
    if (!$('#datePop').hidden) dateInput.focus();
  });
  $('#dateGo').addEventListener('click', () => {
    const v = dateInput.value;
    if (!v) return;
    const d = new Date(v + ':00Z');
    if (isNaN(d)) { toast('That date could not be read. Use the picker or the format 1994-07-16 20:00.'); return; }
    state.jd = clampJD(E.dateToJD(d));
    $('#datePop').hidden = true;
  });
  const JD_MIN = 2086302.5, JD_MAX = 2816787.5; // 1000–3000 CE
  const clampJD = (jd) => Math.max(JD_MIN, Math.min(JD_MAX, jd));
  let lastClock = '';
  function updateClock() {
    const d = E.jdToDate(state.jd);
    const s = `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
    const t = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())} UTC`;
    const k = s + t;
    if (k !== lastClock) { $('#dDate').textContent = s; $('#dTime').textContent = t; lastClock = k; }
    const y = d.getUTCFullYear();
    $('#validity').hidden = y >= 1800 && y <= 2050;
  }

  /* ---------------- credits ---------------- */
  $('#creditsBtn').addEventListener('click', () => { $('#credits').hidden = false; });
  $('#creditsClose').addEventListener('click', () => { $('#credits').hidden = true; });
  $('#credits').addEventListener('click', (e) => { if (e.target.id === 'credits') $('#credits').hidden = true; });

  /* ---------------- keyboard ---------------- */
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input, textarea')) return;
    if (e.key === '/') { e.preventDefault(); qInput.focus(); }
    else if (e.key === ' ') { e.preventDefault(); state.paused = !state.paused; syncPause(); }
    else if (e.key === ',' || e.key === '<') setRate(rateIdx - 1);
    else if (e.key === '.' || e.key === '>') setRate(rateIdx + 1);
    else if (e.key === 'c' || e.key === 'C') { if (S.cam.focus) S.focus(S.cam.focus); }
    else if (e.key === 'Backspace' || e.key === 'u') { e.preventDefault(); goUp(); }
    else if (e.key === 'n') $('#now').click();
    else if (e.key === 'Escape') { $('#credits').hidden = true; drawer.classList.remove('open'); $('#datePop').hidden = true; }
  });

  /* ---------------- start ---------------- */
  if (S.fileMode) $('#fileNote').hidden = false;
  setRate(10); syncPause();
  const sun = E.sun();
  E.updateAll(E.tdb(state.jd));
  S.cam.focus = sun;
  S.cam.dist = 62 * AU; S.cam.yaw = -1.9; S.cam.pitch = 0.62;
  renderInfo(sun); renderCrumbs(sun);
  S.loadAsteroids((n, total) => {
    const pct = Math.round((n / total) * 100);
    $('#astCount').textContent = n >= total ? nf((S.ast.index && S.ast.index.stats && S.ast.index.stats.valid) || total) : `${pct}%`;
  });

  let last = performance.now(), frameNoUI = 0, liveT = 0;
  function loop(now) {
    const dt = Math.min(0.25, Math.max(0, (now - last) / 1000));
    last = now;
    if (!state.paused) state.jd = clampJD(state.jd + state.rate * dt);
    S.tick(dt);
    S.frame();
    frameNoUI++;
    updateLabels();
    updateClock();
    liveT += dt;
    if (liveT > 0.25) { liveT = 0; updateLive(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame((t) => { last = t; document.body.classList.add('ready'); loop(t); });
})();
