/* The Math Book calculator: expression engine, customizable keypad, grapher. */
(function () {
  "use strict";

  /* ---------------- Expression engine ---------------- */

  const FUNCS = {
    sin: 1, cos: 1, tan: 1, sec: 1, csc: 1, cot: 1, asin: 1, acos: 1, atan: 1,
    sinh: 1, cosh: 1, tanh: 1, ln: 1, log: 1, log2: 1, logb: 2, sqrt: 1, cbrt: 1,
    abs: 1, floor: 1, ceil: 1, round: 1, sgn: 1, exp: 1, gamma: 1, zeta: 1, erf: 1,
    sigmoid: 1, step: 1, fib: 1, totient: 1, gcd: 2, lcm: 2, nCr: 2, nPr: 2,
    min: 2, max: 2, mean: 2, sum: 3, prod: 3, int: 3, deriv: 2, rand: 0, fact: 1
  };
  const CONSTS = { pi: Math.PI, tau: 2 * Math.PI, phi: (1 + Math.sqrt(5)) / 2, e: Math.E, inf: Infinity };
  const VARS = ["x", "y", "n", "k", "t", "Ans"];
  const NAMES = Object.keys(FUNCS).concat(Object.keys(CONSTS), VARS, ["mod"])
    .sort((a, b) => b.length - a.length);

  function tokenize(src) {
    const s = src
      .replace(/[×·∗]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-")
      .replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/π/g, " pi ").replace(/τ/g, " tau ").replace(/φ/g, " phi ").replace(/∞/g, " inf ")
      .replace(/√/g, " sqrt ").replace(/∛/g, " cbrt ").replace(/Σ/g, " sum ").replace(/∏/g, " prod ")
      .replace(/∫/g, " int ").replace(/Γ/g, " gamma ").replace(/ζ/g, " zeta ");
    const out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        let j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        const txt = s.slice(i, j);
        if ((txt.match(/\./g) || []).length > 1 || txt === ".") throw new Error("“" + txt + "” is not a number");
        out.push({ t: "num", v: parseFloat(txt) });
        i = j; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        const name = NAMES.find(n => s.startsWith(n, i));
        if (name) {
          out.push({ t: "id", v: name });
          i += name.length;
        } else {
          let j = i;
          while (j < s.length && /[A-Za-z_]/.test(s[j])) j++;
          throw new Error("The calculator doesn’t know “" + s.slice(i, j) + "” yet");
        }
        continue;
      }
      if ("+-*/^(),!%|°".includes(c)) { out.push({ t: c }); i++; continue; }
      throw new Error("“" + c + "” is a symbol to read about, not something the calculator can work out");
    }
    return out;
  }

  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = () => toks[p];
    const eat = t => { if (peek() && peek().t === t) { p++; return true; } return false; };
    const need = t => { if (!eat(t)) throw new Error(t === ")" ? "A bracket is missing its “)”" : "Expected “" + t + "”"); };

    function startsPrimary(tk) {
      if (!tk) return false;
      if (tk.t === "num" || tk.t === "(") return true;
      if (tk.t === "id" && tk.v !== "mod") return true;
      return false;
    }
    function expr() {
      let a = term();
      while (peek() && (peek().t === "+" || peek().t === "-")) {
        const op = toks[p++].t;
        a = { k: "bin", op, a, b: term() };
      }
      return a;
    }
    function term() {
      let a = unary();
      for (;;) {
        const tk = peek();
        if (tk && (tk.t === "*" || tk.t === "/")) { p++; a = { k: "bin", op: tk.t, a, b: unary() }; }
        else if (tk && tk.t === "id" && tk.v === "mod") { p++; a = { k: "bin", op: "mod", a, b: unary() }; }
        else if (startsPrimary(tk)) { a = { k: "bin", op: "*", a, b: power() }; }
        else break;
      }
      return a;
    }
    function unary() {
      if (eat("-")) return { k: "neg", a: unary() };
      if (eat("+")) return unary();
      return power();
    }
    function power() {
      const base = postfix();
      if (eat("^")) return { k: "bin", op: "^", a: base, b: unary() };
      return base;
    }
    function postfix() {
      let a = primary();
      for (;;) {
        if (eat("!")) a = { k: "call", f: "fact", args: [a] };
        else if (eat("%")) a = { k: "bin", op: "/", a, b: { k: "num", v: 100 } };
        else if (eat("°")) a = { k: "deg", a };
        else break;
      }
      return a;
    }
    function primary() {
      const tk = peek();
      if (!tk) throw new Error("The expression ends too early");
      if (tk.t === "num") { p++; return { k: "num", v: tk.v }; }
      if (eat("(")) { const e = expr(); need(")"); return e; }
      if (eat("|")) { const e = expr(); need("|"); return { k: "call", f: "abs", args: [e] }; }
      if (tk.t === "id") {
        p++;
        const name = tk.v;
        if (name in FUNCS) {
          if (eat("(")) {
            const args = [];
            if (!eat(")")) {
              do { args.push(expr()); } while (eat(","));
              need(")");
            }
            return { k: "call", f: name, args };
          }
          return { k: "call", f: name, args: [postfix()] };
        }
        if (name in CONSTS) return { k: "num", v: CONSTS[name] };
        return { k: "var", n: name };
      }
      throw new Error("Something is missing before “" + tk.t + "”");
    }
    const tree = expr();
    if (p < toks.length) {
      const tk = toks[p];
      throw new Error(tk.t === ")" ? "There is an extra “)”" : "Unexpected “" + (tk.v || tk.t) + "”");
    }
    return tree;
  }

  function gammaFn(z) {
    if (Number.isInteger(z)) return z <= 0 ? NaN : factorial(z - 1);
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaFn(1 - z));
    // shift up, then Stirling's series
    let shift = 1;
    while (z < 12) { shift *= z; z += 1; }
    const z2 = z * z;
    const lnG = (z - 0.5) * Math.log(z) - z + 0.5 * Math.log(2 * Math.PI) +
      1 / (12 * z) - 1 / (360 * z * z2) + 1 / (1260 * z2 * z2 * z) - 1 / (1680 * z2 * z2 * z2 * z);
    return Math.exp(lnG) / shift;
  }
  function factorial(n) {
    if (n < 0 && Number.isInteger(n)) return NaN;
    if (Number.isInteger(n)) { let r = 1; for (let i = 2; i <= n; i++) { r *= i; if (!isFinite(r)) break; } return r; }
    return gammaFn(n + 1);
  }
  function zetaFn(s) {
    if (s === 1) return Infinity;
    if (s < 1) {
      // functional equation
      return Math.pow(2, s) * Math.pow(Math.PI, s - 1) * Math.sin(Math.PI * s / 2) * gammaFn(1 - s) * zetaFn(1 - s);
    }
    // Euler–Maclaurin with N terms
    const N = 20;
    let sum = 0;
    for (let k = 1; k < N; k++) sum += Math.pow(k, -s);
    sum += Math.pow(N, 1 - s) / (s - 1) + 0.5 * Math.pow(N, -s);
    sum += s * Math.pow(N, -s - 1) / 12 - s * (s + 1) * (s + 2) * Math.pow(N, -s - 3) / 720;
    return sum;
  }
  function erfFn(x) {
    const t = 1 / (1 + 0.3275911 * Math.abs(x));
    const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  }
  function gcd(a, b) { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; }
  function needInt(v, name) { if (!Number.isInteger(v)) throw new Error(name + " needs whole numbers"); return v; }

  function ev(node, env) {
    switch (node.k) {
      case "num": return node.v;
      case "var": {
        if (node.n === "Ans") return env.Ans ?? 0;
        if (!(node.n in env)) throw new Error(node.n === "x" ? "This has x in it. Use Graph to draw it" : "“" + node.n + "” has no value here");
        return env[node.n];
      }
      case "neg": return -ev(node.a, env);
      case "deg": return env.deg ? ev(node.a, env) : ev(node.a, env) * Math.PI / 180;
      case "bin": {
        const a = ev(node.a, env), b = ev(node.b, env);
        switch (node.op) {
          case "+": return a + b;
          case "-": return a - b;
          case "*": return a * b;
          case "/": if (b === 0 && !env.graph) throw new Error("You can’t divide by zero"); return a / b;
          case "^": return Math.pow(a, b);
          case "mod": return ((a % b) + b) % b;
        }
        break;
      }
      case "call": return call(node, env);
    }
    throw new Error("Could not work that out");
  }

  function call(node, env) {
    const f = node.f, A = node.args;
    const need = n => { if (A.length < n) throw new Error(f + "( needs " + n + " input" + (n > 1 ? "s, separated by commas" : "")); };
    const toRad = v => env.deg ? v * Math.PI / 180 : v;
    const fromRad = v => env.deg ? v * 180 / Math.PI : v;
    if (f === "sum" || f === "prod") {
      need(3);
      const lo = Math.round(ev(A[1], env)), hi = Math.round(ev(A[2], env));
      if (hi - lo > 1e6) throw new Error("That is too many terms to add");
      let r = f === "sum" ? 0 : 1;
      for (let i = lo; i <= hi; i++) {
        const v = ev(A[0], Object.assign({}, env, { n: i, k: i }));
        r = f === "sum" ? r + v : r * v;
      }
      return r;
    }
    if (f === "int") {
      need(3);
      const a = ev(A[1], env), b = ev(A[2], env), N = 1000, h = (b - a) / N;
      const g = x => ev(A[0], Object.assign({}, env, { x }));
      let s = g(a) + g(b);
      for (let i = 1; i < N; i++) s += g(a + i * h) * (i % 2 ? 4 : 2);
      return s * h / 3;
    }
    if (f === "deriv") {
      need(1);
      const at = A.length > 1 ? ev(A[1], env) : ev({ k: "var", n: "x" }, env);
      const h = 1e-5 * Math.max(1, Math.abs(at));
      const g = x => ev(A[0], Object.assign({}, env, { x }));
      return (g(at + h) - g(at - h)) / (2 * h);
    }
    if (f === "rand") return Math.random();
    const v = A.map(a => ev(a, env));
    if (f === "min" || f === "max") { need(1); return Math[f](...v); }
    if (f === "mean") { need(1); return v.reduce((s, x) => s + x, 0) / v.length; }
    if (f === "gcd") { need(2); return v.reduce((a, b) => gcd(a, b)); }
    if (f === "lcm") { need(2); return v.reduce((a, b) => Math.abs(a * b) / gcd(a, b)); }
    if (f === "logb") { need(2); return Math.log(v[1]) / Math.log(v[0]); }
    if (f === "nCr" || f === "nPr") {
      need(2);
      const n = needInt(v[0], f), r = needInt(v[1], f);
      if (r < 0 || r > n) return 0;
      let res = 1;
      for (let i = 0; i < r; i++) res *= (n - i) / (f === "nCr" ? (i + 1) : 1);
      return Math.round(res);
    }
    need(1);
    const x = v[0];
    switch (f) {
      case "sin": return Math.sin(toRad(x));
      case "cos": return Math.cos(toRad(x));
      case "tan": return Math.tan(toRad(x));
      case "sec": return 1 / Math.cos(toRad(x));
      case "csc": return 1 / Math.sin(toRad(x));
      case "cot": return 1 / Math.tan(toRad(x));
      case "asin": return fromRad(Math.asin(x));
      case "acos": return fromRad(Math.acos(x));
      case "atan": return fromRad(Math.atan(x));
      case "sinh": return Math.sinh(x);
      case "cosh": return Math.cosh(x);
      case "tanh": return Math.tanh(x);
      case "ln": return Math.log(x);
      case "log": return A.length > 1 ? Math.log(x) / Math.log(v[1]) : Math.log10(x);
      case "log2": return Math.log2(x);
      case "sqrt": return Math.sqrt(x);
      case "cbrt": return Math.cbrt(x);
      case "abs": return Math.abs(x);
      case "floor": return Math.floor(x);
      case "ceil": return Math.ceil(x);
      case "round": return Math.round(x);
      case "sgn": return Math.sign(x);
      case "exp": return Math.exp(x);
      case "gamma": return gammaFn(x);
      case "zeta": return zetaFn(x);
      case "erf": return erfFn(x);
      case "sigmoid": return 1 / (1 + Math.exp(-x));
      case "step": return x < 0 ? 0 : 1;
      case "fact": return factorial(x);
      case "fib": {
        needInt(x, "fib");
        let a = 0, b = 1;
        for (let i = 0; i < x; i++) [a, b] = [b, a + b];
        return a;
      }
      case "totient": {
        const n = needInt(x, "totient");
        let c = 0;
        for (let i = 1; i <= n; i++) if (gcd(i, n) === 1) c++;
        return c;
      }
    }
    throw new Error("Unknown function " + f);
  }

  function fmt(v) {
    if (typeof v !== "number" || isNaN(v)) return "Undefined";
    if (v === Infinity) return "∞";
    if (v === -Infinity) return "−∞";
    if (Object.is(v, -0)) v = 0;
    const a = Math.abs(v);
    if (Number.isInteger(v) && a < 1e15) return String(v).replace("-", "−");
    if (a !== 0 && (a >= 1e15 || a < 1e-9)) {
      const [m, e] = v.toExponential(9).split("e");
      return (parseFloat(m) + "").replace("-", "−") + "×10^" + e.replace("+", "").replace("-", "−");
    }
    return String(parseFloat(v.toPrecision(11))).replace("-", "−");
  }

  function compile(src) {
    const tree = parse(src);
    return env => ev(tree, env || {});
  }
  function evaluate(src, env) { return compile(src)(env); }

  /* ---------------- Keypad state ---------------- */

  const STORE_KEY = "mathbook-calc-v1";
  let uid = 1;
  const nid = () => "k" + (Date.now().toString(36)) + (uid++);

  function K(label, opts) { return Object.assign({ id: nid(), label, w: 1, h: 1 }, opts); }
  const ins = (label, text, kind, extra) => K(label, Object.assign({ ins: text ?? label, kind: kind || "fn" }, extra));
  const act = (label, a, kind, extra) => K(label, Object.assign({ act: a, kind: kind || "util" }, extra));

  function defaultLayout() {
    const pages = {
      main: { name: "Main", buttons: [
        act("C", "clear"), act("⌫", "back"), ins("(", "(", "op"), ins(")", ")", "op"), ins("÷", "÷", "op"),
        ins("7", "7", "num"), ins("8", "8", "num"), ins("9", "9", "num"), ins("×", "×", "op"), ins("√", "√(", "fn"),
        ins("4", "4", "num"), ins("5", "5", "num"), ins("6", "6", "num"), ins("−", "−", "op"), ins("x²", "²", "fn"),
        ins("1", "1", "num"), ins("2", "2", "num"), ins("3", "3", "num"), ins("+", "+", "op"), ins("xʸ", "^", "fn"),
        ins("0", "0", "num"), ins(".", ".", "num"), ins("π", "π", "fn"), act("Ans", "ans", "fn"), act("=", "eq", "eq"),
        K("Functions", { page: "fns", kind: "folder", w: 2 }), K("Symbols", { page: "syms", kind: "folder", w: 2 }), ins("x", "x", "fn")
      ] },
      fns: { name: "Functions", buttons: [
        ins("sin", "sin("), ins("cos", "cos("), ins("tan", "tan("), act("DEG", "angle", "util"), ins(",", ",", "op"),
        ins("sin⁻¹", "asin("), ins("cos⁻¹", "acos("), ins("tan⁻¹", "atan("), ins("ln", "ln("), ins("log", "log("),
        ins("sinh", "sinh("), ins("cosh", "cosh("), ins("tanh", "tanh("), ins("eˣ", "exp("), ins("|x|", "abs("),
        ins("n!", "!"), ins("⌊x⌋", "floor("), ins("⌈x⌉", "ceil("), ins("round", "round("), ins("Γ", "gamma("),
        ins("ζ", "zeta("), ins("σ(x)", "sigmoid("), ins("erf", "erf("), ins("sgn", "sgn("),
        K("Calculus", { page: "calc", kind: "folder" })
      ] },
      calc: { name: "Calculus", buttons: [
        ins("Σ", "sum("), ins("∏", "prod("), ins("∫", "int("), ins("d/dx", "deriv("), ins(",", ",", "op"),
        ins("n", "n"), ins("x", "x"), ins("(", "(", "op"), ins(")", ")", "op"), act("⌫", "back")
      ] },
      syms: { name: "Symbols", buttons: [
        ins("e", "e"), ins("φ", "φ"), ins("τ", "τ"), ins("∞", "∞"), ins("%", "%", "op"),
        ins("mod", " mod ", "op"), ins("gcd", "gcd("), ins("lcm", "lcm("), ins("nCr", "nCr("), ins("nPr", "nPr("),
        ins("∛", "∛("), ins("x³", "³"), ins("fib", "fib("), ins("φ(n)", "totient("), ins(",", ",", "op"),
        ins("°", "°", "op"), ins("1/x", "1/(", "fn"), ins("rand", "rand()")
      ] }
    };
    return { title: "My Calculator", cols: 5, pages, deg: false };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && s.pages && s.pages.main) return s;
      }
    } catch (e) { /* storage unavailable */ }
    return defaultLayout();
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }

  let S = load();
  const UI = {
    mode: "calc", page: "main", edit: false, selected: null,
    expr: "", result: "", error: "", history: [], ans: 0,
    fx: ["sin(x)", "x²/4 − 1", "", ""], activeFx: 0,
    view: { cx: 0, cy: 0, scale: 40 }, trace: null, zoomDir: ""
  };
  const FX_COLORS = ["var(--g1)", "var(--g2)", "var(--g3)", "var(--g4)"];

  /* ---------------- Rendering ---------------- */

  const h = (tag, attrs, ...kids) => {
    const el = document.createElement(tag);
    for (const k in attrs || {}) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else el.setAttribute(k, v === true ? "" : v);
    }
    kids.flat(Infinity).forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  };

  let root = null;

  function mount(el) {
    root = el;
    render();
  }

  function pagePath() {
    // find the chain of pages from main to current
    const path = [];
    const find = (pid, trail) => {
      if (pid === UI.page) { path.push(...trail, pid); return true; }
      const pg = S.pages[pid];
      if (!pg) return false;
      for (const b of pg.buttons) if (b.page && !trail.includes(b.page) && find(b.page, trail.concat(pid))) return true;
      return false;
    };
    if (!find("main", [])) { UI.page = "main"; return ["main"]; }
    return path;
  }

  function render() {
    if (!root) return;
    const focusId = document.activeElement && document.activeElement.id;
    root.innerHTML = "";
    const page = S.pages[UI.page] || S.pages.main;

    const titleEl = UI.edit
      ? h("input", { id: "calc-title-input", class: "calc-title-input", value: S.title, "aria-label": "Calculator title",
          oninput: e => { S.title = e.target.value; save(); } })
      : h("h2", { class: "calc-title" }, S.title || "Calculator");

    const header = h("div", { class: "calc-head" },
      titleEl,
      h("div", { class: "seg", role: "tablist" },
        h("button", { class: UI.mode === "calc" ? "on" : "", role: "tab", "aria-selected": UI.mode === "calc", onclick: () => { UI.mode = "calc"; render(); } }, "Calculate"),
        h("button", { class: UI.mode === "graph" ? "on" : "", role: "tab", "aria-selected": UI.mode === "graph", onclick: () => { UI.mode = "graph"; render(); } }, "Graph")
      ),
      h("button", { class: "btn " + (UI.edit ? "btn-accent" : "btn-ghost"), onclick: () => { UI.edit = !UI.edit; UI.selected = null; render(); } },
        UI.edit ? "Done customizing" : "Customize")
    );

    const screen = UI.mode === "calc" ? renderScreen() : renderGraph();

    const path = pagePath();
    const crumbs = h("nav", { class: "crumbs", "aria-label": "Button pages" },
      path.map((pid, i) => {
        const last = i === path.length - 1;
        return [
          i > 0 ? h("span", { class: "crumb-sep", "aria-hidden": "true" }, "›") : null,
          h("button", { class: "crumb" + (last ? " here" : ""), "data-page": pid, disabled: last && !UI.edit ? true : null,
            onclick: () => { if (!last) zoomTo(pid, "out"); } }, S.pages[pid].name)
        ];
      }),
      h("span", { class: "deg-pill", title: "Angle mode for sin, cos and tan" }, S.deg ? "DEG" : "RAD")
    );

    const grid = h("div", { class: "keys" + (UI.edit ? " editing" : "") + (UI.zoomDir ? " zoom-" + UI.zoomDir : ""),
      style: "--cols:" + S.cols });
    page.buttons.forEach((b, i) => grid.append(renderKey(b, i)));
    if (UI.edit) {
      grid.append(h("button", { class: "key key-add", onclick: openPicker, title: "Add a button from the Math Book" }, "+ Add"));
    }
    UI.zoomDir = "";

    const parts = [header, screen, crumbs, grid];
    if (UI.edit) parts.push(renderEditBar());
    root.append(h("div", { class: "calc-shell" + (UI.edit ? " is-editing" : "") }, parts));

    if (UI.mode === "graph") drawGraph();
    if (focusId) { const f = document.getElementById(focusId); if (f) f.focus(); }
  }

  function renderScreen() {
    const input = h("input", { id: "calc-expr", class: "calc-expr", value: UI.expr, autocomplete: "off", spellcheck: "false",
      "aria-label": "Expression", placeholder: "Type or tap buttons",
      oninput: e => { UI.expr = e.target.value; preview(); },
      onkeydown: e => { if (e.key === "Enter") { e.preventDefault(); equals(); } } });
    const res = h("div", { class: "calc-result" + (UI.error ? " err" : ""), id: "calc-result", "aria-live": "polite" },
      UI.error || UI.result);
    const hist = h("ol", { class: "calc-history" },
      UI.history.slice(-3).map(r => h("li", null,
        h("button", { class: "hist", onclick: () => { UI.expr = r.e; render(); preview(); } }, h("span", null, r.e), h("b", null, "= " + r.v)))));
    const graphIt = /x/.test(UI.expr.replace(/exp|max/g, "")) ? h("button", { class: "btn btn-small", onclick: () => {
      UI.fx[UI.activeFx] = UI.expr; UI.mode = "graph"; render(); } }, "Graph this") : null;
    return h("div", { class: "screen" }, hist, input, h("div", { class: "result-row" }, res, graphIt));
  }

  function preview() {
    const el = document.getElementById("calc-result");
    const e = UI.expr.trim();
    UI.error = ""; UI.result = "";
    if (e) {
      try { UI.result = "= " + fmt(evaluate(e, { Ans: UI.ans, deg: S.deg })); }
      catch (err) { UI.result = ""; }
    }
    if (el) { el.textContent = UI.result; el.classList.remove("err"); }
  }

  function equals() {
    const e = UI.expr.trim();
    if (!e) return;
    try {
      const v = evaluate(e, { Ans: UI.ans, deg: S.deg });
      UI.ans = v;
      UI.history.push({ e, v: fmt(v) });
      UI.expr = fmt(v).replace(/×10\^(.+)$/, "×10^($1)");
      UI.result = "";
      UI.error = "";
    } catch (err) {
      UI.error = err.message;
    }
    render();
  }

  function targetInput() {
    if (UI.mode === "calc") return document.getElementById("calc-expr");
    return document.getElementById("fx-" + UI.activeFx);
  }

  function typeText(text) {
    const inp = targetInput();
    let val = UI.mode === "calc" ? UI.expr : UI.fx[UI.activeFx];
    let pos = inp && inp.selectionStart != null && document.activeElement === inp ? inp.selectionStart : val.length;
    let end = inp && document.activeElement === inp ? inp.selectionEnd : pos;
    if (UI.mode === "calc" && UI.history.length && UI.expr === UI.history[UI.history.length - 1].v.replace(/×10\^(.+)$/, "×10^($1)")
        && /^[0-9.(πeφτ√∛a-z]/.test(text) && !UI.edit) {
      // start fresh after a result when a number is typed
      val = ""; pos = end = 0;
    }
    val = val.slice(0, pos) + text + val.slice(end);
    setVal(val, pos + text.length);
  }
  function setVal(val, caret) {
    if (UI.mode === "calc") UI.expr = val; else UI.fx[UI.activeFx] = val;
    UI.error = "";
    render();
    const inp = targetInput();
    if (inp && window.matchMedia("(pointer:fine)").matches) { inp.focus(); inp.setSelectionRange(caret, caret); }
    if (UI.mode === "calc") preview();
  }

  function press(b) {
    if (b.page) { zoomTo(b.page, "in"); return; }
    if (b.act) {
      const inp = targetInput();
      let val = UI.mode === "calc" ? UI.expr : UI.fx[UI.activeFx];
      switch (b.act) {
        case "clear": UI.error = ""; UI.result = ""; setVal("", 0); return;
        case "back": {
          const pos = inp && document.activeElement === inp ? inp.selectionStart : val.length;
          if (pos > 0) setVal(val.slice(0, pos - 1) + val.slice(pos), pos - 1);
          return;
        }
        case "eq": if (UI.mode === "calc") equals(); else render(); return;
        case "ans": typeText("Ans"); return;
        case "angle": S.deg = !S.deg; save(); render(); preview(); return;
      }
      return;
    }
    if (b.ins != null) typeText(b.ins);
  }

  function zoomTo(pid, dir) {
    UI.page = pid;
    UI.selected = null;
    UI.zoomDir = dir;
    render();
  }

  function keyClass(b) {
    return "key kind-" + (b.kind || "fn") + (b.page ? " key-folder" : "") + (UI.selected === b.id ? " selected" : "");
  }

  function renderKey(b, i) {
    const label = b.act === "angle" ? (S.deg ? "DEG" : "RAD") : b.label;
    const el = h("button", { class: keyClass(b), "data-i": i, "data-id": b.id,
      style: "grid-column: span " + Math.min(b.w || 1, S.cols) + "; grid-row: span " + (b.h || 1),
      title: b.title || (b.page ? "Zoom into " + label : null),
      "aria-label": b.page ? "Open " + label + " buttons" : null },
      b.page ? h("span", { class: "zoom-ico", "aria-hidden": "true", html: ZOOM_SVG }) : null,
      h("span", { class: "key-label" }, label));
    if (!UI.edit) {
      el.addEventListener("click", () => press(b));
      return el;
    }
    el.append(
      h("span", { class: "del", role: "button", "aria-label": "Remove " + label, title: "Remove",
        onpointerdown: e => e.stopPropagation(),
        onclick: e => { e.stopPropagation(); removeKey(b.id); } }, "×"),
      h("span", { class: "handle", title: "Drag to stretch", "aria-hidden": "true", onpointerdown: e => startResize(e, b, el) })
    );
    el.addEventListener("pointerdown", e => startDrag(e, b, i, el));
    el.addEventListener("keydown", e => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectKey(b.id); }
    });
    return el;
  }

  const ZOOM_SVG = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21M10.5 7.5v6M7.5 10.5h6"/></svg>';

  function selectKey(id) { UI.selected = UI.selected === id ? null : id; render(); }

  function removeKey(id) {
    const pg = S.pages[UI.page];
    const b = pg.buttons.find(x => x.id === id);
    pg.buttons = pg.buttons.filter(x => x.id !== id);
    if (b && b.page) prunePages();
    if (UI.selected === id) UI.selected = null;
    save(); render();
  }
  function prunePages() {
    const seen = new Set();
    const walk = pid => { if (seen.has(pid) || !S.pages[pid]) return; seen.add(pid); S.pages[pid].buttons.forEach(b => b.page && walk(b.page)); };
    walk("main");
    Object.keys(S.pages).forEach(k => { if (!seen.has(k)) delete S.pages[k]; });
  }

  /* Drag to move */
  function startDrag(e, b, i, el) {
    if (e.button !== 0) return;
    const sx = e.clientX, sy = e.clientY;
    let dragging = false, ghost = null, target = null, where = null;
    el.setPointerCapture(e.pointerId);
    const clear = () => document.querySelectorAll(".drop-before,.drop-after,.drop-into").forEach(n => n.classList.remove("drop-before", "drop-after", "drop-into"));
    const move = ev => {
      if (!dragging && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
        dragging = true;
        el.classList.add("dragging");
        const r = el.getBoundingClientRect();
        ghost = el.cloneNode(true);
        ghost.className += " ghost";
        ghost.style.width = r.width + "px";
        ghost.style.height = r.height + "px";
        document.body.append(ghost);
      }
      if (!dragging) return;
      ev.preventDefault();
      ghost.style.transform = "translate(" + (ev.clientX - 30) + "px," + (ev.clientY - 24) + "px)";
      clear();
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const crumb = under && under.closest(".crumb");
      const k = under && under.closest(".keys .key[data-id]");
      target = null; where = null;
      if (crumb && crumb.dataset.page !== UI.page) { target = crumb; where = "into"; crumb.classList.add("drop-into"); }
      else if (k && k !== el) {
        const r = k.getBoundingClientRect();
        const fx = (ev.clientX - r.left) / r.width;
        const tb = S.pages[UI.page].buttons.find(x => x.id === k.dataset.id);
        if (tb && tb.page && tb.page !== b.page && fx > 0.3 && fx < 0.7) where = "into";
        else where = fx < 0.5 ? "before" : "after";
        target = k;
        k.classList.add("drop-" + where);
      }
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      if (ghost) ghost.remove();
      clear();
      if (!dragging) { selectKey(b.id); return; }
      const pg = S.pages[UI.page];
      const from = pg.buttons.findIndex(x => x.id === b.id);
      if (target && where === "into") {
        const destPage = target.dataset.page || pg.buttons.find(x => x.id === target.dataset.id).page;
        if (destPage && destPage !== UI.page && !(b.page && isAncestor(b.page, destPage))) {
          pg.buttons.splice(from, 1);
          S.pages[destPage].buttons.push(b);
          toast("Moved “" + b.label + "” into " + S.pages[destPage].name);
        }
      } else if (target) {
        const [item] = pg.buttons.splice(from, 1);
        let to = pg.buttons.findIndex(x => x.id === target.dataset.id);
        if (where === "after") to++;
        pg.buttons.splice(to, 0, item);
      }
      save(); render();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  }
  function isAncestor(pid, maybeChild) {
    if (pid === maybeChild) return true;
    const pg = S.pages[pid];
    return !!pg && pg.buttons.some(b => b.page && isAncestor(b.page, maybeChild));
  }

  /* Drag the corner to stretch */
  function startResize(e, b, el) {
    e.stopPropagation();
    e.preventDefault();
    const grid = el.parentElement;
    const gs = getComputedStyle(grid);
    const gap = parseFloat(gs.columnGap) || 8;
    const colW = (grid.clientWidth - gap * (S.cols - 1)) / S.cols + gap;
    const rowH = (parseFloat(gs.gridAutoRows) || 52) + (parseFloat(gs.rowGap) || 8);
    const sx = e.clientX, sy = e.clientY, w0 = b.w || 1, h0 = b.h || 1;
    const t = e.target;
    t.setPointerCapture(e.pointerId);
    const move = ev => {
      b.w = Math.max(1, Math.min(S.cols, Math.round(w0 + (ev.clientX - sx) / colW)));
      b.h = Math.max(1, Math.min(4, Math.round(h0 + (ev.clientY - sy) / rowH)));
      el.style.gridColumn = "span " + b.w;
      el.style.gridRow = "span " + b.h;
    };
    const up = () => {
      t.removeEventListener("pointermove", move);
      t.removeEventListener("pointerup", up);
      save(); render();
    };
    t.addEventListener("pointermove", move);
    t.addEventListener("pointerup", up);
  }

  function renderEditBar() {
    const pg = S.pages[UI.page];
    const b = pg.buttons.find(x => x.id === UI.selected);
    const tools = h("div", { class: "edit-tools" },
      h("button", { class: "btn btn-accent", onclick: openPicker }, "+ Add button"),
      h("button", { class: "btn", onclick: addFolder }, "+ Add zoom button"),
      h("span", { class: "stepper" }, "Columns",
        h("button", { class: "btn btn-small", "aria-label": "Fewer columns", onclick: () => { S.cols = Math.max(3, S.cols - 1); save(); render(); } }, "−"),
        h("b", null, String(S.cols)),
        h("button", { class: "btn btn-small", "aria-label": "More columns", onclick: () => { S.cols = Math.min(8, S.cols + 1); save(); render(); } }, "+")),
      h("button", { class: "btn btn-ghost", onclick: confirmReset }, "Reset layout")
    );
    const hint = h("p", { class: "edit-hint" },
      "Drag a button to move it. Drop it on the middle of a zoom button, or on a page name above, to move it inside. Pull the corner to stretch it. Tap a button to rename it.");
    let sel = null;
    if (b) {
      const pages = Object.keys(S.pages).filter(p => p !== UI.page && !(b.page && isAncestor(b.page, p)));
      sel = h("div", { class: "edit-sel" },
        h("label", { for: "sel-label" }, "Label"),
        h("input", { id: "sel-label", value: b.label, oninput: e => { b.label = e.target.value; if (b.page) S.pages[b.page].name = e.target.value; save(); refreshKey(b); } }),
        b.ins != null ? [h("label", { for: "sel-ins" }, "Types"), h("input", { id: "sel-ins", value: b.ins, oninput: e => { b.ins = e.target.value; save(); } })] : null,
        h("span", { class: "stepper" }, "Width",
          h("button", { class: "btn btn-small", "aria-label": "Narrower", onclick: () => { b.w = Math.max(1, (b.w || 1) - 1); save(); render(); } }, "−"),
          h("b", null, String(b.w || 1)),
          h("button", { class: "btn btn-small", "aria-label": "Wider", onclick: () => { b.w = Math.min(S.cols, (b.w || 1) + 1); save(); render(); } }, "+")),
        h("span", { class: "stepper" }, "Height",
          h("button", { class: "btn btn-small", "aria-label": "Shorter", onclick: () => { b.h = Math.max(1, (b.h || 1) - 1); save(); render(); } }, "−"),
          h("b", null, String(b.h || 1)),
          h("button", { class: "btn btn-small", "aria-label": "Taller", onclick: () => { b.h = Math.min(4, (b.h || 1) + 1); save(); render(); } }, "+")),
        pages.length ? h("select", { id: "sel-move", "aria-label": "Move to page", onchange: e => {
          if (!e.target.value) return;
          pg.buttons = pg.buttons.filter(x => x.id !== b.id);
          S.pages[e.target.value].buttons.push(b);
          toast("Moved “" + b.label + "” into " + S.pages[e.target.value].name);
          UI.selected = null; save(); render();
        } }, h("option", { value: "" }, "Move to…"), pages.map(p => h("option", { value: p }, S.pages[p].name))) : null,
        b.page ? h("button", { class: "btn", onclick: () => zoomTo(b.page, "in") }, "Open") : null,
        h("button", { class: "btn btn-danger", onclick: () => removeKey(b.id) }, "Remove")
      );
    }
    return h("div", { class: "edit-bar" }, tools, sel || hint);
  }
  function refreshKey(b) {
    const el = root.querySelector('.key[data-id="' + b.id + '"] .key-label');
    if (el) el.textContent = b.label;
    const crumb = b.page && root.querySelector('.crumb[data-page="' + b.page + '"]');
    if (crumb) crumb.textContent = b.label;
  }

  function addFolder() {
    const pid = "p" + nid();
    let n = 1;
    while (Object.values(S.pages).some(p => p.name === "More " + n)) n++;
    const name = "More " + n;
    S.pages[pid] = { name, buttons: [] };
    const b = K(name, { page: pid, kind: "folder" });
    S.pages[UI.page].buttons.push(b);
    UI.selected = b.id;
    save(); render();
    toast("Added a zoom button. Open it to fill it with more buttons");
  }

  function confirmReset() {
    modal("Reset the calculator?", h("p", null, "Your title, buttons and pages go back to how they started."),
      [["Cancel", null], ["Reset", () => { S = defaultLayout(); UI.page = "main"; UI.selected = null; save(); render(); toast("Layout reset"); }, "btn-danger"]]);
  }

  /* Picker: any entry from the Math Book becomes a button */
  function openPicker() {
    const M = window.MATH;
    const list = h("div", { class: "picker-list" });
    const search = h("input", { id: "picker-search", class: "search", type: "search", placeholder: "Search the Math Book", "aria-label": "Search the Math Book" });
    const fill = () => {
      const q = search.value.trim().toLowerCase();
      list.innerHTML = "";
      M.GROUPS.forEach(g => {
        const items = M.ENTRIES.filter(e => e.group === g.key && (!q || (e.name + " " + e.sym).toLowerCase().includes(q)));
        if (!items.length) return;
        list.append(h("h4", null, g.name));
        items.forEach(e => list.append(h("button", { class: "pick", onclick: () => { addEntry(e); close(); } },
          h("span", { class: "pick-sym" }, e.sym), h("span", { class: "pick-name" }, e.name),
          h("span", { class: "pick-kind" + (e.ins ? " ok" : "") }, e.ins ? "calculates" : "symbol"))));
      });
      if (!list.children.length) list.append(h("p", { class: "muted" }, "Nothing matches “" + search.value + "”."));
    };
    search.addEventListener("input", fill);
    fill();
    const custL = h("input", { id: "cust-label", placeholder: "Label, e.g. ★", "aria-label": "Custom button label" });
    const custI = h("input", { id: "cust-ins", placeholder: "What it types, e.g. 2π", "aria-label": "What the custom button types" });
    const custom = h("form", { class: "custom-row", onsubmit: ev => {
      ev.preventDefault();
      if (!custL.value.trim()) { custL.focus(); return; }
      S.pages[UI.page].buttons.push(K(custL.value.trim(), { ins: custI.value || custL.value, kind: "fn" }));
      save(); render(); close(); toast("Added “" + custL.value.trim() + "”");
    } }, custL, custI, h("button", { class: "btn", type: "submit" }, "Add custom"));
    const close = modal("Add a button to " + S.pages[UI.page].name, h("div", { class: "picker" }, search, list, custom), [["Close", null]], "wide");
    setTimeout(() => search.focus(), 30);
  }

  function addEntry(e, pageId) {
    const label = e.sym.length > 10 ? e.name.split(/[ (]/)[0] : e.sym;
    const pid = pageId || UI.page;
    const kind = e.group === "sym" && /^[+−×÷=]$/.test(e.sym) ? "op" : "fn";
    S.pages[pid].buttons.push(K(label, { ins: e.ins || e.sym, kind, title: e.name, from: e.id }));
    save();
    if (root && root.isConnected) render();
    toast("Added “" + label + "” to " + S.pages[pid].name + (e.ins ? "" : ". It types the symbol; the calculator can’t work it out"));
  }

  /* ---------------- Graph ---------------- */

  function renderGraph() {
    const fxList = h("div", { class: "fx-list" },
      UI.fx.map((f, i) => h("div", { class: "fx-row" + (UI.activeFx === i ? " active" : "") },
        h("span", { class: "fx-swatch", style: "background:" + FX_COLORS[i] }),
        h("label", { for: "fx-" + i, class: "fx-label" }, "y" + subscript(i + 1) + " ="),
        h("input", { id: "fx-" + i, value: f, autocomplete: "off", spellcheck: "false", placeholder: i === 0 ? "e.g. x² − 2" : "add another",
          onfocus: () => { UI.activeFx = i; root.querySelectorAll(".fx-row").forEach((r, j) => r.classList.toggle("active", j === i)); },
          oninput: e => { UI.fx[i] = e.target.value; drawGraph(); } }),
        h("span", { class: "fx-err", id: "fx-err-" + i })
      )));
    const canvas = h("canvas", { id: "graph", class: "graph", "aria-label": "Graph of the functions" });
    const tools = h("div", { class: "graph-tools" },
      h("button", { class: "btn btn-small", "aria-label": "Zoom in", onclick: () => { UI.view.scale *= 1.5; drawGraph(); } }, "+"),
      h("button", { class: "btn btn-small", "aria-label": "Zoom out", onclick: () => { UI.view.scale /= 1.5; drawGraph(); } }, "−"),
      h("button", { class: "btn btn-small", onclick: () => { UI.view = { cx: 0, cy: 0, scale: 40 }; drawGraph(); } }, "Reset view"),
      h("span", { class: "trace", id: "trace" }, "Drag to move · scroll or +/− to zoom"));
    const wrap = h("div", { class: "graph-wrap" }, canvas, tools);
    setupCanvas(canvas);
    return h("div", { class: "screen graph-screen" }, wrap, fxList);
  }
  const subscript = n => String(n).replace(/\d/g, d => "₀₁₂₃₄₅₆₇₈₉"[d]);

  function setupCanvas(cv) {
    let drag = null;
    cv.addEventListener("pointerdown", e => { drag = { x: e.clientX, y: e.clientY, cx: UI.view.cx, cy: UI.view.cy }; cv.setPointerCapture(e.pointerId); });
    cv.addEventListener("pointermove", e => {
      if (drag) {
        UI.view.cx = drag.cx - (e.clientX - drag.x) / UI.view.scale;
        UI.view.cy = drag.cy + (e.clientY - drag.y) / UI.view.scale;
        drawGraph();
      } else {
        const r = cv.getBoundingClientRect();
        UI.trace = e.clientX - r.left;
        drawGraph();
      }
    });
    cv.addEventListener("pointerup", () => { drag = null; });
    cv.addEventListener("pointerleave", () => { UI.trace = null; drawGraph(); });
    cv.addEventListener("wheel", e => {
      e.preventDefault();
      const r = cv.getBoundingClientRect();
      const mx = e.clientX - r.left, my = e.clientY - r.top;
      const v = UI.view;
      const wx = v.cx + (mx - r.width / 2) / v.scale, wy = v.cy - (my - r.height / 2) / v.scale;
      v.scale *= e.deltaY < 0 ? 1.15 : 1 / 1.15;
      v.scale = Math.max(0.0005, Math.min(1e6, v.scale));
      v.cx = wx - (mx - r.width / 2) / v.scale;
      v.cy = wy + (my - r.height / 2) / v.scale;
      drawGraph();
    }, { passive: false });
  }

  function niceStep(px) {
    const raw = 80 / px;
    const p = Math.pow(10, Math.floor(Math.log10(raw)));
    const m = raw / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  }

  let rafId = 0;
  function drawGraph() {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(drawNow);
  }
  function drawNow() {
    const cv = document.getElementById("graph");
    if (!cv) return;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (!W || !H) return;
    cv.width = W * dpr; cv.height = H * dpr;
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const col = n => cs.getPropertyValue(n).trim();
    const v = UI.view;
    const X = wx => W / 2 + (wx - v.cx) * v.scale;
    const Y = wy => H / 2 - (wy - v.cy) * v.scale;
    ctx.fillStyle = col("--paper");
    ctx.fillRect(0, 0, W, H);

    const step = niceStep(v.scale);
    const x0 = v.cx - W / 2 / v.scale, x1 = v.cx + W / 2 / v.scale;
    const y0 = v.cy - H / 2 / v.scale, y1 = v.cy + H / 2 / v.scale;
    // minor grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = col("--grid");
    ctx.beginPath();
    for (let gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step) { const px = Math.round(X(gx)) + 0.5; ctx.moveTo(px, 0); ctx.lineTo(px, H); }
    for (let gy = Math.ceil(y0 / step) * step; gy <= y1; gy += step) { const py = Math.round(Y(gy)) + 0.5; ctx.moveTo(0, py); ctx.lineTo(W, py); }
    ctx.stroke();
    // axes
    ctx.strokeStyle = col("--ink-soft");
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const ax = Math.round(X(0)) + 0.5, ay = Math.round(Y(0)) + 0.5;
    ctx.moveTo(0, ay); ctx.lineTo(W, ay); ctx.moveTo(ax, 0); ctx.lineTo(ax, H);
    ctx.stroke();
    // labels
    ctx.fillStyle = col("--muted");
    ctx.font = "11px " + (col("--font-mono") || "monospace");
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    const lab = n => fmt(parseFloat(n.toPrecision(10)));
    const ly = Math.min(Math.max(ay + 4, 4), H - 16);
    for (let gx = Math.ceil(x0 / step) * step; gx <= x1; gx += step) {
      if (Math.abs(gx) < step / 2) continue;
      ctx.fillText(lab(gx), X(gx), ly);
    }
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    const lx = Math.min(Math.max(ax - 5, 30), W - 4);
    for (let gy = Math.ceil(y0 / step) * step; gy <= y1; gy += step) {
      if (Math.abs(gy) < step / 2) continue;
      ctx.fillText(lab(gy), lx, Y(gy));
    }

    const traceVals = [];
    UI.fx.forEach((src, i) => {
      const errEl = document.getElementById("fx-err-" + i);
      if (errEl) errEl.textContent = "";
      const s = src.replace(/^\s*y\s*=\s*/, "").trim();
      if (!s) return;
      let fn;
      try { fn = compile(s); fn({ x: 1.2345, deg: S.deg, Ans: UI.ans, graph: true }); }
      catch (err) { if (errEl) errEl.textContent = err.message; return; }
      const color = col(FX_COLORS[i].slice(4, -1));
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.beginPath();
      let pen = false, prevY = null;
      for (let px = 0; px <= W; px += 1) {
        const wx = v.cx + (px - W / 2) / v.scale;
        let wy;
        try { wy = fn({ x: wx, deg: S.deg, Ans: UI.ans, graph: true }); } catch (e) { wy = NaN; }
        const py = Y(wy);
        if (!isFinite(py) || Math.abs(py) > H * 50) { pen = false; prevY = null; continue; }
        if (pen && prevY !== null && Math.abs(py - prevY) > H * 1.5) pen = false;
        if (pen) ctx.lineTo(px, py); else { ctx.moveTo(px, py); pen = true; }
        prevY = py;
      }
      ctx.stroke();
      if (UI.trace != null) {
        const wx = v.cx + (UI.trace - W / 2) / v.scale;
        let wy;
        try { wy = fn({ x: wx, deg: S.deg, Ans: UI.ans, graph: true }); } catch (e) { wy = NaN; }
        if (isFinite(wy)) {
          ctx.fillStyle = color;
          ctx.beginPath(); ctx.arc(UI.trace, Y(wy), 4.5, 0, Math.PI * 2); ctx.fill();
          traceVals.push("y" + subscript(i + 1) + " = " + fmt(parseFloat(wy.toPrecision(5))));
        }
      }
    });
    const tr = document.getElementById("trace");
    if (tr) {
      if (UI.trace != null) {
        const wx = v.cx + (UI.trace - W / 2) / v.scale;
        tr.textContent = "x = " + fmt(parseFloat(wx.toPrecision(5))) + (traceVals.length ? "   " + traceVals.join("   ") : "");
      } else tr.textContent = "Drag to move · scroll or +/− to zoom";
    }
  }
  window.addEventListener("resize", () => { if (UI.mode === "graph") drawGraph(); });

  /* ---------------- Small shared UI helpers ---------------- */

  function toast(msg) {
    let t = document.getElementById("toast");
    if (!t) { t = h("div", { id: "toast", class: "toast", role: "status" }); document.body.append(t); }
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function modal(title, body, actions, size) {
    const back = h("div", { class: "modal-back", onclick: e => { if (e.target === back) close(); } });
    const close = () => { back.remove(); document.removeEventListener("keydown", esc); };
    const esc = e => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", esc);
    back.append(h("div", { class: "modal" + (size ? " modal-" + size : ""), role: "dialog", "aria-modal": "true", "aria-label": title },
      h("h3", null, title), body,
      h("div", { class: "modal-actions" }, (actions || []).map(([label, fn, cls]) =>
        h("button", { class: "btn " + (cls || ""), onclick: () => { close(); if (fn) fn(); } }, label)))));
    document.body.append(back);
    return close;
  }

  window.Calc = { mount, evaluate, compile, fmt, addEntry, toast, h, modal, gcd };
})();
