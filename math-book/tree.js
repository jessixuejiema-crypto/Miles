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

  // Build the tree from the outline in tree-data.js.
  const norm = t => t.toLowerCase().replace(/\(.*?\)/g, "").replace(/[’']/g, "").replace(/^the /, "").replace(/[^a-z0-9]+/g, " ").trim();
  const BY_NAME = {};
  M.ENTRIES.forEach(e => {
    [e.name, e.name.split(" (")[0]].forEach(n => { const k = norm(n); if (k && !BY_NAME[k]) BY_NAME[k] = e.id; });
  });
  function buildTree(src) {
    const lines = src.split("\n").filter(l => l.trim());
    const root = { kids: [] }, stack = [{ depth: -1, node: root }];
    const used = new Set();
    const groupLines = [];
    lines.forEach(line => {
      const depth = (line.match(/^ */)[0].length) / 2;
      const t = line.trim();
      while (stack[stack.length - 1].depth >= depth) stack.pop();
      const parent = stack[stack.length - 1].node;
      if (t.startsWith("@group ")) { groupLines.push({ parent, key: t.slice(7).trim() }); return; }
      const m = t.match(/^(?:«([^»]+)»\s*)?(.*?)(?:\s*\{([a-z0-9_]+)\})?(?:\s*\[([^\]]+)\])?(?:\s+—\s+(.*))?$/);
      let [, sym, label, id, code, desc] = m;
      if (!id) id = BY_NAME[norm(label)];
      if (id && !M.BY_ID[id]) { console.warn("Tree: no entry " + id); id = undefined; }
      if (id) used.add(id);
      const node = { label: label.trim(), id, code: code || "", desc: desc || "", sym: sym || "", kids: [] };
      parent.kids.push(node);
      stack.push({ depth, node });
    });
    // "@group key" adds every entry of that group that isn't already somewhere in the tree.
    groupLines.forEach(({ parent, key }) => {
      M.ENTRIES.filter(e => e.group === key && !used.has(e.id)).forEach(e => {
        used.add(e.id);
        parent.kids.push({ label: e.name.split(" (")[0], id: e.id, code: "", desc: "", sym: "", kids: [] });
      });
    });
    return root.kids[0];
  }
  const TREE = buildTree(window.MATH_TREE_OUTLINE || "Addition {add}");
  const info = n => {
    const e = n.id ? M.BY_ID[n.id] : null;
    return { e, sym: n.sym || (e ? e.sym : n.label.charAt(0)), name: n.label, group: e ? e.group : "tree", text: e ? e.text : n.desc };
  };
  const ALL = [];
  (function walk(n, path, parent) { n.path = path; n.parent = parent; ALL.push(n); n.kids.forEach((c, i) => walk(c, path + "." + i, n)); })(TREE, "0", null);

  // Box sizes. "Smaller buttons" switches to tiny boxes that show only the symbol.
  let LEVEL, NODE_W, NODE_H, TOGGLE_GAP, GAP;
  const state = { open: null, zoom: null, sel: "0", tiny: false, clump: false };
  function setSize() {
    if (state.tiny) { NODE_W = 32; NODE_H = 30; TOGGLE_GAP = 10; LEVEL = state.clump ? 46 : 60; GAP = state.clump ? 2 : 6; }
    else { NODE_W = 88; NODE_H = 58; TOGGLE_GAP = 12; LEVEL = state.clump ? 80 : 96; GAP = state.clump ? 3 : 12; }
  }
  try {
    state.tiny = localStorage.getItem("mathbook-tree-tiny") === "1";
    state.clump = localStorage.getItem("mathbook-tree-clump") === "1";
  } catch (e) { /* ignore */ }
  setSize();

  function initOpen() { state.open = new Set(["0"]); }
  const nodeAt = p => ALL.find(n => n.path === p) || TREE;

  // Tidy layout: each subtree keeps a left/right outline per row, and the next
  // sibling slides in until it is GAP away from the outline at every row.
  function layout() {
    const nodes = [], edges = [];
    let maxDepth = 0;
    const build = (n, depth) => {
      maxDepth = Math.max(maxDepth, depth);
      const open = state.open.has(n.path) && n.kids.length > 0;
      const me = { n, depth, y: depth * LEVEL, open, kids: [], off: 0 };
      const half = NODE_W / 2;
      if (!open) { me.contour = [[-half, half]]; return me; }
      let acc = null;
      n.kids.forEach(c => {
        const k = build(c, depth + 1);
        if (!acc) { k.off = 0; acc = k.contour.map(r => r.slice()); }
        else {
          let shift = -Infinity;
          for (let d = 0; d < Math.min(acc.length, k.contour.length); d++) shift = Math.max(shift, acc[d][1] - k.contour[d][0] + GAP);
          k.off = shift;
          k.contour.forEach((r, d) => {
            const L = r[0] + shift, R = r[1] + shift;
            if (d < acc.length) { acc[d][0] = Math.min(acc[d][0], L); acc[d][1] = Math.max(acc[d][1], R); }
            else acc.push([L, R]);
          });
        }
        me.kids.push(k);
      });
      const mid = (me.kids[0].off + me.kids[me.kids.length - 1].off) / 2;
      me.kids.forEach(k => { k.off -= mid; });
      me.contour = [[-half, half]].concat(acc.map(r => [r[0] - mid, r[1] - mid]));
      return me;
    };
    const root = build(TREE, 0);
    let minX = Infinity, maxX = -Infinity;
    const place = (me, x) => {
      me.x = x;
      minX = Math.min(minX, x - NODE_W / 2); maxX = Math.max(maxX, x + NODE_W / 2);
      nodes.push(me);
      me.kids.forEach(k => { edges.push({ from: me, to: k }); place(k, x + k.off); });
    };
    place(root, 0);
    nodes.forEach(nd => { nd.x -= minX; });
    return { nodes, edges, width: maxX - minX, height: maxDepth * LEVEL + NODE_H + 30 };
  }

  function render(view) {
    if (!state.open) initOpen();
    const scroll = h("div", { class: "tree-scroll", tabindex: "0", "aria-label": "Math tree. Scroll to see more." });
    const detail = h("div", { class: "tree-detail", "aria-live": "polite" });
    let centerOn = null;
    const draw = () => {
      const L = layout();
      if (state.zoom == null) state.zoom = Math.max(0.9, Math.min(1, ((scroll.clientWidth || 1000) - 40) / L.width));
      const z = state.zoom;
      const pad = 20;
      const W = L.width * z + pad * 2, H = L.height * z + pad;
      const canvas = h("div", { class: "tree-canvas", style: "width:" + W + "px;height:" + H + "px" });
      const cx = n => pad + n.x * z;
      let paths = "";
      L.edges.forEach(e => {
        const x1 = cx(e.from), y1 = (e.from.y + NODE_H) * z + TOGGLE_GAP, x2 = cx(e.to), y2 = e.to.y * z + 1;
        const my = (y1 + y2) / 2;
        paths += '<path d="M' + x1.toFixed(1) + " " + y1.toFixed(1) + " C" + x1.toFixed(1) + " " + my.toFixed(1) + " " + x2.toFixed(1) + " " + my.toFixed(1) + " " + x2.toFixed(1) + " " + y2.toFixed(1) + '"/>';
      });
      canvas.append(h("div", { class: "tree-lines", html: '<svg width="' + W + '" height="' + H + '" aria-hidden="true">' + paths + "</svg>" }));
      const frag = document.createDocumentFragment();
      let selBox = null;
      L.nodes.forEach(nd => {
        const n = nd.n, I = info(n);
        const left = cx(nd) - NODE_W * z / 2, top = nd.y * z;
        const max = state.tiny ? 3 : 7;
        const sym = [...I.sym].length > max ? [...I.sym].slice(0, max).join("") + (state.tiny ? "" : "…") : I.sym;
        const btn = h("button", { class: "tnode g-" + I.group + (state.sel === n.path ? " sel" : "") + (nd.depth === 0 ? " root" : "") + (I.e ? "" : " plain") + (state.tiny ? " tiny" : ""),
          style: "left:" + left.toFixed(1) + "px;top:" + top.toFixed(1) + "px;width:" + (NODE_W * z).toFixed(1) + "px;height:" + (NODE_H * z).toFixed(1) + "px;font-size:" + (z * 0.92).toFixed(3) + "em",
          title: I.name, "aria-label": I.name + (n.code ? ", code " + n.code : ""),
          onclick: () => { state.sel = n.path; draw(); showDetail(); } },
          h("span", { class: "tn-sym" }, sym),
          state.tiny ? null : h("span", { class: "tn-name" }, I.name),
          n.code && !state.tiny ? h("span", { class: "tn-code" }, n.code) : null);
        if (state.sel === n.path) selBox = { x: cx(nd), y: top };
        frag.append(btn);
        if (n.kids.length) {
          const tw = state.tiny ? 8 : 13;
          frag.append(h("button", { class: "tn-toggle" + (state.tiny ? " tiny" : ""), style: "left:" + (cx(nd) - tw).toFixed(1) + "px;top:" + ((nd.y + NODE_H) * z + 1).toFixed(1) + "px",
            "aria-label": (nd.open ? "Hide" : "Show") + " the " + n.kids.length + " below " + I.name,
            onclick: () => { if (state.open.has(n.path)) state.open.delete(n.path); else state.open.add(n.path); draw(); } },
            nd.open ? "−" : state.tiny ? "+" : "+" + n.kids.length));
        }
      });
      canvas.append(frag);
      const keep = scroll.firstChild ? { l: scroll.scrollLeft, t: scroll.scrollTop } : null;
      scroll.innerHTML = "";
      scroll.append(canvas);
      if (centerOn && selBox) {
        scroll.scrollLeft = selBox.x - scroll.clientWidth / 2;
        scroll.scrollTop = Math.max(0, selBox.y - scroll.clientHeight / 3);
        centerOn = null;
      } else if (keep) { scroll.scrollLeft = keep.l; scroll.scrollTop = keep.t; }
      else requestAnimationFrame(() => {
        const root = L.nodes.find(n => n.depth === 0);
        scroll.scrollLeft = W <= scroll.clientWidth + 4 ? 0 : cx(root) - scroll.clientWidth / 2;
      });
    };
    const showDetail = () => {
      const n = nodeAt(state.sel), I = info(n);
      const meth = I.e && M.METHODS[I.e.id];
      const trail = [];
      for (let p = n.parent; p; p = p.parent) trail.unshift(info(p).name);
      detail.innerHTML = "";
      detail.append(h("div", { class: "td-sym g-" + I.group }, I.sym),
        h("div", { class: "td-body" },
          h("h2", null, I.name),
          n.code ? h("p", { class: "td-code" }, "Code: ", h("code", null, n.code)) : null,
          trail.length ? h("p", { class: "muted td-trail" }, trail.join(" › ") + " › " + I.name) : h("p", { class: "muted" }, "The top of the tree. Everything below grows out of adding."),
          I.text ? h("p", null, I.text) : null,
          n.kids.length ? h("p", { class: "muted" }, n.kids.length + " " + (n.kids.length === 1 ? "box comes" : "boxes come") + " from this one.") : null,
          h("div", { class: "entry-actions" },
            I.e ? h("a", { class: "btn btn-accent", href: "#entry-" + hid(I.e.id) }, "Open in the Math Index") : null,
            meth ? h("a", { class: "btn", href: "#methods-" + hid(I.e.id) }, "Methods") : null,
            n.kids.length ? h("button", { class: "btn", onclick: () => { (function op(x) { if (x.kids.length) { state.open.add(x.path); x.kids.forEach(op); } })(n); centerOn = true; draw(); } }, "Open this whole branch") : null)));
    };
    const reveal = n => {
      for (let p = n.parent; p; p = p.parent) state.open.add(p.path);
      state.sel = n.path; centerOn = true; draw(); showDetail();
    };
    // Find in the tree
    const findBox = h("input", { id: "tree-find", class: "search tree-find", type: "search", placeholder: "Find in the tree: radius, prime, tetration…", "aria-label": "Find in the tree", autocomplete: "off" });
    const hits = h("div", { class: "tree-hits" });
    findBox.addEventListener("input", () => {
      const q = norm(findBox.value);
      hits.innerHTML = "";
      if (!q) return;
      const found = ALL.filter(n => norm(info(n).name).includes(q)).slice(0, 10);
      if (!found.length) { hits.append(h("span", { class: "muted" }, "Not in the tree.")); return; }
      found.forEach(n => {
        const I = info(n);
        hits.append(h("button", { class: "code-chip", type: "button", onclick: () => reveal(n) }, I.name + (n.parent ? "  (" + info(n.parent).name + ")" : "")));
      });
    });
    const sizeBtn = h("button", { class: "btn btn-small", "aria-pressed": String(state.tiny), onclick: () => {
      state.tiny = !state.tiny;
      try { localStorage.setItem("mathbook-tree-tiny", state.tiny ? "1" : "0"); } catch (e) { /* ignore */ }
      setSize(); state.zoom = 1; centerOn = true;
      sizeBtn.textContent = state.tiny ? "Bigger buttons" : "Smaller buttons";
      sizeBtn.setAttribute("aria-pressed", String(state.tiny));
      draw();
    } }, state.tiny ? "Bigger buttons" : "Smaller buttons");
    const clumpBtn = h("button", { class: "btn btn-small", "aria-pressed": String(state.clump), onclick: () => {
      state.clump = !state.clump;
      try { localStorage.setItem("mathbook-tree-clump", state.clump ? "1" : "0"); } catch (e) { /* ignore */ }
      setSize(); centerOn = true;
      clumpBtn.textContent = state.clump ? "Spread out" : "Clump together";
      clumpBtn.setAttribute("aria-pressed", String(state.clump));
      draw();
    } }, state.clump ? "Spread out" : "Clump together");
    const tools = h("div", { class: "tree-tools" },
      h("button", { class: "btn btn-small btn-accent", onclick: () => { ALL.forEach(n => n.kids.length && state.open.add(n.path)); draw(); } }, "Show all"),
      sizeBtn,
      clumpBtn,
      h("button", { class: "btn btn-small", onclick: () => { initOpen(); state.zoom = null; state.sel = "0"; scroll.innerHTML = ""; draw(); showDetail(); } }, "Back to start"),
      h("span", { class: "stepper" }, "Zoom",
        h("button", { class: "btn btn-small", "aria-label": "Zoom out", onclick: () => { state.zoom = Math.max(0.4, +(state.zoom - 0.15).toFixed(2)); draw(); } }, "−"),
        h("button", { class: "btn btn-small", "aria-label": "Zoom in", onclick: () => { state.zoom = Math.min(1.8, +(state.zoom + 0.15).toFixed(2)); draw(); } }, "+")),
      h("span", { class: "muted tree-count" }, ALL.length + " boxes in the tree"));
    view.append(
      h("header", { class: "page-head" },
        h("p", { class: "eyebrow" }, "Visualiser"),
        h("h1", null, "The Math Tree"),
        h("p", { class: "lede" }, "Everything starts with + at the top. Undo it and you get −, repeat it and you get ×, and so on down into numbers, geometry, algebra and more. Press a + under a box to open more, and press a box to read about it.")),
      h("div", { class: "tree-findrow" }, findBox, hits),
      tools, scroll, detail,
      codeSearch({ id: "tree-code" }));
    state.zoom = null;
    draw();
    showDetail();
  }

  window.MathTree = { render, codeSearch, runCode, TREE, ALL };
})();
