/* The Math Tree and code search (beta). */
(function () {
  "use strict";
  const M = window.MATH;
  const { h } = window.Calc;
  const hid = id => id.replace(/_/g, "-");

  /* ---------------- Code search ----------------
   * <oN> opposite of N     <rN> repeated N
   * <sN> similar to N      <ON> order of N (N, then N−1, … down to 1)
   * N is a math symbol or another code.
   */
  const OPS = {
    o: { word: "Opposite of", map: {
      add: "sub", sub: "add", mul: "div", div: "mul", pow: "nroot", nroot: "pow", sq: "sqrt", sqrt: "sq", cube: "cbrt", cbrt: "cube",
      exponential: "ln", ln: "exponential", log: "pow", eq: "neq", neq: "eq", lt: "gt", gt: "lt", le: "ge", ge: "le",
      union: "inter", inter: "union", and: "or", or: "and", elem: "notelem", notelem: "elem", forall: "exists", exists: "forall",
      integral: "deriv", deriv: "integral", sigma: "delta", delta: "sigma", muchless: "muchgreater", muchgreater: "muchless",
      floorsym: "ceilsym", ceilsym: "floorsym", floor: "ceil", ceil: "floor", sin: "arcsin", arcsin: "sin", cos: "arccos", arccos: "cos",
      tan: "arctan", arctan: "tan", pm: "mp", mp: "pm", subset: "superset", superset: "subset", implies: "leftarrow", leftarrow: "implies",
      negation: "negation", truesym: "not", inf: "zero", zero: "inf", proper_subset: "not_subset"
    } },
    r: { word: "Repeated", map: {
      add: "mul", mul: "pow", pow: "tetration", tetration: "pentation", pentation: "hyperoperation", sub: "div", div: "log",
      deriv: "deriv2", integral: "double_int", double_int: "triple_int", successor: "add", union: "bigunion", inter: "biginter",
      sigma: "double_int", forward_diff: "deriv2"
    } },
    s: { word: "Similar to", map: {
      add: "sigma", mul: "prodsym", sigma: "integral", integral: "sigma", prodsym: "mul", sub: "delta", delta: "forward_diff",
      div: "slash", slash: "div", eq: "equiv", equiv: "eq", approx: "eq", lt: "le", gt: "ge", le: "lt", ge: "gt",
      union: "or", inter: "and", or: "union", and: "inter", sqrt: "cbrt", cbrt: "sqrt", dot: "mul", pow: "exponential",
      exponential: "pow", fact: "gamma", gamma: "fact", congruent: "similar", similar: "congruent", nabla: "partial", partial: "deriv",
      deriv: "partial", pi: "tau", tau: "pi", pct: "permille", permille: "pct", subset: "proper_subset", proper_subset: "subset",
      sq: "cube", cube: "sq", elem: "subset", neq: "notelem", inf: "aleph", aleph: "inf", tetration: "uparrow"
    } },
    O: { word: "Order of", map: { add: "triangular", mul: "fact", pow: "exp_factorial", fact: "superfactorial" } }
  };
  const OP_NOTE = {
    o: "the operation that undoes it, or the one that points the other way",
    r: "do it again and again",
    s: "something that works in a similar way",
    O: "use it on n, n − 1, n − 2, … all the way down to 1, in order"
  };

  const ALIAS = {
    "+": "add", "-": "sub", "−": "sub", "–": "sub", "*": "mul", "×": "mul", "x": "mul", "X": "mul", "·": "mul",
    "/": "div", "÷": "div", "^": "pow", "**": "pow", "√": "sqrt", "∛": "cbrt", "!": "fact", "Σ": "sigma", "∑": "sigma",
    "Π": "prodsym", "∏": "prodsym", "∫": "integral", "d/dx": "deriv", "d": "deriv", "∂": "partial", "∇": "nabla",
    "=": "eq", "≠": "neq", "≤": "le", "≥": "ge", "∪": "union", "∩": "inter", "∧": "and", "∨": "or", "∈": "elem", "∉": "notelem",
    "∀": "forall", "∃": "exists", "⌊⌋": "floorsym", "⌈⌉": "ceilsym", "%": "pct", "±": "pm", "∓": "mp", "²": "sq", "³": "cube",
    "Δ": "delta", "≈": "approx", "≡": "equiv", "⊆": "subset", "⊇": "superset", "⊂": "proper_subset", "π": "pi", "τ": "tau",
    "¬": "not", "↑↑": "tetration", "∬": "double_int", "∭": "triple_int", "≪": "muchless", "≫": "muchgreater", "∞": "inf",
    "0": "zero", "⇒": "implies", "⇐": "leftarrow", "∘": "compose", "⊤": "truesym", "ⁿ√": "nroot", "S": "successor"
  };

  function symbolToEntry(raw) {
    const s = raw.trim();
    if (!s) throw new Error("A code needs a symbol inside, like <o+>");
    if (ALIAS[s]) return M.BY_ID[ALIAS[s]];
    const pref = ["sym", "op", "fn", "nt"];
    const rank = e => { const i = pref.indexOf(e.group); return i < 0 ? 99 : i; };
    const hits = M.ENTRIES.filter(e => e.sym === s).sort((a, b) => rank(a) - rank(b));
    if (hits.length) return hits[0];
    if (/^[A-Za-z][A-Za-z\s]{2,}$/.test(s)) throw new Error("Code search only finds math symbols. “" + s + "” is a word; use the main search for words.");
    throw new Error("“" + s + "” isn’t a symbol in the Math Book yet");
  }

  // Parse into { op, inner } or { sym }.
  function parseCode(src) {
    let i = 0;
    const s = src.trim();
    function node() {
      while (s[i] === " ") i++;
      if (s[i] !== "<") {
        // a bare symbol runs until the closing '>' (or the end at top level)
        let j = i;
        while (j < s.length && s[j] !== ">" && s[j] !== "<") j++;
        const sym = s.slice(i, j);
        i = j;
        return { sym };
      }
      i++;
      while (s[i] === " ") i++;
      const op = s[i];
      if (!OPS[op]) throw new Error(op ? "“" + op + "” isn’t a code letter. Use o, r, s or O." : "The code stops after “<”");
      i++;
      const inner = node();
      while (s[i] === " ") i++;
      if (s[i] !== ">") throw new Error("A code is missing its closing “>”");
      i++;
      return { op, inner };
    }
    const tree = node();
    if (s.slice(i).trim()) throw new Error("There is extra text after the code: “" + s.slice(i).trim() + "”");
    return tree;
  }

  function resolve(tree, trail) {
    if (tree.sym != null) {
      const e = symbolToEntry(tree.sym);
      trail.push({ text: "Start with " + e.sym, e });
      return e;
    }
    const base = resolve(tree.inner, trail);
    const op = OPS[tree.op];
    const id = op.map[base.id];
    const e = id && M.BY_ID[id];
    if (!e) throw new Error("Nothing found yet for " + op.word.toLowerCase() + " " + base.sym + " (" + base.name + ").");
    trail.push({ text: op.word + " " + base.sym + " → " + e.sym, e, op: tree.op });
    return e;
  }

  function runCode(src) {
    const s = src.trim();
    if (!s) return null;
    if (!s.startsWith("<")) {
      // plain symbol search, symbols only
      const e = symbolToEntry(s);
      return { e, trail: [{ text: "Symbol " + s, e }] };
    }
    const trail = [];
    const e = resolve(parseCode(s), trail);
    return { e, trail };
  }

  function codeSearch(opts) {
    const input = h("input", { id: (opts && opts.id) || "code-search", class: "search code-input", placeholder: "Type a code, e.g. <s<r+>>",
      autocomplete: "off", spellcheck: "false", autocapitalize: "off", "aria-label": "Code search" });
    const out = h("div", { class: "code-out", "aria-live": "polite" });
    const run = () => {
      out.innerHTML = "";
      let r;
      try { r = runCode(input.value); }
      catch (err) { out.append(h("p", { class: "code-err" }, err.message)); return; }
      if (!r) return;
      const e = r.e;
      out.append(h("a", { class: "code-hit g-" + e.group, href: "#entry-" + hid(e.id) },
        h("span", { class: "code-hit-sym" }, e.sym),
        h("span", { class: "code-hit-body" }, h("b", null, e.name), h("span", null, e.text.slice(0, 140) + (e.text.length > 140 ? "…" : ""))),
        h("span", { class: "code-hit-go", html: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>' })));
      if (r.trail.length > 1) out.append(h("ol", { class: "code-trail" }, r.trail.map(t => h("li", null, t.text,
        t.op ? h("small", null, " (" + OP_NOTE[t.op] + ")") : null))));
    };
    input.addEventListener("input", run);
    const examples = ["<o+>", "<r+>", "<s<r+>>", "<O<r+>>", "<r<r+>>", "<o<r<r+>>>", "<s<s+>>"];
    const ex = h("div", { class: "code-examples" }, h("span", null, "Try:"),
      examples.map(c => h("button", { class: "code-chip", type: "button", onclick: () => { input.value = c; run(); input.focus(); } }, c)));
    const help = h("details", { class: "code-help" },
      h("summary", null, "How codes work"),
      h("dl", null,
        h("dt", null, "<oN>"), h("dd", null, "Opposite of N. ", h("code", null, "<o+>"), " is −."),
        h("dt", null, "<rN>"), h("dd", null, "Repeated N. ", h("code", null, "<r+>"), " is × because multiplication is repeated addition."),
        h("dt", null, "<sN>"), h("dd", null, "Similar to N. ", h("code", null, "<s<r+>>"), " is Π, the product of many things."),
        h("dt", null, "<ON>"), h("dd", null, "Order of N (capital O). ", h("code", null, "<O<r+>>"), " is ! because 3! = 3 × 2 × 1, in order.")),
      h("p", null, "N can be a symbol such as + × ÷ ^ ! Σ ∫ √, or another code inside it. You can type * for × and / for ÷. Only math symbols can be searched here."));
    const box = h("section", { class: "code-search" },
      h("div", { class: "code-label" }, h("label", { for: input.id }, "Code search"), h("span", { class: "beta" }, "Beta")),
      input, ex, out, help);
    if (opts && opts.value) { input.value = opts.value; run(); }
    return box;
  }

  /* ---------------- The Math Tree ---------------- */

  const UNIT = 140, LEVEL = 136, NODE_W = 126, NODE_H = 88;
  const state = { open: null, zoom: null, sel: "0" };

  function initOpen() {
    // Start with + open, and −, × and Σ open below it.
    state.open = new Set(["0"]);
    M.TREE[2].forEach((c, i) => { if (["sub", "mul", "sigma"].includes(c[0])) state.open.add("0." + i); });
  }
  function allPaths(fn) {
    const walk = (n, path) => { fn(n, path); n[2].forEach((c, i) => walk(c, path + "." + i)); };
    walk(M.TREE, "0");
  }

  function layout() {
    const nodes = [], edges = [];
    let leaf = 0, maxDepth = 0;
    const place = (n, path, depth) => {
      maxDepth = Math.max(maxDepth, depth);
      const open = state.open.has(path) && n[2].length;
      let x;
      if (open) {
        const kids = n[2].map((c, i) => place(c, path + "." + i, depth + 1));
        x = (kids[0].x + kids[kids.length - 1].x) / 2;
        kids.forEach(k => edges.push({ from: null, to: k, parentPath: path }));
      } else {
        x = leaf * UNIT;
        leaf++;
      }
      const node = { n, path, depth, x, y: depth * LEVEL, open };
      nodes.push(node);
      edges.filter(e => e.parentPath === path && !e.from).forEach(e => { e.from = node; });
      return node;
    };
    place(M.TREE, "0", 0);
    return { nodes, edges, width: Math.max(1, leaf) * UNIT, height: maxDepth * LEVEL + NODE_H + 40 };
  }

  function render(view) {
    if (!state.open) initOpen();
    const total = (() => { let c = 0; allPaths(() => c++); return c; })();
    const scroll = h("div", { class: "tree-scroll", tabindex: "0", "aria-label": "Math tree. Scroll to see more." });
    const detail = h("div", { class: "tree-detail", "aria-live": "polite" });
    const draw = () => {
      const L = layout();
      if (state.zoom == null) state.zoom = Math.max(0.62, Math.min(1, ((scroll.clientWidth || 1000) - 50) / L.width));
      const z = state.zoom;
      const pad = 24;
      const W = L.width * z + pad * 2, H = L.height * z + pad;
      const canvas = h("div", { class: "tree-canvas", style: "width:" + W + "px;height:" + H + "px" });
      const cx = n => pad + (n.x + (UNIT - NODE_W) / 2 + NODE_W / 2) * z;
      let paths = "";
      L.edges.forEach(e => {
        const x1 = cx(e.from), y1 = (e.from.y + NODE_H) * z + 14, x2 = cx(e.to), y2 = e.to.y * z + 2;
        const my = (y1 + y2) / 2;
        paths += '<path d="M' + x1 + " " + y1 + " C" + x1 + " " + my + " " + x2 + " " + my + " " + x2 + " " + y2 + '"/>';
      });
      canvas.append(h("div", { class: "tree-lines", html: '<svg width="' + W + '" height="' + H + '" aria-hidden="true">' + paths + "</svg>" }));
      L.nodes.forEach(nd => {
        const [id, code, kids] = nd.n;
        const e = M.BY_ID[id];
        const left = cx(nd) - NODE_W * z / 2, top = nd.y * z;
        const btn = h("button", { class: "tnode g-" + e.group + (state.sel === nd.path ? " sel" : "") + (nd.depth === 0 ? " root" : ""),
          style: "left:" + left + "px;top:" + top + "px;width:" + NODE_W * z + "px;height:" + NODE_H * z + "px;font-size:" + (z * 1.12) + "em",
          "aria-label": e.name + (code ? ", code " + code : ""),
          onclick: () => { state.sel = nd.path; draw(); showDetail(); } },
          h("span", { class: "tn-sym" }, e.sym.length > 7 ? e.sym.slice(0, 7) + "…" : e.sym),
          h("span", { class: "tn-name" }, e.name.replace(/ \(.*\)$/, "")),
          code ? h("span", { class: "tn-code" }, code) : null);
        canvas.append(btn);
        if (kids.length) {
          canvas.append(h("button", { class: "tn-toggle", style: "left:" + (cx(nd) - 14) + "px;top:" + ((nd.y + NODE_H) * z + 1) + "px",
            "aria-label": (nd.open ? "Hide" : "Show") + " the " + kids.length + " below " + e.name,
            onclick: () => { if (state.open.has(nd.path)) state.open.delete(nd.path); else state.open.add(nd.path); draw(); } },
            nd.open ? "−" : "+" + kids.length));
        }
      });
      const keep = scroll.firstChild ? { l: scroll.scrollLeft, t: scroll.scrollTop } : null;
      scroll.innerHTML = "";
      scroll.append(canvas);
      if (keep) { scroll.scrollLeft = keep.l; scroll.scrollTop = keep.t; }
      else requestAnimationFrame(() => {
        const root = L.nodes.find(n => n.depth === 0);
        scroll.scrollLeft = W <= scroll.clientWidth + 4 ? 0 : cx(root) - scroll.clientWidth / 2;
      });
    };
    const findPath = p => { let n = M.TREE; p.split(".").slice(1).forEach(i => { n = n[2][+i]; }); return n; };
    const showDetail = () => {
      const n = findPath(state.sel), e = M.BY_ID[n[0]];
      const parentPath = state.sel.split(".").slice(0, -1).join(".");
      const parent = parentPath ? M.BY_ID[findPath(parentPath)[0]] : null;
      const meth = M.METHODS[e.id];
      detail.innerHTML = "";
      detail.append(h("div", { class: "td-sym g-" + e.group }, e.sym),
        h("div", { class: "td-body" },
          h("h2", null, e.name),
          n[1] ? h("p", { class: "td-code" }, "Code: ", h("code", null, n[1])) : null,
          parent ? h("p", { class: "muted" }, "Comes from ", h("b", null, parent.name), " above it.") : h("p", { class: "muted" }, "The top of the tree. Everything below grows out of adding."),
          h("p", null, e.text),
          h("div", { class: "entry-actions" },
            h("a", { class: "btn btn-accent", href: "#entry-" + hid(e.id) }, "Open in the Math Index"),
            meth ? h("a", { class: "btn", href: "#methods-" + hid(e.id) }, "Methods") : null)));
    };
    const tools = h("div", { class: "tree-tools" },
      h("button", { class: "btn btn-small", onclick: () => { allPaths((n, p) => n[2].length && state.open.add(p)); draw(); } }, "Show everything"),
      h("button", { class: "btn btn-small", onclick: () => { initOpen(); state.zoom = null; scroll.innerHTML = ""; draw(); } }, "Back to start"),
      h("span", { class: "stepper" }, "Zoom",
        h("button", { class: "btn btn-small", "aria-label": "Zoom out", onclick: () => { state.zoom = Math.max(0.5, +(state.zoom - 0.15).toFixed(2)); draw(); } }, "−"),
        h("button", { class: "btn btn-small", "aria-label": "Zoom in", onclick: () => { state.zoom = Math.min(1.6, +(state.zoom + 0.15).toFixed(2)); draw(); } }, "+")),
      h("span", { class: "muted tree-count" }, total + " entries in the tree"));
    view.append(
      h("header", { class: "page-head" },
        h("p", { class: "eyebrow" }, "Visualiser"),
        h("h1", null, "The Math Tree"),
        h("p", { class: "lede" }, "Everything starts with + at the top. Undo it and you get −, repeat it and you get ×, and so on down. Press a + under a box to open more, and press a box to read about it.")),
      tools, scroll, detail,
      codeSearch({ id: "tree-code" }));
    state.zoom = null;
    draw();
    showDetail();
  }

  window.MathTree = { render, codeSearch, runCode };
})();
