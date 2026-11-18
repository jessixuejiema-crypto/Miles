/* Ephemeris — scene: three.js rendering with a floating origin.
   Every frame the camera sits at the three.js origin; all objects are placed at (position − cameraPosition),
   computed in float64, so the focused object is centred exactly at any scale. */
(function () {
  'use strict';
  const E = window.EPH, V = E.V;
  const S = (E.S = {});
  const AU = E.AU, LY = E.LY, DEG = E.DEG;

  /* ecliptic (x, y, z) -> three.js (x, z, −y): ecliptic north is "up" */
  const toT = (v, o) => o.set(v[0], v[2], -v[1]);

  /* Depth comes from the logarithmic depth buffer (gl_FragDepth), so clip-space z is only used for clipping.
     At extreme distances float32 rounding pushes z onto the far-plane boundary and triangles get clipped;
     pinning z to 0 keeps everything in front of the camera inside the clip volume. */
  THREE.ShaderChunk.logdepthbuf_vertex = THREE.ShaderChunk.logdepthbuf_vertex.replace(
    'vFragDepth = 1.0 + gl_Position.w;', 'vFragDepth = 1.0 + gl_Position.w;\n\t\tgl_Position.z = 0.0;');
  const v3 = () => new THREE.Vector3();
  const LOG10 = Math.log(10);

  const state = (E.state = {
    jd: E.nowJD(), rate: 1 / 86400, paused: false,
    layers: { orbits: true, trails: true, labels: true, asteroids: true, comets: true, stars: true, bh: true },
  });

  /* ---------------- renderer & camera ---------------- */
  const canvas = document.getElementById('gl');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x020306, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 1e-6, 1e23);
  S.renderer = renderer; S.camera = camera; S.scene = scene;
  const PR = () => renderer.getPixelRatio();
  let W = 1, H = 1, pxPerRad = 1;
  function resize() {
    W = canvas.clientWidth || window.innerWidth; H = canvas.clientHeight || window.innerHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H; camera.updateProjectionMatrix();
    pxPerRad = (H / 2) / Math.tan((camera.fov * DEG) / 2);
  }
  window.addEventListener('resize', resize);
  resize();
  S.size = () => ({ W, H });

  const cam = (S.cam = { pos: [0, 0, 0], focus: null, yaw: -1.2, pitch: 0.42, dist: 6e8, tr: null });
  const fwd = [0, 0, 0];
  function dirFrom(yaw, pitch, o) {
    const cp = Math.cos(pitch);
    return V.set(o, cp * Math.cos(yaw), cp * Math.sin(yaw), Math.sin(pitch));
  }

  /* ---------------- shared GLSL ---------------- */
  const LOGV = '#include <common>\n#include <logdepthbuf_pars_vertex>\n';
  const LOGF = '#include <logdepthbuf_pars_fragment>\n';
  function shader(opts) {
    return new THREE.ShaderMaterial(Object.assign({ extensions: { fragDepth: true } }, opts));
  }

  /* ---------------- textures & models ---------------- */
  const texLoader = new THREE.TextureLoader();
  const texCache = new Map();
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const fileMode = location.protocol === 'file:';
  S.fileMode = fileMode;
  function getTex(path) {
    if (!path || fileMode) return null;
    let t = texCache.get(path);
    if (!t) {
      t = texLoader.load(path, undefined, undefined, () => { console.warn('missing texture', path); });
      t.anisotropy = maxAniso;
      texCache.set(path, t);
    }
    return t;
  }
  S.getTex = getTex;
  const bodyTex = (key) => (key ? getTex(`textures/${key}.jpg`) : null);

  const modelCache = new Map();
  function loadModel(name) {
    if (modelCache.has(name)) return modelCache.get(name);
    const p = E.fetchBinary(`models/${name}.msh`).then((buf) => {
      const dv = new DataView(buf);
      const hl = dv.getUint32(4, true);
      const h = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 8, hl)));
      const base = 8 + hl;
      const g = new THREE.BufferGeometry();
      const o = h.offsets;
      g.setAttribute('position', new THREE.BufferAttribute(new Int16Array(buf, base + o.pos, h.vcount * 3), 3, true));
      g.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, base + o.nrm, h.vcount * 3), 3, true));
      if (h.hasUV) {
        const raw = new Uint16Array(buf, base + o.uv, h.vcount * 2);
        const uv = new Float32Array(h.vcount * 2);
        for (let k = 0; k < h.vcount; k++) {
          uv[2 * k] = h.uvMin[0] + (raw[2 * k] / 65535) * h.uvSpan[0];
          uv[2 * k + 1] = 1 - (h.uvMin[1] + (raw[2 * k + 1] / 65535) * h.uvSpan[1]);
        }
        g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      } else {
        g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(h.vcount * 2), 2));
      }
      const idx = h.idx32 ? new Uint32Array(buf, base + o.idx, h.icount) : new Uint16Array(buf, base + o.idx, h.icount);
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      for (const gr of h.groups) g.addGroup(gr.start, gr.count, gr.mat);
      g.computeBoundingSphere();
      return { geometry: g, materials: h.materials };
    });
    modelCache.set(name, p);
    return p;
  }

  /* radial glow texture for sprites */
  function glowTexture(stops) {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
    for (const [o, col] of stops) g.addColorStop(o, col);
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    return t;
  }
  const GLOW_SUN = glowTexture([[0, 'rgba(255,248,230,1)'], [0.08, 'rgba(255,230,170,0.9)'], [0.22, 'rgba(255,190,90,0.28)'], [0.5, 'rgba(255,150,60,0.07)'], [1, 'rgba(255,120,40,0)']]);
  const GLOW_WHITE = glowTexture([[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,0.55)'], [0.4, 'rgba(255,255,255,0.08)'], [1, 'rgba(255,255,255,0)']]);

  /* ---------------- Milky Way background (photo panorama, galactic coordinates) ---------------- */
  const bgMat = shader({
    uniforms: { map: { value: getTex('textures/milkyway.jpg') }, uBright: { value: 1.25 } },
    vertexShader: `varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position = p.xyww; }`,
    fragmentShader: `uniform sampler2D map; uniform float uBright; varying vec3 vD;
      const mat3 G = mat3(-0.0548755604, 0.4941094279, -0.8676661490, -0.8734370902, -0.4448296300, -0.1980763734, -0.4838350155, 0.7469822445, 0.4559837762);
      void main(){
        vec3 d = normalize(vD); vec3 e = vec3(d.x, -d.z, d.y);
        const float cE = 0.9174820621, sE = 0.3977771559;
        vec3 q = vec3(e.x, e.y*cE - e.z*sE, e.y*sE + e.z*cE);
        vec3 g = G * q;
        float l = atan(g.y, g.x); float b = asin(clamp(g.z, -1.0, 1.0));
        vec2 uv = vec2(fract(0.5 - l / 6.28318530718), 0.5 - b / 3.14159265359);
        vec3 c = texture2D(map, uv).rgb;
        gl_FragColor = vec4(pow(c, vec3(0.92)) * uBright, 1.0);
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false,
  });
  if (bgMat.uniforms.map.value) { bgMat.uniforms.map.value.minFilter = THREE.LinearFilter; bgMat.uniforms.map.value.generateMipmaps = false; }
  const bg = new THREE.Mesh(new THREE.SphereGeometry(10, 64, 32), bgMat);
  bg.renderOrder = -100; bg.frustumCulled = false;
  scene.add(bg);

  /* ---------------- stars (HYG v4.1) ---------------- */
  const STARROWS = window.STARS || [];
  const starCount = STARROWS.length + 1;
  const starPos = new Float32Array(starCount * 3), starCol = new Float32Array(starCount * 3), starMag = new Float32Array(starCount);
  const starEcl = []; // float64 heliocentric ecliptic km for focusing
  const tmpE = [0, 0, 0];
  for (let k = 0; k < STARROWS.length; k++) {
    const s = STARROWS[k];
    E.icrfToEcl(tmpE, s[0], s[1], s[2]);
    const ly = 3.26156;
    starPos[3 * k] = tmpE[0] * ly; starPos[3 * k + 1] = tmpE[2] * ly; starPos[3 * k + 2] = -tmpE[1] * ly;
    starEcl.push([tmpE[0] * E.PC, tmpE[1] * E.PC, tmpE[2] * E.PC]);
    const c = E.starColor(s[4]);
    starCol.set(c, 3 * k);
    starMag[k] = s[3];
  }
  { const k = STARROWS.length; starCol.set(E.starColor(0.656), 3 * k); starMag[k] = 4.83; }
  S.starEcl = starEcl;
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(starCol, 3));
  starGeo.setAttribute('aMag', new THREE.BufferAttribute(starMag, 1));
  const starMat = shader({
    uniforms: { uCam: { value: v3() }, uPR: { value: PR() }, uHide: { value: v3().set(1e9, 1e9, 1e9) } },
    vertexShader: LOGV + `attribute float aMag; attribute vec3 color; uniform vec3 uCam; uniform float uPR; uniform vec3 uHide;
      varying vec3 vC; varying float vA;
      void main(){
        vec3 rel = position - uCam; float dly = length(rel);
        float m = aMag + 5.0 * log(max(dly / 3.26156, 1e-12)) / log(10.0) - 5.0;
        float f = pow(10.0, -0.4 * (m - 6.2));
        float near = smoothstep(0.0006, 0.004, dly);
        vA = clamp(f, 0.0, 1.0) * near;
        if (distance(position, uHide) < 1e-5) vA = 0.0;
        gl_PointSize = clamp(1.6 + 1.1 * log(max(f, 1e-6)) / log(10.0), 1.2, 8.0) * uPR;
        vC = color;
        vec4 mv = viewMatrix * vec4(rel * 9.4607304725808e12, 1.0);
        gl_Position = projectionMatrix * mv;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: LOGF + `varying vec3 vC; varying float vA;
      void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; float a = smoothstep(1.0, 0.15, r) * vA;
        if (a < 0.003) discard; gl_FragColor = vec4(vC * (0.75 + 0.5 * (1.0 - r)), a);
        #include <logdepthbuf_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const starPts = new THREE.Points(starGeo, starMat);
  starPts.frustumCulled = false; starPts.renderOrder = -50;
  scene.add(starPts);

  /* ---------------- asteroid cloud (1.58 million, Kepler solved on the GPU) ---------------- */
  const astMeta = { chunks: [], loaded: 0, total: 0, index: null };
  S.ast = astMeta;
  const CLS_COLORS = [
    [0.55, 0.55, 0.55], [0.66, 0.6, 0.5], [0.7, 0.62, 0.5], [0.62, 0.58, 0.52], [1.0, 0.58, 0.32], [1.0, 0.45, 0.3],
    [0.98, 0.7, 0.4], [1.0, 0.4, 0.3], [0.86, 0.48, 0.38], [0.5, 0.82, 0.55], [0.55, 0.78, 0.95], [0.5, 0.62, 1.0],
    [0.7, 0.7, 0.9], [1.0, 0.5, 0.75]];
  const astUniforms = {
    uDt: { value: 0 }, uCam: { value: v3() }, uLnA0: { value: Math.log(0.1) }, uLnA1: { value: Math.log(5000) },
    uPR: { value: PR() }, uAlpha: { value: 0.5 }, uCls: { value: CLS_COLORS.map((c) => new THREE.Vector3(...c)) },
  };
  const astMat = shader({
    uniforms: astUniforms,
    vertexShader: LOGV + `attribute vec4 aE1; attribute vec3 aE2; attribute float aHC;
      uniform float uDt; uniform vec3 uCam; uniform float uLnA0; uniform float uLnA1; uniform float uPR; uniform vec3 uCls[14];
      varying vec3 vC;
      void main(){
        if (aE1.x <= 0.0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; return; }
        float a = exp(uLnA0 + aE1.x * (uLnA1 - uLnA0));
        float e = aE1.y, inc = aE1.z * PI, O = aE1.w * PI2, w = aE2.x * PI2;
        float n = 0.01720209895 / (a * sqrt(a));
        float M = mod(aE2.y * PI2 + n * uDt, PI2); if (M > PI) M -= PI2;
        float EA = e < 0.8 ? M : (M < 0.0 ? -PI : PI);
        for (int k = 0; k < 10; k++) { EA -= (EA - e * sin(EA) - M) / (1.0 - e * cos(EA)); }
        float x = a * (cos(EA) - e), y = a * sqrt(1.0 - e * e) * sin(EA);
        float cO = cos(O), sO = sin(O), cw = cos(w), sw = sin(w), ci = cos(inc), si = sin(inc);
        vec3 P = vec3(cw*cO - sw*sO*ci, cw*sO + sw*cO*ci, sw*si);
        vec3 Q = vec3(-sw*cO - cw*sO*ci, -sw*sO + cw*cO*ci, cw*si);
        vec3 r = (x * P + y * Q - uCam) * 149597870.7;
        vec4 mv = viewMatrix * vec4(r.x, r.z, -r.y, 1.0);
        gl_Position = projectionMatrix * mv;
        float cls = mod(aHC, 256.0); float Hm = floor(aHC / 256.0) / 8.0 - 2.0;
        vC = uCls[int(cls)];
        gl_PointSize = uPR * (1.0 + clamp((15.0 - Hm) / 7.0, 0.0, 1.6));
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: LOGF + `uniform float uAlpha; varying vec3 vC;
      void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0) discard;
        gl_FragColor = vec4(vC, uAlpha * (1.0 - r * r));
        #include <logdepthbuf_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const astGroup = new THREE.Group();
  scene.add(astGroup);
  S.loadAsteroids = async function (onProgress) {
    if (fileMode) return;
    try {
      const idx = await (await fetch('data/asteroids/index.json')).json();
      astMeta.index = idx; astMeta.total = idx.total;
      for (const ch of idx.chunks) {
        const buf = await E.fetchBinary('data/asteroids/' + ch.file);
        const count = new DataView(buf).getUint32(4, true);
        const recs = new Uint16Array(buf, 16, count * 8);
        const desig = ch.kind === 'provisional' ? new Uint32Array(buf, 16 + count * 16, count) : null;
        const ib = new THREE.InterleavedBuffer(recs, 8);
        const g = new THREE.BufferGeometry();
        g.setAttribute('aE1', new THREE.InterleavedBufferAttribute(ib, 4, 0, true));
        g.setAttribute('aE2', new THREE.InterleavedBufferAttribute(ib, 3, 4, true));
        g.setAttribute('aHC', new THREE.InterleavedBufferAttribute(ib, 1, 7, false));
        g.setAttribute('position', new THREE.InterleavedBufferAttribute(ib, 3, 0, true));
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e30);
        const pts = new THREE.Points(g, astMat);
        pts.frustumCulled = false; pts.renderOrder = -20;
        astGroup.add(pts);
        astMeta.chunks.push({ meta: ch, recs, desig, count });
        astMeta.loaded += count;
        if (onProgress) onProgress(astMeta.loaded, astMeta.total);
      }
    } catch (err) {
      console.warn('asteroid catalogue failed to load', err);
    }
  };

  /* ---------------- comets (all 4,000+ known, CPU propagated) ---------------- */
  const cometRows = window.CATALOG.comets || [];
  const cometOrbs = cometRows.map((r) => E.cometOrbit(r[1], r[2], r[3], r[4], r[5], r[6]));
  const cometHelio = new Float64Array(cometRows.length * 3);
  const cometPos = new Float32Array(cometRows.length * 3);
  const cometGeo = new THREE.BufferGeometry();
  cometGeo.setAttribute('position', new THREE.BufferAttribute(cometPos, 3));
  const cometMat = shader({
    uniforms: { uPR: { value: PR() } },
    vertexShader: LOGV + `uniform float uPR; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = 2.4 * uPR;
      #include <logdepthbuf_vertex>
    }`,
    fragmentShader: LOGF + `void main(){ float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0) discard; gl_FragColor = vec4(0.53, 0.86, 0.92, 0.75 * (1.0 - r));
      #include <logdepthbuf_fragment>
    }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const cometPts = new THREE.Points(cometGeo, cometMat);
  cometPts.frustumCulled = false;
  scene.add(cometPts);
  S.cometRows = cometRows; S.cometOrbs = cometOrbs; S.cometHelio = cometHelio;
  let cometFrame = 0;
  const tmpC = [0, 0, 0];
  function updateComets() {
    const jd = E.tdb(state.jd);
    // propagate every other frame; positions change slowly
    if ((cometFrame++ & 1) === 0) {
      for (let k = 0; k < cometOrbs.length; k++) {
        E.orbitRel(cometOrbs[k], jd, tmpC);
        cometHelio[3 * k] = tmpC[0]; cometHelio[3 * k + 1] = tmpC[1]; cometHelio[3 * k + 2] = tmpC[2];
      }
    }
    const c = cam.pos;
    for (let k = 0; k < cometOrbs.length; k++) {
      const x = cometHelio[3 * k] - c[0], y = cometHelio[3 * k + 1] - c[1], z = cometHelio[3 * k + 2] - c[2];
      cometPos[3 * k] = x; cometPos[3 * k + 1] = z; cometPos[3 * k + 2] = -y;
    }
    cometGeo.attributes.position.needsUpdate = true;
  }

  /* ---------------- body materials ---------------- */
  const SURF_V = LOGV + `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vUv = uv; vN = normalize(normalMatrix * normal); vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz;
      gl_Position = projectionMatrix * mv;
      #include <logdepthbuf_vertex>
    }`;
  const SURF_F = LOGF + `uniform sampler2D map; uniform sampler2D nightMap; uniform float uHasMap; uniform float uNight;
    uniform vec3 uColor; uniform vec3 uSun; uniform float uLL; uniform float uAmb; uniform float uOpacity;
    varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){
      vec3 N = normalize(vN); vec3 L = normalize(uSun); vec3 Vv = normalize(vV);
      if (!gl_FrontFacing) N = -N;
      float mu0 = max(dot(N, L), 0.0), mu = max(dot(N, Vv), 0.0);
      float diff = mix(mu0, 2.0 * mu0 / (mu0 + mu + 1e-4), uLL);
      vec3 base = uColor;
      if (uHasMap > 0.5) base *= texture2D(map, vUv).rgb;
      vec3 col = base * (diff * 1.08 + uAmb);
      if (uNight > 0.0) { float dark = smoothstep(0.08, -0.12, dot(N, L)); col += texture2D(nightMap, vUv).rgb * dark * uNight; }
      gl_FragColor = vec4(col, uOpacity);
      #include <logdepthbuf_fragment>
    }`;
  function surfaceMaterial(opts) {
    const m = shader({
      uniforms: {
        map: { value: opts.map || null }, uHasMap: { value: opts.map ? 1 : 0 }, nightMap: { value: opts.night || null },
        uNight: { value: opts.night ? 1.1 : 0 }, uColor: { value: new THREE.Color(opts.color || '#ffffff') },
        uSun: { value: v3().set(1, 0, 0) }, uLL: { value: opts.ll || 0 }, uAmb: { value: opts.amb ?? 0.035 },
        uOpacity: { value: opts.opacity ?? 1 },
      },
      vertexShader: SURF_V, fragmentShader: SURF_F,
      transparent: (opts.opacity ?? 1) < 1, side: opts.side || THREE.FrontSide,
    });
    return m;
  }
  const ATM_F = LOGF + `uniform vec3 uColor; uniform vec3 uSun; uniform float uK; varying vec3 vN; varying vec3 vV; varying vec2 vUv;
    void main(){ vec3 N = normalize(vN); vec3 Vv = normalize(vV); vec3 L = normalize(uSun);
      float rim = pow(1.0 - max(dot(N, Vv), 0.0), 3.0);
      float lit = clamp(dot(N, L) * 0.9 + 0.35, 0.0, 1.0);
      gl_FragColor = vec4(uColor * rim * lit * uK, 1.0);
      #include <logdepthbuf_fragment>
    }`;
  const CLOUD_F = LOGF + `uniform sampler2D map; uniform vec3 uSun; uniform float uMode; uniform float uOp; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
    void main(){ vec3 N = normalize(vN); vec3 L = normalize(uSun);
      vec3 t = texture2D(map, vUv).rgb;
      float a = uMode < 0.5 ? t.r : uOp;
      vec3 c = uMode < 0.5 ? vec3(1.0) : t;
      float lit = max(dot(N, L), 0.0) * 1.05 + 0.02;
      gl_FragColor = vec4(c * lit, a);
      #include <logdepthbuf_fragment>
    }`;
  const RING_V = LOGV + `varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv;
      #include <logdepthbuf_vertex>
    }`;
  const RING_F = LOGF + `uniform sampler2D map; uniform float uHasMap; uniform vec3 uSunL; uniform float uOp; uniform vec3 uColor; varying vec2 vUv; varying vec3 vP;
    void main(){
      vec4 t = uHasMap > 0.5 ? texture2D(map, vec2(vUv.x, 0.5)) : vec4(uColor, 0.55);
      float lit = 0.22 + 0.78 * sqrt(abs(uSunL.y));
      float along = dot(vP, uSunL);
      vec3 perp = vP - along * uSunL;
      if (along < 0.0 && length(perp) < 1.0) lit *= 0.08;
      gl_FragColor = vec4(t.rgb * lit, t.a * uOp);
      #include <logdepthbuf_fragment>
    }`;
  const LINE_V = LOGV + `attribute float aT; uniform float uNow; uniform float uLen; uniform float uHyp; uniform float uOA; uniform float uTA;
    varying float vA;
    void main(){
      float d = uHyp > 0.5 ? (uNow - aT) : fract(uNow - aT + 1.0);
      float tr = (d >= 0.0 && d < uLen) ? pow(1.0 - d / uLen, 1.6) : 0.0;
      vA = max(uOA, uTA * tr);
      vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      #include <logdepthbuf_vertex>
    }`;
  const LINE_F = LOGF + `uniform vec3 uColor; varying float vA; void main(){ if (vA < 0.004) discard; gl_FragColor = vec4(uColor, vA);
      #include <logdepthbuf_fragment>
    }`;

  const KIND_COLOR = {
    star: '#ffd98a', planet: '#efe7d6', dwarf: '#d8b98f', moon: '#a9b8d0', asteroid: '#b3a48c', comet: '#86d8e6',
    interstellar: '#f59ab8', station: '#9be5a8', spacecraft: '#c9e69b', historic: '#e5927a', blackhole: '#b99dff',
  };
  S.KIND_COLOR = KIND_COLOR;
  const sphereHi = new THREE.SphereGeometry(1, 128, 64);
  const sphereMid = new THREE.SphereGeometry(1, 64, 32);

  function hash(str) { let h = 2166136261; for (let k = 0; k < str.length; k++) { h ^= str.charCodeAt(k); h = Math.imul(h, 16777619); } return h >>> 0; }
  function irregularGeometry(seed, amp) {
    const g = new THREE.SphereGeometry(1, 72, 36);
    let s = seed || 1;
    const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const lumps = [];
    for (let k = 0; k < 14; k++) {
      const z = rnd() * 2 - 1, t = rnd() * Math.PI * 2, rr = Math.sqrt(1 - z * z);
      lumps.push([rr * Math.cos(t), z, rr * Math.sin(t), (rnd() - 0.45) * amp, 2 + rnd() * 10]);
    }
    const st = [0.9 + rnd() * 0.35, 0.72 + rnd() * 0.2, 0.62 + rnd() * 0.2];
    const p = g.attributes.position;
    for (let k = 0; k < p.count; k++) {
      let x = p.getX(k), y = p.getY(k), z = p.getZ(k);
      let d = 1;
      for (const L of lumps) { const c = x * L[0] + y * L[1] + z * L[2]; if (c > 0) d += L[3] * Math.pow(c, L[4]); }
      p.setXYZ(k, x * d * st[0], y * d * st[1], z * d * st[2]);
    }
    g.computeVertexNormals();
    // weld normals across the UV seam and poles so the surface shades smoothly
    const nrm = g.attributes.normal, acc = new Map();
    const key = (k) => `${Math.round(p.getX(k) * 1e4)},${Math.round(p.getY(k) * 1e4)},${Math.round(p.getZ(k) * 1e4)}`;
    for (let k = 0; k < p.count; k++) {
      const kk = key(k); const a = acc.get(kk) || [0, 0, 0];
      a[0] += nrm.getX(k); a[1] += nrm.getY(k); a[2] += nrm.getZ(k); acc.set(kk, a);
    }
    for (let k = 0; k < p.count; k++) {
      const a = acc.get(key(k)); const l = Math.hypot(a[0], a[1], a[2]) || 1;
      nrm.setXYZ(k, a[0] / l, a[1] / l, a[2] / l);
    }
    g.computeBoundingSphere();
    const r = g.boundingSphere.radius;
    g.scale(1 / r, 1 / r, 1 / r);
    return g;
  }

  /* ---------------- per-body visuals ---------------- */
  const LL_KINDS = new Set(['moon', 'asteroid', 'dwarf', 'comet', 'interstellar', 'historic']);
  function tintFor(b) {
    const d = b.d;
    if (d.texGeneric && d.col) {
      const c = new THREE.Color(d.col);
      const mx = Math.max(c.r, c.g, c.b) || 1;
      return new THREE.Color(0.5 + 0.5 * c.r / mx, 0.5 + 0.5 * c.g / mx, 0.5 + 0.5 * c.b / mx).multiplyScalar(0.85);
    }
    if (d.texGeneric) return new THREE.Color(0.78, 0.76, 0.74);
    return new THREE.Color('#ffffff');
  }

  function buildVisual(b) {
    const node = new THREE.Group();
    node.matrixAutoUpdate = true;
    const vis = { node, mats: [], ring: null, glow: null, rot: new THREE.Group() };
    node.add(vis.rot);
    const d = b.d;
    if (b.kind === 'star') {
      const tex = bodyTex(d.tex || 'star-g');
      const m = new THREE.Mesh(sphereHi, new THREE.MeshBasicMaterial({ map: tex, color: d.tint ? new THREE.Color(...d.tint) : 0xffffff }));
      m.scale.setScalar(b.r);
      vis.rot.add(m);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: b.id === 'sun' ? GLOW_SUN : GLOW_WHITE, color: d.tint ? new THREE.Color(...d.tint) : 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sp.renderOrder = 5;
      node.add(sp); vis.glow = sp;
    } else if (b.kind === 'blackhole') {
      const hole = new THREE.Mesh(sphereMid, new THREE.MeshBasicMaterial({ color: 0x000000 }));
      hole.scale.setScalar(b.r);
      vis.rot.add(hole);
      const disk = new THREE.Mesh(ringGeometry(3, 16, 256), shader({
        uniforms: {},
        vertexShader: RING_V,
        fragmentShader: LOGF + `varying vec2 vUv; varying vec3 vP; void main(){ float t = vUv.x; float ang = atan(vP.z, vP.x);
          float beam = 0.35 + 0.65 * (0.5 + 0.5 * sin(ang));
          vec3 hot = mix(vec3(1.0, 0.93, 0.8), vec3(0.95, 0.38, 0.1), smoothstep(0.0, 0.7, t));
          float a = pow(1.0 - t, 1.6) * smoothstep(0.0, 0.04, t);
          gl_FragColor = vec4(hot * beam * 1.5, a);
          #include <logdepthbuf_fragment>
        }`,
        transparent: true, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending,
      }));
      disk.scale.setScalar(b.r);
      disk.rotation.x = 0.22;
      vis.rot.add(disk);
      const ringMat = new THREE.SpriteMaterial({ map: glowTexture([[0, 'rgba(255,220,170,0)'], [0.36, 'rgba(255,220,170,0)'], [0.42, 'rgba(255,225,180,0.95)'], [0.5, 'rgba(255,170,90,0.25)'], [0.7, 'rgba(255,140,60,0)'], [1, 'rgba(0,0,0,0)']]),
        blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
      const photon = new THREE.Sprite(ringMat); photon.scale.setScalar(b.r * 6.2);
      node.add(photon);
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW_WHITE, color: 0xffb070, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      node.add(sp); vis.glow = sp;
    } else {
      const ll = LL_KINDS.has(b.kind) && b.id !== 'pluto' ? 0.65 : 0;
      const tex = bodyTex(d.tex);
      const night = d.night ? bodyTex(d.night) : null;
      const mat = surfaceMaterial({ map: tex, night, ll, color: tex ? tintFor(b) : (d.col || KIND_COLOR[b.kind]), amb: 0.035 });
      vis.mats.push(mat);
      const modelName = d.model;
      if (modelName) {
        const holder = new THREE.Group();
        vis.rot.add(holder);
        holder.scale.setScalar(b.bound);
        loadModel(modelName).then(({ geometry, materials }) => {
          let mats;
          if (materials.length > 1 || (materials[0] && materials[0].texture && materials[0].texture.includes('/'))) {
            mats = materials.map((mm) => {
              const t = mm.texture ? getTex(`models/${mm.texture}`) : null;
              const m2 = surfaceMaterial({ map: t, color: new THREE.Color(...mm.diffuse), amb: 0.12, opacity: mm.opacity, side: THREE.DoubleSide });
              vis.mats.push(m2);
              return m2;
            });
          } else {
            mats = mat;
          }
          const mesh = new THREE.Mesh(geometry, mats);
          holder.add(mesh);
        }).catch(() => {
          const mesh = new THREE.Mesh(sphereMid, mat);
          holder.add(mesh);
        });
      } else {
        let geo = b.r > 300 || b.kind === 'planet' || b.kind === 'dwarf' ? sphereHi : sphereMid;
        let sx = b.r, sy = b.rp || b.r, sz = b.r;
        if (d.ax) { sx = d.ax[0]; sy = d.ax[2]; sz = d.ax[1]; }
        if (b.r < 160 && !d.ax && b.kind !== 'planet' && b.kind !== 'dwarf' && b.kind !== 'station' && b.kind !== 'spacecraft') {
          geo = irregularGeometry(hash(b.id), b.r < 30 ? 0.55 : 0.3);
        }
        if (b.kind === 'station' || b.kind === 'spacecraft') geo = new THREE.BoxGeometry(1.6, 0.5, 1.0);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.scale.set(sx, sy, sz);
        vis.rot.add(mesh);
        vis.surface = mesh;
      }
      if (d.clouds) {
        const cm = shader({ uniforms: { map: { value: bodyTex(d.clouds) }, uSun: { value: v3() }, uMode: { value: 0 }, uOp: { value: 1 } },
          vertexShader: SURF_V, fragmentShader: CLOUD_F, transparent: true, depthWrite: false });
        const cl = new THREE.Mesh(sphereHi, cm); cl.scale.set(b.r * 1.006, b.rp * 1.006, b.r * 1.006);
        vis.rot.add(cl); vis.mats.push(cm);
      }
      if (d.haze) {
        const cm = shader({ uniforms: { map: { value: bodyTex(d.haze) }, uSun: { value: v3() }, uMode: { value: 1 }, uOp: { value: 0.72 } },
          vertexShader: SURF_V, fragmentShader: CLOUD_F, transparent: true, depthWrite: false });
        const cl = new THREE.Mesh(sphereHi, cm); cl.scale.setScalar(b.r * 1.02);
        vis.rot.add(cl); vis.mats.push(cm);
      }
      if (d.atm) {
        const am = shader({ uniforms: { uColor: { value: new THREE.Color(d.atm) }, uSun: { value: v3() }, uK: { value: b.kind === 'planet' ? 1.25 : 0.8 } },
          vertexShader: SURF_V, fragmentShader: ATM_F, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
        const at = new THREE.Mesh(sphereHi, am); at.scale.set(b.r * 1.015, b.rp * 1.015, b.r * 1.015);
        vis.rot.add(at); vis.mats.push(am);
      }
      if (d.ring) {
        const R = d.ring;
        const rm = shader({
          uniforms: { map: { value: R.tex ? getTex(`textures/${R.tex}.png`) : null }, uHasMap: { value: R.tex ? 1 : 0 }, uSunL: { value: v3() }, uOp: { value: R.op || 1 }, uColor: { value: new THREE.Color('#c9c0b0') } },
          vertexShader: RING_V, fragmentShader: RING_F, transparent: true, side: THREE.DoubleSide, depthWrite: false,
        });
        const ring = new THREE.Mesh(ringGeometry(R.in / b.r, R.out / b.r, 256), rm);
        ring.scale.setScalar(b.r);
        vis.rot.add(ring); vis.ring = rm;
      }
      if (b.id === 'sun') { /* handled above */ }
    }
    scene.add(node);
    b.vis = vis;
    return vis;
  }

  function ringGeometry(inner, outer, segs) {
    const pos = [], uv = [], idx = [];
    for (let k = 0; k <= segs; k++) {
      const a = (k / segs) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      pos.push(inner * c, 0, inner * s, outer * c, 0, outer * s);
      uv.push(0, k / segs, 1, k / segs);
      if (k < segs) { const i = 2 * k; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  }

  /* ---------------- orbit lines & trails ---------------- */
  function trailFraction(b) {
    if (b.kind === 'planet' || b.kind === 'dwarf') return 0.13;
    if (b.kind === 'station' || b.kind === 'spacecraft') return b.parent && b.parent.id === 'earth' ? 0.33 : 0.15;
    if (b.kind === 'comet' || b.kind === 'interstellar') return 0.06;
    return 0.22;
  }
  function buildOrbitLine(b, oIn, jd) {
    const o = E.tabKep(oIn, jd);
    const pts = [], ts = [];
    const tmp = [0, 0, 0];
    let hyp = 0;
    if (o.t === 'hyp') {
      hyp = 1;
      const aa = o.q / (o.e - 1);
      const n = Math.sqrt(o.mu / (aa * aa * aa)) * 86400; // rad/day
      const rmax = Math.max(o.q * 30, 60 * AU);
      const Hmax = Math.acosh(Math.min(1e6, (rmax / aa + 1) / o.e));
      const N = 600;
      for (let k = 0; k <= N; k++) {
        const Hh = -Hmax + (2 * Hmax * k) / N;
        const t = (o.e * Math.sinh(Hh) - Hh) / n;
        E.orbitRel(o, o.tp + t, tmp);
        pts.push(tmp[0], tmp[1], tmp[2]); ts.push(t);
      }
    } else {
      const N = (o.e || (o.t === 'std' ? o.el[1] : 0)) > 0.6 ? 900 : 512;
      const P = E.orbitPeriod(o);
      for (let k = 0; k <= N; k++) {
        // sample uniformly in eccentric anomaly via the mean anomaly it implies
        const EA = (k / N) * 2 * Math.PI;
        const e = o.t === 'std' ? o.el[1] + o.el[7] * ((jd - E.J2000) / 36525) : (o.t === 'tl' ? o.ph[o.ph.length - 1].o.e : o.e);
        const M = EA - e * Math.sin(EA);
        const frac = M / (2 * Math.PI);
        // time at which mean anomaly equals M, nearest to jd
        const curM = currentMeanFraction(o, jd);
        let dtf = frac - curM; dtf -= Math.round(dtf);
        E.orbitRel(o, jd + dtf * P, tmp);
        pts.push(tmp[0], tmp[1], tmp[2]); ts.push(((frac % 1) + 1) % 1);
      }
    }
    const f64 = new Float64Array(pts);
    const f32 = new Float32Array(pts.length);
    for (let k = 0; k < pts.length; k += 3) { f32[k] = pts[k]; f32[k + 1] = pts[k + 2]; f32[k + 2] = -pts[k + 1]; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(f32, 3));
    g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(ts), 1));
    const col = new THREE.Color(KIND_COLOR[b.kind] || '#ffffff');
    const m = shader({
      uniforms: { uColor: { value: col }, uNow: { value: 0 }, uLen: { value: trailFraction(b) }, uHyp: { value: hyp }, uOA: { value: 0.2 }, uTA: { value: 0.9 } },
      vertexShader: LINE_V, fragmentShader: LINE_F, transparent: true, depthWrite: false,
    });
    const line = new THREE.Line(g, m);
    line.frustumCulled = false; line.renderOrder = 2;
    scene.add(line);
    return { line, mat: m, f64, f32, hyp, builtJd: jd, orb: oIn, kep: o };
  }
  function currentMeanFraction(o, jd) {
    if (o.t === 'tab') o = E.tabKep(o, jd);
    if (o.t === 'kep') { const M = E.meanAnomalyDeg(o, jd); return (((M / 360) % 1) + 1) % 1; }
    if (o.t === 'std') { const el = o.el, T = (jd - E.J2000) / 36525; const M = (el[3] + el[9] * T) - (el[4] + el[10] * T); return (((M / 360) % 1) + 1) % 1; }
    if (o.t === 'tl') return currentMeanFraction(o.ph[o.ph.length - 1].o, jd);
    return 0;
  }

  /* near-trail: exact, time-sampled trail used when the camera is close to the focused body */
  const nearTrail = (() => {
    const N = 400;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
    g.setAttribute('aT', new THREE.BufferAttribute(new Float32Array(N), 1));
    const m = shader({
      uniforms: { uColor: { value: new THREE.Color('#ffffff') }, uNow: { value: 0 }, uLen: { value: 1 }, uHyp: { value: 1 }, uOA: { value: 0 }, uTA: { value: 0.9 } },
      vertexShader: LINE_V, fragmentShader: LINE_F, transparent: true, depthWrite: false,
    });
    const line = new THREE.Line(g, m);
    line.frustumCulled = false; line.visible = false; line.renderOrder = 3;
    scene.add(line);
    return { line, g, m, N };
  })();
  const ntA = [0, 0, 0], ntB = [0, 0, 0];
  function updateNearTrail(b, jd) {
    const o = b._orbUsed;
    if (!o || !b.parent || o.t === 'fix' || o.t === 'radec' || o.t === 'origin') { nearTrail.line.visible = false; return; }
    const P = E.orbitPeriod(o);
    const span = isFinite(P) && P > 0 ? P * trailFraction(b) : 500;
    const pos = nearTrail.g.attributes.position.array, at = nearTrail.g.attributes.aT.array;
    E.orbitRel(o, jd, ntA);
    for (let k = 0; k < nearTrail.N; k++) {
      const f = k / (nearTrail.N - 1);
      const t = jd - span * f * f;
      E.orbitRel(o, t, ntB);
      const x = ntB[0] - ntA[0], y = ntB[1] - ntA[1], z = ntB[2] - ntA[2];
      pos[3 * k] = x; pos[3 * k + 1] = z; pos[3 * k + 2] = -y;
      at[k] = f * f;
    }
    nearTrail.g.attributes.position.needsUpdate = true; nearTrail.g.attributes.aT.needsUpdate = true;
    nearTrail.m.uniforms.uNow.value = 0; nearTrail.m.uniforms.uLen.value = 1;
    nearTrail.m.uniforms.uColor.value.set(KIND_COLOR[b.kind] || '#fff');
    nearTrail.m.uniforms.uTA.value = state.layers.trails || state.layers.orbits ? 0.9 : 0;
    // uHyp mode with uNow=0: d = -aT, so flip sign via uniform trick
    nearTrail.m.uniforms.uNow.value = 0;
    for (let k = 0; k < nearTrail.N; k++) at[k] = -at[k];
    V.sub(ntB, b.pos, cam.pos);
    toT(ntB, nearTrail.line.position);
    nearTrail.line.visible = true;
  }


  /* ---------------- comet tails (anti-sunward, grow as the comet nears the Sun) ---------------- */
  const tailGeo = (() => {
    const g = new THREE.BufferGeometry();
    const N = 24, pos = [], uv = [], idx = [];
    for (let k = 0; k <= N; k++) {
      const t = k / N, w = 0.25 + 0.75 * Math.sqrt(t);
      pos.push(t, -w, 0, t, w, 0); uv.push(t, 0, t, 1);
      if (k < N) { const i = 2 * k; idx.push(i, i + 1, i + 2, i + 1, i + 3, i + 2); }
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
  })();
  const tailMat = shader({
    uniforms: { uA: { value: 1 } },
    vertexShader: LOGV + `varying vec2 vUv; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv;
      #include <logdepthbuf_vertex>
    }`,
    fragmentShader: LOGF + `uniform float uA; varying vec2 vUv;
      void main(){ float across = 1.0 - pow(abs(vUv.y - 0.5) * 2.0, 1.6); float along = pow(1.0 - vUv.x, 1.8) * smoothstep(0.0, 0.03, vUv.x + 0.01);
        vec3 c = mix(vec3(0.85, 0.95, 1.0), vec3(0.55, 0.8, 1.0), vUv.x);
        gl_FragColor = vec4(c, across * along * uA * 0.55);
        #include <logdepthbuf_fragment>
      }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  });
  const tails = (S._tails = new Map());
  const tA = v3(), tB = v3(), tC = v3();
  function updateTail(b, rel) {
    let t = tails.get(b);
    const rAU = V.len(b.pos) / AU;
    const active = b.present && (b.kind === 'comet' || b.id === '2i-borisov' || b.id === '3i-atlas') && rAU < 4.5;
    if (!active) { if (t) t.visible = false; return; }
    if (!t) { t = new THREE.Mesh(tailGeo, tailMat.clone()); t.frustumCulled = false; t.renderOrder = 4; scene.add(t); tails.set(b, t); }
    const L = Math.min(9e7, 2.2e7 / (rAU * rAU)), Wd = L * 0.07;
    const dist = V.len(rel);
    const k = dist > FAR_SCALE ? (FAR_SCALE * (1 + Math.log(dist / FAR_SCALE))) / dist : 1;
    toT(rel, t.position).multiplyScalar(k);
    // axis: away from the Sun; the ribbon turns about that axis to face the camera
    tA.set(b.pos[0], b.pos[2], -b.pos[1]).normalize();
    tB.copy(t.position).normalize();
    tC.crossVectors(tA, tB); if (tC.lengthSq() < 1e-12) tC.set(0, 1, 0); tC.normalize();
    const nrm = tB.crossVectors(tA, tC).normalize();
    tmat.makeBasis(tA, tC, nrm);
    t.quaternion.setFromRotationMatrix(tmat);
    t.scale.set(L * k, Wd * k, 1);
    t.material.uniforms.uA.value = Math.min(1, 1.6 / rAU);
    t.visible = state.layers.comets || cam.focus === b;
  }

  /* ---------------- markers (one dot per body) ---------------- */
  const MAXM = 4096;
  const mPos = new Float32Array(MAXM * 3), mCol = new Float32Array(MAXM * 3), mSize = new Float32Array(MAXM), mAlpha = new Float32Array(MAXM);
  const markerGeo = new THREE.BufferGeometry();
  markerGeo.setAttribute('position', new THREE.BufferAttribute(mPos, 3));
  markerGeo.setAttribute('color', new THREE.BufferAttribute(mCol, 3));
  markerGeo.setAttribute('aSize', new THREE.BufferAttribute(mSize, 1));
  markerGeo.setAttribute('aAlpha', new THREE.BufferAttribute(mAlpha, 1));
  const markerMat = shader({
    uniforms: { uPR: { value: PR() } },
    vertexShader: LOGV + `attribute vec3 color; attribute float aSize; attribute float aAlpha; uniform float uPR; varying vec3 vC; varying float vA;
      void main(){ vC = color; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uPR;
        #include <logdepthbuf_vertex>
      }`,
    fragmentShader: LOGF + `varying vec3 vC; varying float vA; void main(){ if (vA < 0.01) discard; float r = length(gl_PointCoord - 0.5) * 2.0; if (r > 1.0) discard;
        float core = smoothstep(1.0, 0.7, r); float edge = smoothstep(0.55, 0.75, r);
        gl_FragColor = vec4(mix(vC, vC * 0.25, edge), core * vA);
        #include <logdepthbuf_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
  const markers = new THREE.Points(markerGeo, markerMat);
  markers.frustumCulled = false; markers.renderOrder = 10;
  scene.add(markers);
  const MARK_SIZE = { star: 9, planet: 7, dwarf: 6, moon: 4.5, asteroid: 4.5, comet: 5, interstellar: 6, station: 5, spacecraft: 4.5, historic: 4.5, blackhole: 7 };

  /* ---------------- per-frame update ---------------- */
  const tv = v3(), tq = new THREE.Quaternion(), tmat = new THREE.Matrix4(), tx = v3(), ty = v3(), tz = v3();
  const rel = [0, 0, 0], sunDir = [0, 0, 0], tmpV = [0, 0, 0], tmpW = [0, 0, 0];
  const screen = (S.screen = new Map()); // body -> {x, y, px, depth}
  const FAR_SCALE = 1e9; // km
  const viewRot = new THREE.Matrix3();

  function project(relVec, out) {
    // relVec ecliptic relative to camera -> screen px; returns false if behind
    tv.set(relVec[0], relVec[2], -relVec[1]).applyMatrix4(camera.matrixWorldInverse);
    if (tv.z >= 0) return false;
    const z = -tv.z;
    out.x = W / 2 + (tv.x / z) * pxPerRad;
    out.y = H / 2 - (tv.y / z) * pxPerRad;
    out.z = z;
    return true;
  }
  S.project = project;

  function isFocusSystem(b) {
    const f = cam.focus;
    if (!f) return false;
    if (b === f || b.parent === f || f.parent === b) return true;
    if (b.parent && f.parent === b.parent) return true;
    return false;
  }

  function orbitWanted(b, parentPx) {
    if (!b.present || !b.parent) return 0;
    const L = state.layers;
    if (!L.orbits && !L.trails) return 0;
    const o = b._orbUsed;
    if (!o || o.t === 'fix' || o.t === 'radec' || o.t === 'origin' || o.t === 'pos') return 0;
    const f = cam.focus;
    const pxSize = (b.size / Math.max(1e-9, parentPx.dist)) * pxPerRad;
    if (pxSize < 6) return 0;
    if (pxSize > 5 * H && b !== f && b.parent !== (f && f.parent)) return 0; // camera deep inside: the orbit is just stray lines
    if (b.kind === 'moon' && b.d.rEst && b !== f && pxSize > 2.2 * H) return 0;
    if (b.kind === 'planet' || (b.kind === 'dwarf' && !b.d.cand)) return 1;
    if (b === f) return 1;
    if (b.parent === f && f.id !== 'sun') return 1;
    if (f && f.parent === b.parent && b.parent && b.parent.id !== 'sun') return 1;
    if (b.kind === 'moon') return pxSize > 40 ? 1 : 0;
    if (b.kind === 'station') return (f && (f.id === 'earth' || f.parent === b.parent)) || pxSize > 60 ? 1 : 0;
    if (b.kind === 'historic') return f && (f.id === 'jupiter' || f.d.grp === 'sl9') ? 1 : 0;
    if (b.kind === 'dwarf') return f && f.kind === 'dwarf' ? 1 : 0;
    return 0;
  }

  let frameNo = 0;
  S.frame = function () {
    frameNo++;
    const jd = E.tdb(state.jd);
    E.updateAll(jd);

    /* --- camera --- */
    const tr = cam.tr;
    const fpos = [0, 0, 0];
    if (tr) {
      tr.t += tr.dtLast;
      const s0 = Math.min(1, tr.t / tr.dur);
      const s = s0 < 0.5 ? 4 * s0 * s0 * s0 : 1 - Math.pow(-2 * s0 + 2, 3) / 2;
      const A = tr.from && tr.from.present ? tr.from.pos : tr.fromPoint;
      const B = tr.to.pos;
      V.lerp(fpos, A, B, s);
      const sep = V.dist(A, B);
      const l0 = Math.log(tr.d0), l1 = Math.log(tr.d1);
      const mid = Math.log(Math.max(sep * 0.65, 1e-9));
      const bump = Math.max(0, mid - (l0 + l1) / 2);
      cam.dist = Math.exp(l0 + (l1 - l0) * s + 4 * s * (1 - s) * bump);
      let dy = tr.y1 - tr.y0; dy -= Math.round(dy / (2 * Math.PI)) * 2 * Math.PI;
      cam.yaw = tr.y0 + dy * s; cam.pitch = tr.p0 + (tr.p1 - tr.p0) * s;
      if (s0 >= 1) cam.tr = null;
    } else if (cam.focus) {
      V.copy(fpos, cam.focus.pos);
    }
    dirFrom(cam.yaw, cam.pitch, fwd);
    V.addScaled(cam.pos, fpos, fwd, cam.dist);
    // camera orientation: look from cam.pos to focus (three coords)
    camera.position.set(0, 0, 0);
    camera.up.set(0, 1, 0);
    camera.lookAt(-fwd[0], -fwd[2], fwd[1]);
    camera.updateMatrixWorld();
    viewRot.setFromMatrix4(camera.matrixWorldInverse);

    /* --- layers --- */
    const L = state.layers;
    starPts.visible = L.stars; astGroup.visible = L.asteroids; cometPts.visible = L.comets;
    starMat.uniforms.uCam.value.set(cam.pos[0] / LY, cam.pos[2] / LY, -cam.pos[1] / LY);
    if (cam.focus && cam.focus.starIndex !== undefined) { const k = cam.focus.starIndex; starMat.uniforms.uHide.value.set(starPos[3 * k], starPos[3 * k + 1], starPos[3 * k + 2]); }
    else starMat.uniforms.uHide.value.set(1e9, 1e9, 1e9);
    astUniforms.uDt.value = jd - 2461200.5;
    astUniforms.uCam.value.set(cam.pos[0] / AU, cam.pos[1] / AU, cam.pos[2] / AU);
    const camSun = V.len(cam.pos);
    astUniforms.uAlpha.value = camSun > 2e4 * AU ? 0 : 0.42;
    if (L.comets) updateComets();

    /* --- bodies --- */
    let mi = 0;
    const sun = E.sun();
    screen.clear();
    const sp = { x: 0, y: 0, z: 0 };
    for (const b of E.bodies) {
      const vis = b.vis;
      if (!b.present || (b.kind === 'blackhole' && !L.bh)) {
        if (vis) vis.node.visible = false;
        if (tails.has(b)) tails.get(b).visible = false;
        if (b.orbitLine) b.orbitLine.line.visible = false;
        continue;
      }
      V.sub(rel, b.pos, cam.pos);
      const dist = V.len(rel);
      const ratio = b.bound / Math.max(dist, 1e-9);
      const pxR = (ratio < 0.2 ? ratio : Math.tan(Math.asin(Math.min(0.9999, ratio)))) * pxPerRad;
      const onScreen = project(rel, sp);
      if (onScreen) screen.set(b, { x: sp.x, y: sp.y, px: pxR, dist });

      // mesh
      const wreck = b.d.post && b._orbUsed === b.d.post; // re-entered: only a site marker remains
      const wantMesh = !wreck && (pxR > 0.6 || b === cam.focus);
      if (wantMesh && !vis) buildVisual(b);
      if (b.vis) {
        const vv = b.vis;
        vv.node.visible = wantMesh || ((b.kind === 'star' || b.kind === 'blackhole') && !wreck);
        toT(rel, vv.node.position);
        // Far objects are drawn proportionally nearer and smaller: identical angular size and direction,
        // but small enough numbers for float32 GPUs.
        const k = dist > FAR_SCALE ? (FAR_SCALE * (1 + Math.log(dist / FAR_SCALE))) / dist : 1;
        vv.node.position.multiplyScalar(k);
        vv.node.scale.setScalar(k);
        if (vv.node.visible) {
          // orientation from prime meridian & pole
          toT(b.m, tx); toT(b.pl, ty); tz.crossVectors(tx, ty);
          tmat.makeBasis(tx, ty, tz);
          vv.rot.quaternion.setFromRotationMatrix(tmat);
          // sun direction in view space
          if (b !== sun) {
            V.sub(sunDir, sun.pos, b.pos); V.norm(sunDir, sunDir);
            tv.set(sunDir[0], sunDir[2], -sunDir[1]).applyMatrix3(viewRot);
            for (const m of vv.mats) if (m.uniforms && m.uniforms.uSun) m.uniforms.uSun.value.copy(tv);
            if (vv.ring) {
              vv.ring.uniforms.uSunL.value.set(V.dot(sunDir, b.m), V.dot(sunDir, b.pl), V.dot(sunDir, V.cross(tmpW, b.m, b.pl)));
            }
          }
          if (vv.glow) {
            let s;
            if (b === sun) {
              const fade = 1 - Math.min(1, Math.max(0, (dist - 300 * AU) / (3000 * AU)));
              s = Math.max(b.r * 7, dist * 0.09) * Math.max(0.0001, fade);
              vv.glow.material.opacity = fade;
            } else if (b.kind === 'star') {
              s = Math.max(b.r * 7, dist * 0.02);
              vv.glow.material.opacity = Math.min(1, 1.6 - Math.log10(Math.max(1, dist / (b.r * 50))) * 0.5);
            } else {
              s = Math.max(b.r * 26, dist * 0.012);
              vv.glow.material.opacity = Math.min(0.55, 0.15 + 0.4 * Math.min(1, (b.r * 200) / dist));
            }
            vv.glow.scale.set(s, s, 1);
          }
        }
      }

      // marker dot
      if (mi < MAXM) {
        const k = mi++;
        b.markerIndex = k;
        mPos[3 * k] = rel[0]; mPos[3 * k + 1] = rel[2]; mPos[3 * k + 2] = -rel[1];
        const c = b._mc || (b._mc = new THREE.Color(KIND_COLOR[b.kind] || '#fff'));
        mCol[3 * k] = c.r; mCol[3 * k + 1] = c.g; mCol[3 * k + 2] = c.b;
        mSize[k] = MARK_SIZE[b.kind] || 4;
        let a = wreck ? 1 : 1 - Math.min(1, Math.max(0, (pxR - 2) / 3));
        if (b === sun && camSun > 0.004 * LY) a = 0;
        if (b.kind === 'star' && b !== sun) a = 0;
        if (b.parent && b.parent !== sun && b.parent.present) {
          const ps = screen.get(b.parent);
          if (ps && onScreen) {
            const sep = Math.hypot(sp.x - ps.x, sp.y - ps.y);
            if (sep < 4) a = 0;
            else if (sep < 9) a *= (sep - 4) / 5;
          }
        }
        if (b.kind === 'moon' && b.d.rEst && !isFocusSystem(b) && cam.focus !== b.parent) a *= 0.55;
        mAlpha[k] = a;
        b.markerAlpha = a;
      }

      if (b.kind === 'comet' || b.kind === 'interstellar') updateTail(b, rel);
      // orbit line / trail
      const pd = b.parent ? (screen.get(b.parent) || { dist: V.dist(b.parent.pos, cam.pos) }) : null;
      const want = b.parent ? orbitWanted(b, { dist: pd.dist || V.dist(b.parent.pos, cam.pos) }) : 0;
      const near = b === cam.focus && b.parent && dist < b.size * 0.02;
      if (want && !near) {
        const o = b._orbUsed;
        let ol = b.orbitLine;
        const stale = ol && (ol.orb !== o || Math.abs(jd - ol.builtJd) > rebuildInterval(b, o));
        if (!ol || stale) {
          if (ol) { scene.remove(ol.line); ol.line.geometry.dispose(); ol.mat.dispose(); }
          ol = b.orbitLine = buildOrbitLine(b, o, jd);
        }
        V.sub(tmpV, b.parent.pos, cam.pos);
        toT(tmpV, ol.line.position);
        ol.line.visible = true;
        const u = ol.mat.uniforms;
        u.uNow.value = ol.hyp ? jd - o.tp : currentMeanFraction(o, jd);
        u.uLen.value = ol.hyp ? 600 : trailFraction(b);
        const pxSize = (b.size / Math.max(1e-9, V.len(tmpV))) * pxPerRad;
        const fadeIn = Math.min(1, (pxSize - 6) / 30);
        u.uOA.value = L.orbits ? (b === cam.focus ? 0.32 : b.kind === 'moon' ? 0.13 : 0.2) * fadeIn : 0;
        u.uTA.value = L.trails ? 0.85 * fadeIn : 0;
      } else if (b.orbitLine) {
        b.orbitLine.line.visible = false;
      }
    }
    for (let k = mi; k < MAXM; k++) mAlpha[k] = 0;
    markerGeo.setDrawRange(0, mi);
    for (const n of ['position', 'color', 'aSize', 'aAlpha']) markerGeo.attributes[n].needsUpdate = true;

    // near-trail for the focused body
    const f = cam.focus;
    if (f && f.parent && f.present && (L.trails || L.orbits) && V.dist(f.pos, cam.pos) < f.size * 0.02) updateNearTrail(f, jd);
    else nearTrail.line.visible = false;

    renderer.render(scene, camera);
  };

  function rebuildInterval(b, o) {
    if (o.t === 'std') return 365;
    if (o.t === 'tab') return 180;
    if (o.dO || o.dw) {
      const rate = Math.abs(o.dO || 0) + Math.abs(o.dw || 0);
      return Math.max(0.05, 0.3 / Math.max(rate, 1e-9));
    }
    return 1e9;
  }

  /* ---------------- focusing & flights ---------------- */
  function viewDistance(b) {
    if (b.d.post && b.orbitAt(state.jd) === b.d.post) return 2600;
    if (b.kind === 'blackhole') return b.r * 38;
    let r = Math.max(b.bound, b.r);
    if (b.d.ring) r = Math.max(r, b.d.ring.out * 0.9);
    if (b.kind === 'star') return r * 7;
    if (b.kind === 'station' || b.kind === 'spacecraft') return r * 5;
    return r * 4.2;
  }
  S.minDist = (b) => {
    if (!b) return 1e-3;
    if (b.d.post && b.orbitAt(state.jd) === b.d.post) return 30;
    return Math.max(b.bound, b.r) * (b.kind === 'station' || b.kind === 'spacecraft' ? 1.6 : 1.12);
  };
  S.viewDistance = viewDistance;

  S.focus = function (b, opts = {}) {
    if (!b) return;
    const sun = E.sun();
    const cur = cam.focus;
    const fromPoint = [0, 0, 0];
    if (cam.tr) {
      // continue smoothly from the current interpolated point
      V.addScaled(fromPoint, cam.pos, fwd, -cam.dist);
    } else if (cur) V.copy(fromPoint, cur.pos);
    else V.addScaled(fromPoint, cam.pos, fwd, -cam.dist);
    E.updateAll(E.tdb(state.jd));
    let y1 = cam.yaw, p1 = cam.pitch;
    if (b !== sun && b.kind !== 'star' && b.kind !== 'blackhole' && !opts.keepAngle) {
      if ((b.kind === 'station' || b.kind === 'spacecraft' || b.kind === 'historic') && b.parent && b.parent !== sun) {
        // look past the station toward its planet: camera above and slightly behind it
        V.sub(tmpV, b.pos, b.parent.pos); V.norm(tmpV, tmpV);
        V.sub(tmpW, sun.pos, b.pos); V.norm(tmpW, tmpW);
        V.addScaled(tmpV, tmpV, tmpW, 0.55); V.norm(tmpV, tmpV);
        y1 = Math.atan2(tmpV[1], tmpV[0]); p1 = Math.asin(Math.max(-0.95, Math.min(0.95, tmpV[2])));
      } else {
        V.sub(tmpV, sun.pos, b.pos);
        y1 = Math.atan2(tmpV[1], tmpV[0]) + 0.75;
        p1 = 0.32;
      }
    }
    const d1 = opts.dist || viewDistance(b);
    const sep = V.dist(fromPoint, b.pos);
    const dur = opts.instant ? 0.0001 : Math.min(4.2, 1.4 + 0.11 * Math.abs(Math.log(Math.max(sep, 1) / d1)) + 0.05 * Math.abs(Math.log(cam.dist / d1)));
    cam.tr = { from: cam.tr ? null : cur, fromPoint, to: b, t: 0, dur, d0: cam.dist, d1, y0: cam.yaw, y1, p0: cam.pitch, p1, dtLast: 0 };
    cam.focus = b;
    if (S.onFocus) S.onFocus(b);
  };
  S.tick = (dt) => { if (cam.tr) cam.tr.dtLast = dt; };

  /* ---------------- input ---------------- */
  const ptrs = new Map();
  let drag = null, pinch0 = 0, moved = 0;
  canvas.addEventListener('pointerdown', (e) => {
    canvas.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    drag = { x: e.clientX, y: e.clientY }; moved = 0;
    if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x - b.x, a.y - b.y); }
  });
  canvas.addEventListener('pointermove', (e) => {
    const p = ptrs.get(e.pointerId);
    if (!p) { hoverCheck(e.clientX, e.clientY); return; }
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    if (ptrs.size === 2) {
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinch0 > 0) zoomBy(pinch0 / d);
      pinch0 = d;
      return;
    }
    if (cam.tr) return;
    cam.yaw -= dx * 0.0055;
    cam.pitch = Math.max(-1.55, Math.min(1.55, cam.pitch + dy * 0.0055));
  });
  const endPtr = (e) => {
    const wasClick = ptrs.size === 1 && moved < 6;
    ptrs.delete(e.pointerId);
    if (ptrs.size < 2) pinch0 = 0;
    if (wasClick && e.type === 'pointerup') S.onClick && S.onClick(e.clientX, e.clientY, e);
  };
  canvas.addEventListener('pointerup', endPtr);
  canvas.addEventListener('pointercancel', endPtr);
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 0.05 : 0.0016;
    zoomBy(Math.exp(e.deltaY * k));
  }, { passive: false });
  canvas.addEventListener('dblclick', (e) => { S.onDoubleClick && S.onDoubleClick(e.clientX, e.clientY); });
  function zoomBy(f) {
    const lo = S.minDist(cam.focus), hi = 3e21;
    if (cam.tr) { cam.tr.d1 = Math.max(lo, Math.min(hi, cam.tr.d1 * f)); return; }
    cam.dist = Math.max(lo, Math.min(hi, cam.dist * f));
  }
  S.zoomBy = zoomBy;
  let hoverT = 0;
  function hoverCheck(x, y) {
    const now = performance.now();
    if (now - hoverT < 60) return;
    hoverT = now;
    canvas.style.cursor = S.pickBody(x, y) ? 'pointer' : 'grab';
  }

  /* ---------------- picking ---------------- */
  S.pickBody = function (x, y) {
    let best = null, bestScore = Infinity;
    for (const [b, s] of screen) {
      if (!b.present) continue;
      if (b.kind === 'blackhole' && !state.layers.bh) continue;
      const vis = b.markerAlpha > 0.05 || s.px > 2 || b.kind === 'star' || b.kind === 'blackhole';
      if (!vis) continue;
      const r = Math.max(9, s.px);
      const d = Math.hypot(s.x - x, s.y - y);
      if (d > r) continue;
      const score = d / r + (b.kind === 'moon' && b.d.rEst ? 0.4 : 0) - (s.px > 9 ? 0.5 : 0) + s.dist * 1e-30;
      if (score < bestScore) { bestScore = score; best = b; }
    }
    return best;
  };
  S.pickStar = function (x, y) {
    if (!state.layers.stars) return -1;
    let best = -1, bestM = 99;
    const c = [cam.pos[0] / LY, cam.pos[1] / LY, cam.pos[2] / LY];
    const p = [0, 0, 0], q = { x: 0, y: 0, z: 0 };
    for (let k = 0; k < STARROWS.length; k++) {
      const e = starEcl[k];
      V.set(p, e[0] - cam.pos[0], e[1] - cam.pos[1], e[2] - cam.pos[2]);
      if (!project(p, q)) continue;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d > 10) continue;
      const dly = V.len(p) / LY;
      if (dly < 0.004) continue;
      const m = STARROWS[k][3] + 5 * Math.log10(dly / 3.26156) - 5 + d * 0.15;
      if (m < bestM && m < 7.5) { bestM = m; best = k; }
    }
    return best;
  };
  S.pickComet = function (x, y) {
    if (!state.layers.comets) return -1;
    let best = -1, bd = 8;
    const p = [0, 0, 0], q = { x: 0, y: 0, z: 0 };
    for (let k = 0; k < cometRows.length; k++) {
      V.set(p, cometHelio[3 * k] - cam.pos[0], cometHelio[3 * k + 1] - cam.pos[1], cometHelio[3 * k + 2] - cam.pos[2]);
      if (!project(p, q)) continue;
      const d = Math.hypot(q.x - x, q.y - y);
      if (d < bd) { bd = d; best = k; }
    }
    return best;
  };
  /* CPU replica of the GPU asteroid propagation, used to find what was clicked */
  S.asteroidElements = function (ch, i) {
    const r = ch.recs, o = 8 * i;
    const lnA0 = Math.log(0.1), lnA1 = Math.log(5000);
    if (r[o] === 0) return null;
    const a = Math.exp(lnA0 + (r[o] / 65535) * (lnA1 - lnA0));
    return {
      a, e: r[o + 1] / 65535, i: (r[o + 2] / 65535) * 180, O: (r[o + 3] / 65535) * 360, w: (r[o + 4] / 65535) * 360,
      M: (r[o + 5] / 65535) * 360, D: r[o + 6] ? Math.pow(10, (r[o + 6] / 65535) * 7) / 1000 : null,
      H: (r[o + 7] >> 8) ? (r[o + 7] >> 8) / 8 - 2 : null, cls: r[o + 7] & 255,
    };
  };
  S.pickAsteroid = function (x, y) {
    if (!state.layers.asteroids || !astMeta.chunks.length) return null;
    const lnA0 = Math.log(0.1), lnA1 = Math.log(5000);
    const dt = E.tdb(state.jd) - 2461200.5;
    const cx = cam.pos[0] / AU, cy = cam.pos[1] / AU, cz = cam.pos[2] / AU;
    const m = camera.matrixWorldInverse.elements;
    let best = null, bd = 7;
    for (const ch of astMeta.chunks) {
      const r = ch.recs;
      for (let i = 0; i < ch.count; i++) {
        const o = 8 * i;
        if (r[o] === 0) continue;
        const a = Math.exp(lnA0 + (r[o] / 65535) * (lnA1 - lnA0));
        const e = r[o + 1] / 65535, inc = (r[o + 2] / 65535) * Math.PI, O = (r[o + 3] / 65535) * 2 * Math.PI, w = (r[o + 4] / 65535) * 2 * Math.PI;
        const n = 0.01720209895 / (a * Math.sqrt(a));
        const EA = E.keplerE((r[o + 5] / 65535) * 2 * Math.PI + n * dt, e);
        const px = a * (Math.cos(EA) - e), py = a * Math.sqrt(1 - e * e) * Math.sin(EA);
        const cO = Math.cos(O), sO = Math.sin(O), cw = Math.cos(w), sw = Math.sin(w), ci = Math.cos(inc), si = Math.sin(inc);
        const X = px * (cw * cO - sw * sO * ci) + py * (-sw * cO - cw * sO * ci) - cx;
        const Y = px * (cw * sO + sw * cO * ci) + py * (-sw * sO + cw * cO * ci) - cy;
        const Z = px * (sw * si) + py * (cw * si) - cz;
        // three coords (X, Z, -Y) -> view
        const tx_ = X, ty_ = Z, tz_ = -Y;
        const vx = m[0] * tx_ + m[4] * ty_ + m[8] * tz_, vy = m[1] * tx_ + m[5] * ty_ + m[9] * tz_, vz = m[2] * tx_ + m[6] * ty_ + m[10] * tz_;
        if (vz >= 0) continue;
        const sx = W / 2 + (vx / -vz) * pxPerRad, sy = H / 2 - (vy / -vz) * pxPerRad;
        const d = Math.abs(sx - x) + Math.abs(sy - y);
        if (d < bd) { bd = d; best = { ch, i }; }
      }
    }
    return best;
  };

  S.setPixelRatio = () => {
    const pr = PR();
    starMat.uniforms.uPR.value = pr; astUniforms.uPR.value = pr; cometMat.uniforms.uPR.value = pr; markerMat.uniforms.uPR.value = pr;
  };
})();
