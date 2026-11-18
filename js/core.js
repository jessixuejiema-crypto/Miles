/* Ephemeris — core: units, time, orbital mechanics and the runtime body tree.
   World frame: heliocentric, J2000 mean ecliptic & equinox, kilometres, Julian Day (TDB≈UTC). */
(function () {
  'use strict';
  const E = (window.EPH = window.EPH || {});

  const DEG = Math.PI / 180;
  const AU = 149597870.7;
  const LY = 9.4607304725808e12;
  const PC = 3.0856775814913673e13;
  const J2000 = 2451545.0;
  const GM_SUN = 1.32712440018e11;
  const OBL = 23.4392911 * DEG;
  const cE = Math.cos(OBL), sE = Math.sin(OBL);
  const MOON_MASS_RATIO = 0.0121505856; // Moon / (Earth + Moon)
  Object.assign(E, { DEG, AU, LY, PC, J2000, GM_SUN });

  /* ---------- small vector helpers on plain arrays (float64) ---------- */
  const V = {
    set(o, x, y, z) { o[0] = x; o[1] = y; o[2] = z; return o; },
    copy(o, a) { o[0] = a[0]; o[1] = a[1]; o[2] = a[2]; return o; },
    add(o, a, b) { o[0] = a[0] + b[0]; o[1] = a[1] + b[1]; o[2] = a[2] + b[2]; return o; },
    sub(o, a, b) { o[0] = a[0] - b[0]; o[1] = a[1] - b[1]; o[2] = a[2] - b[2]; return o; },
    scale(o, a, s) { o[0] = a[0] * s; o[1] = a[1] * s; o[2] = a[2] * s; return o; },
    addScaled(o, a, b, s) { o[0] = a[0] + b[0] * s; o[1] = a[1] + b[1] * s; o[2] = a[2] + b[2] * s; return o; },
    dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; },
    len(a) { return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]); },
    dist(a, b) { const x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2]; return Math.sqrt(x * x + y * y + z * z); },
    norm(o, a) { const l = Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]) || 1; o[0] = a[0] / l; o[1] = a[1] / l; o[2] = a[2] / l; return o; },
    cross(o, a, b) {
      const x = a[1] * b[2] - a[2] * b[1], y = a[2] * b[0] - a[0] * b[2], z = a[0] * b[1] - a[1] * b[0];
      o[0] = x; o[1] = y; o[2] = z; return o;
    },
    lerp(o, a, b, t) { o[0] = a[0] + (b[0] - a[0]) * t; o[1] = a[1] + (b[1] - a[1]) * t; o[2] = a[2] + (b[2] - a[2]) * t; return o; },
  };
  E.V = V;

  function icrfToEcl(o, x, y, z) { return V.set(o, x, y * cE + z * sE, -y * sE + z * cE); }
  function eclToIcrf(o, x, y, z) { return V.set(o, x, y * cE - z * sE, y * sE + z * cE); }
  function radec(ra, dec) { // degrees -> ICRF unit vector
    const r = ra * DEG, d = dec * DEG;
    return [Math.cos(d) * Math.cos(r), Math.cos(d) * Math.sin(r), Math.sin(d)];
  }
  Object.assign(E, { icrfToEcl, eclToIcrf, radec });

  /* ---------- time ----------
     The app's clock is UTC; ephemerides are in TDB (≈ TT). ΔT = TT − UT from Espenak & Meeus polynomials. */
  function deltaT(jd) {
    const y = 2000 + (jd - J2000) / 365.25;
    let t;
    if (y >= 2017) return 69.184;
    if (y >= 1972) return 42.184 + (y - 1972) * 0.6;
    if (y >= 1961) { t = y - 1975; return 45.45 + 1.067 * t - (t * t) / 260 - (t * t * t) / 718; }
    if (y >= 1941) { t = y - 1950; return 29.07 + 0.407 * t - (t * t) / 233 + (t * t * t) / 2547; }
    if (y >= 1920) { t = y - 1920; return 21.2 + 0.84493 * t - 0.0761 * t * t + 0.0020936 * t * t * t; }
    if (y >= 1900) { t = y - 1900; return -2.79 + 1.494119 * t - 0.0598939 * t * t + 0.0061966 * t ** 3 - 0.000197 * t ** 4; }
    const u = (y - 1820) / 100;
    return -20 + 32 * u * u;
  }
  E.deltaT = deltaT;
  E.tdb = (jdUtc) => jdUtc + deltaT(jdUtc) / 86400;

  E.nowJD = () => Date.now() / 86400000 + 2440587.5;
  E.jdToDate = (jd) => new Date((jd - 2440587.5) * 86400000);
  E.dateToJD = (d) => d.getTime() / 86400000 + 2440587.5;

  /* ---------- Kepler equation ---------- */
  function keplerE(M, e) {
    M = M - 2 * Math.PI * Math.floor((M + Math.PI) / (2 * Math.PI));
    let x = e < 0.8 ? M : (M < 0 ? -Math.PI : Math.PI);
    for (let k = 0; k < 50; k++) {
      const d = (x - e * Math.sin(x) - M) / (1 - e * Math.cos(x));
      x -= d;
      if (Math.abs(d) < 1e-13) break;
    }
    return x;
  }
  function keplerH(M, e) {
    // safeguarded Newton–bisection on f(H) = e·sinh H − H − |M| (H ≥ 0); robust for near-parabolic orbits
    const m = Math.abs(M);
    if (m === 0) return 0;
    let lo = 0, hi = Math.max(1, Math.asinh(m / e) + 1);
    while (e * Math.sinh(hi) - hi - m < 0) hi *= 2;
    let H = Math.min(hi, Math.max(lo, Math.cbrt((6 * m) / e)));
    for (let k = 0; k < 100; k++) {
      const f = e * Math.sinh(H) - H - m;
      if (f > 0) hi = H; else lo = H;
      const fp = e * Math.cosh(H) - 1;
      let Hn = fp > 0 ? H - f / fp : NaN;
      if (!(Hn > lo && Hn < hi)) Hn = 0.5 * (lo + hi);
      if (Math.abs(Hn - H) < 1e-14 * Math.max(1, H)) { H = Hn; break; }
      H = Hn;
    }
    return M < 0 ? -H : H;
  }
  E.keplerE = keplerE;

  /* ---------- reference frames for orbital elements ---------- */
  const ECL = { X: [1, 0, 0], Y: [0, 1, 0], Z: [0, 0, 1] };
  const ICRF = { X: [1, 0, 0], Y: [0, cE, -sE], Z: [0, sE, cE] };
  function frameBasis(o) {
    if (o._fb) return o._fb;
    if (o.fr === 'icrf') return (o._fb = ICRF);
    if (o.fr === 'pole') {
      const p = radec(o.pole[0], o.pole[1]);
      const N = [-Math.sin(o.pole[0] * DEG), Math.cos(o.pole[0] * DEG), 0];
      const Q = V.cross([0, 0, 0], p, N);
      return (o._fb = { X: icrfToEcl([0, 0, 0], ...N), Y: icrfToEcl([0, 0, 0], ...Q), Z: icrfToEcl([0, 0, 0], ...p) });
    }
    return (o._fb = ECL);
  }


  /* ---------- the Moon: main terms of ELP-2000/82 (Meeus, Astronomical Algorithms ch. 47) ---------- */
  const LR = [ // D, M, M', F, Σl (1e-6 deg), Σr (m)
    [0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],
    [0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],
    [2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],
    [0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],[0,0,1,-2,10980,79661],
    [4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],
    [2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],
    [2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],
    [2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],[1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884]];
  const LB = [ // D, M, M', F, Σb (1e-6 deg)
    [0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],
    [2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],
    [2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065]];
  function lunarGeocentric(jd, out) {
    const T = (jd - J2000) / 36525, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
    const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
    const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
    const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
    const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
    const F = 93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;
    const Ec = 1 - 0.002516 * T - 0.0000074 * T2;
    const A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.29 * T, A3 = 313.45 + 481266.484 * T;
    let sl = 0, sr = 0, sb = 0;
    for (const t of LR) {
      const arg = (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * DEG;
      const ef = t[1] === 0 ? 1 : Math.abs(t[1]) === 1 ? Ec : Ec * Ec;
      sl += t[4] * ef * Math.sin(arg); sr += t[5] * ef * Math.cos(arg);
    }
    for (const t of LB) {
      const arg = (t[0] * D + t[1] * M + t[2] * Mp + t[3] * F) * DEG;
      const ef = t[1] === 0 ? 1 : Math.abs(t[1]) === 1 ? Ec : Ec * Ec;
      sb += t[4] * ef * Math.sin(arg);
    }
    sl += 3958 * Math.sin(A1 * DEG) + 1962 * Math.sin((Lp - F) * DEG) + 318 * Math.sin(A2 * DEG);
    sb += -2235 * Math.sin(Lp * DEG) + 382 * Math.sin(A3 * DEG) + 175 * Math.sin((A1 - F) * DEG) + 175 * Math.sin((A1 + F) * DEG)
      + 127 * Math.sin((Lp - Mp) * DEG) - 115 * Math.sin((Lp + Mp) * DEG);
    // ecliptic of date -> J2000 (general precession in longitude)
    const lam = (Lp + sl / 1e6 - 1.396971 * T - 0.0003086 * T2) * DEG, bet = (sb / 1e6) * DEG;
    const dist = 385000.56 + sr / 1000;
    return V.set(out, dist * Math.cos(bet) * Math.cos(lam), dist * Math.cos(bet) * Math.sin(lam), dist * Math.sin(bet));
  }
  E.lunarGeocentric = lunarGeocentric;


  /* helpers for tabulated data */
  const tabTmp = [0, 0, 0];
  function tableValue(t, jd) { // linear interpolation in {t0, d: [day offsets], v: [values]}
    const x = jd - t.t0, d = t.d, v = t.v, n = d.length;
    if (x <= d[0]) return v[0];
    if (x >= d[n - 1]) return v[n - 1];
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (d[m] <= x) lo = m; else hi = m; }
    return v[lo] + (v[hi] - v[lo]) * (x - d[lo]) / (d[hi] - d[lo]);
  }
  function tabIndex(o, jd) {
    const x = jd - o.t0, R = o.rows;
    if (x <= R[0][0]) return 0;
    if (x >= R[R.length - 1][0]) return R.length - 1;
    let lo = 0, hi = R.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R[m][0] <= x) lo = m; else hi = m; }
    return lo;
  }
  function tabRow(o, k) { // row: [day offset, a, e, i, node, argp, M, n(deg/day)]
    const cache = o._rows || (o._rows = []);
    if (cache[k]) return cache[k];
    const r = o.rows[k];
    return (cache[k] = { t: 'kep', a: r[1], e: r[2], i: r[3], O: r[4], w: r[5], M: r[6], n: r[7], ep: o.t0 + r[0], fr: 'ecl' });
  }
  E.meanAnomalyDeg = (o, jd) => {
    let M = o.M + (o.nl ? o.n - (o.dO || 0) - (o.dw || 0) : o.n) * (jd - o.ep);
    if (o.dM) M += tableValue(o.dM, jd);
    return M;
  };
  E.tabKep = (o, jd) => (o.t === 'tab' ? tabRow(o, tabIndex(o, jd)) : o);

  /* Position of an orbit relative to its parent, ecliptic km. Writes the orbit-plane normal to o._nrm. */
  function orbitRel(o, jd, out) {
    let x, y, Ω, ω, inc, e;
    if (o.t === 'std') {
      const el = o.el, T = (jd - J2000) / 36525;
      const a = (el[0] + el[6] * T) * AU;
      e = el[1] + el[7] * T;
      inc = (el[2] + el[8] * T) * DEG;
      const L = el[3] + el[9] * T, wb = el[4] + el[10] * T, node = el[5] + el[11] * T;
      Ω = node * DEG; ω = (wb - node) * DEG;
      const EA = keplerE((L - wb) * DEG, e);
      x = a * (Math.cos(EA) - e); y = a * Math.sqrt(1 - e * e) * Math.sin(EA);
    } else if (o.t === 'kep') {
      const dt = jd - o.ep;
      e = o.e; inc = o.i * DEG;
      Ω = (o.O + (o.dO || 0) * dt) * DEG; ω = (o.w + (o.dw || 0) * dt) * DEG;
      // JPL satellite periods are sidereal: they set the mean-longitude rate, so apsidal + nodal
      // precession must come out of the mean-anomaly rate (otherwise it is counted twice).
      let Mdeg = o.M + (o.nl ? o.n - (o.dO || 0) - (o.dw || 0) : o.n) * dt;
      if (o.dM) Mdeg += tableValue(o.dM, jd);
      if (o.m2) Mdeg += o.m2 * dt * Math.max(-10, Math.min(10, dt));
      const EA = keplerE(Mdeg * DEG, e);
      x = o.a * (Math.cos(EA) - e); y = o.a * Math.sqrt(1 - e * e) * Math.sin(EA);
    } else if (o.t === 'hyp') {
      e = o.e; inc = o.i * DEG; Ω = o.O * DEG; ω = o.w * DEG;
      const aa = o.q / (e - 1);
      const n = Math.sqrt(o.mu / (aa * aa * aa)); // rad/s
      const H = keplerH(n * (jd - o.tp) * 86400, e);
      x = aa * (e - Math.cosh(H)); y = aa * Math.sqrt(e * e - 1) * Math.sinh(H);
    } else if (o.t === 'tab') {
      // time series of JPL Horizons osculating elements; blend the two neighbouring sets for continuity
      const k = tabIndex(o, jd);
      const r0 = tabRow(o, k), r1 = tabRow(o, Math.min(k + 1, o.rows.length - 1));
      orbitRel(r0, jd, out);
      if (r1 !== r0) {
        const t0 = o.t0 + o.rows[k][0], t1 = o.t0 + o.rows[k + 1][0];
        const w = Math.max(0, Math.min(1, (jd - t0) / (t1 - t0)));
        if (w > 0) { orbitRel(r1, jd, tabTmp); for (let c = 0; c < 3; c++) out[c] += (tabTmp[c] - out[c]) * w; }
      }
      o._nrm = r0._nrm;
      return out;
    } else if (o.t === 'tl') {
      let ph = o.ph[o.ph.length - 1];
      for (const p of o.ph) { if (p.end == null || jd < p.end) { ph = p; break; } }
      const r = orbitRel(ph.o, jd, out); o._nrm = ph.o._nrm; return r;
    } else {
      return V.set(out, 0, 0, 0);
    }
    const cO = Math.cos(Ω), sO = Math.sin(Ω), cw = Math.cos(ω), sw = Math.sin(ω), ci = Math.cos(inc), si = Math.sin(inc);
    const Px = cw * cO - sw * sO * ci, Py = cw * sO + sw * cO * ci, Pz = sw * si;
    const Qx = -sw * cO - cw * sO * ci, Qy = -sw * sO + cw * cO * ci, Qz = cw * si;
    const fx = x * Px + y * Qx, fy = x * Py + y * Qy, fz = x * Pz + y * Qz;
    const B = o.t === 'std' ? ECL : frameBasis(o);
    out[0] = fx * B.X[0] + fy * B.Y[0] + fz * B.Z[0];
    out[1] = fx * B.X[1] + fy * B.Y[1] + fz * B.Z[1];
    out[2] = fx * B.X[2] + fy * B.Y[2] + fz * B.Z[2];
    const wx = si * sO, wy = -si * cO, wz = ci; // orbit normal in frame coords
    const n = o._nrm || (o._nrm = [0, 0, 1]);
    n[0] = wx * B.X[0] + wy * B.Y[0] + wz * B.Z[0];
    n[1] = wx * B.X[1] + wy * B.Y[1] + wz * B.Z[1];
    n[2] = wx * B.X[2] + wy * B.Y[2] + wz * B.Z[2];
    if (o.lunar) lunarGeocentric(jd, out);
    return out;
  }
  E.orbitRel = orbitRel;

  /* Orbital period in days (Infinity for hyperbolic, 0 for fixed). */
  function orbitPeriod(o) {
    if (!o) return 0;
    if (o.t === 'kep') return 360 / o.n;
    if (o.t === 'std') return 360 / (o.el[9] / 36525);
    if (o.t === 'tl') return orbitPeriod(o.ph[o.ph.length - 1].o);
    if (o.t === 'tab') return 360 / o.rows[o.rows.length >> 1][7];
    if (o.t === 'hyp') return Infinity;
    return 0;
  }
  function orbitSize(o) {
    if (!o) return 0;
    if (o.t === 'kep') return o.a * (1 + o.e);
    if (o.t === 'std') return o.el[0] * AU * (1 + o.el[1]);
    if (o.t === 'tl') return orbitSize(o.ph[o.ph.length - 1].o);
    if (o.t === 'tab') { const r = o.rows[o.rows.length >> 1]; return r[1] * (1 + r[2]); }
    if (o.t === 'hyp') return o.q * 40;
    return 0;
  }
  E.orbitPeriod = orbitPeriod;
  E.orbitSize = orbitSize;

  /* Comet rows from the catalogue -> orbit objects */
  E.cometOrbit = function (q, e, tp, i, O, w) {
    q *= AU;
    if (e < 0.99999) {
      const a = q / (1 - e);
      const n = Math.sqrt(GM_SUN / (a * a * a)) * 86400 / DEG; // deg/day
      return { t: 'kep', a, e, i, O, w, M: 0, ep: tp, n, fr: 'ecl' };
    }
    return { t: 'hyp', q, e: Math.max(e, 1.000001), i, O, w, tp, mu: GM_SUN, fr: 'ecl' };
  };

  /* ---------- the runtime body tree ---------- */
  const KIND_ORDER = { star: 0, planet: 1, dwarf: 2, moon: 3, asteroid: 4, comet: 5, interstellar: 6, station: 7, spacecraft: 8, historic: 9, blackhole: 10 };

  class Body {
    constructor(d) {
      this.d = d;
      this.id = d.id;
      this.name = d.n;
      this.kind = d.k;
      this.r = d.r || 1;
      this.rp = d.rp || this.r;
      this.parent = null;
      this.children = [];
      this.pos = [0, 0, 0];
      this.rel = [0, 0, 0];
      this.m = [1, 0, 0]; // prime meridian (ecliptic unit vector)
      this.pl = [0, 0, 1]; // rotation pole
      this.present = true;
      this.orb = d.orb;
      this.period = orbitPeriod(d.orb);
      this.size = orbitSize(d.orb);
      this.ord = KIND_ORDER[d.k] ?? 20;
      const ax = d.ax;
      this.bound = ax ? Math.max(...ax) : this.r; // bounding radius for models
    }
    /** Is the body present (launched, not yet destroyed) at jd? Returns the orbit to use. */
    orbitAt(jd) {
      const L = this.d.life;
      if (L) {
        if (L[0] && jd < L[0]) return null;
        if (L[1] && jd > L[1]) return this.d.post || null;
      }
      return this.orb;
    }
  }
  E.Body = Body;

  const bodies = [];
  const byId = new Map();
  E.bodies = bodies;
  E.byId = byId;

  E.addBody = function (d, parentId) {
    const b = new Body(d);
    const pid = parentId !== undefined ? parentId : d.p;
    if (pid) {
      b.parent = byId.get(pid) || null;
      if (b.parent) b.parent.children.push(b);
    }
    bodies.push(b);
    byId.set(b.id, b);
    return b;
  };

  E.buildTree = function () {
    for (const d of window.CATALOG.bodies) E.addBody(d, d.k === 'blackhole' ? null : undefined);
    // planets' moon lists sorted by distance
    for (const b of bodies) b.children.sort((a, c) => (a.size || 0) - (c.size || 0));
  };

  E.sun = () => byId.get('sun');

  /* ---------- rotation models ---------- */
  const tmpA = [0, 0, 0], tmpB = [0, 0, 0], tmpC = [0, 0, 0];
  function setFromIcrfPole(b, ra, dec, Wdeg) {
    const p = radec(ra, dec);
    // IAU convention: the node of the body's equator lies at right ascension ra + 90°
    const N = [-Math.sin(ra * DEG), Math.cos(ra * DEG), 0];
    const Q = V.cross(tmpA, p, N);
    const W = Wdeg * DEG, c = Math.cos(W), s = Math.sin(W);
    icrfToEcl(b.m, N[0] * c + Q[0] * s, N[1] * c + Q[1] * s, N[2] * c + Q[2] * s);
    icrfToEcl(b.pl, p[0], p[1], p[2]);
  }

  function updateOrientation(b, jd) {
    const rot = b.d.rot;
    const d = jd - J2000;
    if (rot && rot.t === 'iau') {
      const v = rot.v;
      setFromIcrfPole(b, v[0], v[1], v[2] + v[3] * d);
      return;
    }
    if (rot && rot.t === 'spin') {
      const W = 360 * ((d * 24) / rot.P);
      if (rot.pole) { setFromIcrfPole(b, rot.pole[0], rot.pole[1], W); return; }
      const w = (W % 360) * DEG;
      V.set(b.pl, 0, 0, 1); V.set(b.m, Math.cos(w), Math.sin(w), 0);
      return;
    }
    // synchronous (or default for moons / stations): prime meridian faces the parent
    if (b.parent && (rot ? rot.t === 'sync' : (b.kind === 'moon' || b.kind === 'station' || b.kind === 'historic'))) {
      const o = b._orbUsed;
      if (o && o._nrm) V.copy(b.pl, o._nrm); else V.set(b.pl, 0, 0, 1);
      V.sub(tmpB, b.parent.pos, b.pos);
      // orthogonalise against the pole
      V.addScaled(tmpB, tmpB, b.pl, -V.dot(tmpB, b.pl));
      if (V.len(tmpB) < 1e-12) V.set(tmpB, 1, 0, 0);
      V.norm(b.m, tmpB);
      return;
    }
    const P = b.d.rotP || 9;
    const w = ((((d * 24) / P) % 1) * 360) * DEG;
    V.set(b.pl, 0, 0, 1); V.set(b.m, Math.cos(w), Math.sin(w), 0);
  }
  E.updateOrientation = updateOrientation;

  /* ---------- positions for one instant ---------- */
  const moonRel = [0, 0, 0];
  function surfacePoint(out, parent, lat, lon, h) {
    const la = lat * DEG, lo = lon * DEG;
    V.cross(tmpC, parent.pl, parent.m); // east
    const r = (parent.r || 1) + (h || 0);
    const cl = Math.cos(la);
    for (let k = 0; k < 3; k++) {
      out[k] = parent.pos[k] + r * (cl * Math.cos(lo) * parent.m[k] + cl * Math.sin(lo) * tmpC[k] + Math.sin(la) * parent.pl[k]);
    }
    return out;
  }
  E.surfacePoint = surfacePoint;

  E.updateBody = function (b, jd) {
    const o = b.orbitAt(jd);
    b._orbUsed = o;
    b.present = !!o;
    if (!o) return;
    if (o.t === 'origin') {
      V.set(b.pos, 0, 0, 0);
    } else if (o.t === 'radec') {
      const u = radec(o.ra, o.dec);
      icrfToEcl(b.pos, u[0] * o.d, u[1] * o.d, u[2] * o.d);
    } else if (o.t === 'fix') {
      if (!b.parent) return;
      surfacePoint(b.pos, b.parent, o.lat, o.lon, 0);
    } else if (o.t === 'pos') {
      V.copy(b.pos, o.p);
    } else {
      orbitRel(o, jd, b.rel);
      if (b.d.emb) {
        const moon = byId.get('moon');
        orbitRel(moon.orb, jd, moonRel);
        V.addScaled(b.rel, b.rel, moonRel, -MOON_MASS_RATIO);
      }
      if (b.parent) V.add(b.pos, b.parent.pos, b.rel); else V.copy(b.pos, b.rel);
    }
  };

  /* Full update in tree order (parents before children). */
  let order = null;
  E.updateAll = function (jd) {
    if (!order) {
      order = [];
      const visit = (b) => { order.push(b); for (const c of b.children) visit(c); };
      for (const b of bodies) if (!b.parent) visit(b);
    }
    for (const b of order) {
      E.updateBody(b, jd);
      if (b.present) updateOrientation(b, jd);
    }
  };
  E.resetOrder = () => { order = null; };

  /* Position of body at another time (used for trails & velocities); returns heliocentric. */
  const tmpP = [0, 0, 0];
  E.positionAt = function (b, jd, out) {
    const chain = [];
    for (let x = b; x; x = x.parent) chain.push(x);
    V.set(out, 0, 0, 0);
    for (let k = chain.length - 1; k >= 0; k--) {
      const x = chain[k];
      const o = x.orbitAt(jd);
      if (!o) continue;
      if (o.t === 'radec') { const u = radec(o.ra, o.dec); icrfToEcl(tmpP, u[0] * o.d, u[1] * o.d, u[2] * o.d); V.copy(out, tmpP); continue; }
      if (o.t === 'origin' || o.t === 'fix' || o.t === 'pos') continue;
      orbitRel(o, jd, tmpP);
      if (x.d.emb) { orbitRel(byId.get('moon').orb, jd, moonRel); V.addScaled(tmpP, tmpP, moonRel, -MOON_MASS_RATIO); }
      V.add(out, out, tmpP);
    }
    return out;
  };

  /* ---------- stars ---------- */
  E.starTemp = function (ci) { // Ballesteros (2012)
    return 4600 * (1 / (0.92 * ci + 1.7) + 1 / (0.92 * ci + 0.62));
  };
  E.starColor = function (ci) { // approximate blackbody tint from B–V
    const t = E.starTemp(ci);
    const x = Math.max(1000, Math.min(40000, t)) / 100;
    let r, g, b;
    if (x <= 66) { r = 255; g = 99.47 * Math.log(x) - 161.12; b = x <= 19 ? 0 : 138.52 * Math.log(x - 10) - 305.04; }
    else { r = 329.7 * Math.pow(x - 60, -0.1332); g = 288.12 * Math.pow(x - 60, -0.0755); b = 255; }
    const c = (v) => Math.max(0, Math.min(255, v)) / 255;
    return [c(r), c(g), c(b)];
  };
  E.starRadiusKm = function (absmag, ci) {
    const L = Math.pow(10, (4.83 - absmag) / 2.5);
    const T = E.starTemp(ci);
    return 695700 * Math.sqrt(L) * Math.pow(5772 / T, 2);
  };
})();
