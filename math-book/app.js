/* The Math Book: routing and pages. */
(function () {
  "use strict";
  const M = window.MATH;
  const { h, toast, fmt } = window.Calc;
  const view = document.getElementById("view");

  const hid = id => id.replace(/_/g, "-");
  const fromHid = {};
  M.ENTRIES.forEach(e => { fromHid[hid(e.id)] = e.id; });
  const groupOf = key => M.GROUPS.find(g => g.key === key);
  const BEGIN_BY_ID = {};
  M.BEGINNER.forEach(b => { BEGIN_BY_ID[b.id] = b; });

  const SEARCH_SVG = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>';

  function methodFor(id) {
    let m = M.METHODS[id];
    if (m && m.ref) return { id: m.ref, m: M.METHODS[m.ref] };
    return m ? { id, m } : null;
  }

  const store = {
    get(k, d) { try { const v = localStorage.getItem("mathbook-" + k); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("mathbook-" + k, v); } catch (e) { /* ignore */ } }
  };

  /* ---------------- Router ---------------- */

  function route() {
    const hash = location.hash.replace(/^#/, "");
    let m;
    document.querySelectorAll(".topnav a").forEach(a => a.classList.remove("on"));
    const mark = name => { const a = document.querySelector('.topnav a[data-nav="' + name + '"]'); if (a) a.classList.add("on"); };
    view.innerHTML = "";
    if (!hash || hash === "book") { mark("book"); renderBook(); }
    else if (hash === "index") { mark("index"); renderIndexAll(); }
    else if ((m = hash.match(/^entry-(.+)$/)) && fromHid[m[1]]) { mark("index"); renderEntry(fromHid[m[1]]); }
    else if ((m = hash.match(/^methods-(.+)$/)) && fromHid[m[1]]) { mark("index"); renderMethods(fromHid[m[1]]); }
    else if (hash === "beginner" || (m = hash.match(/^learn-(.+)$/))) { mark("beginner"); renderBeginner(m ? fromHid[m[1]] : null); }
    else if (hash === "calc") { mark("calc"); renderCalc(); }
    else { mark("book"); renderBook(); }
    if (!(m && hash.startsWith("learn-"))) window.scrollTo(0, 0);
    document.body.classList.toggle("on-calc", hash === "calc");
  }
  window.addEventListener("hashchange", route);

  /* ---------------- The Math Book ---------------- */

  function renderBook() {
    let group = store.get("group", "all");
    const q0 = "";
    const search = h("input", { id: "book-search", class: "search", type: "search", placeholder: "Find anything: prime, ∇, Monty Hall…", "aria-label": "Search the Math Book", value: q0 });
    const chips = h("div", { class: "chips", role: "tablist", "aria-label": "Groups" });
    const body = h("div", { class: "book-body" });

    const drawChips = () => {
      chips.innerHTML = "";
      [{ key: "all", name: "All groups" }].concat(M.GROUPS).forEach(g => {
        chips.append(h("button", { class: "chip g-" + g.key + (group === g.key ? " on" : ""), role: "tab", "aria-selected": group === g.key,
          onclick: () => { group = g.key; store.set("group", g.key); drawChips(); draw(); } }, g.name));
      });
    };
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      body.innerHTML = "";
      let total = 0;
      M.GROUPS.forEach(g => {
        if (group !== "all" && group !== g.key) return;
        const items = M.ENTRIES.filter(e => e.group === g.key && (!q || (e.name + " " + e.sym + " " + e.text).toLowerCase().includes(q)));
        if (!items.length) return;
        total += items.length;
        body.append(h("section", { class: "book-section g-" + g.key },
          h("header", { class: "book-section-head" },
            h("h2", null, g.name), h("span", { class: "count" }, items.length + (items.length === 1 ? " entry" : " entries")),
            h("p", null, g.blurb)),
          h("ol", { class: "book-list" }, items.map(e => h("li", null,
            h("a", { class: "book-name", href: "#entry-" + hid(e.id) }, e.name),
            h("a", { class: "lens", href: "#entry-" + hid(e.id), "aria-label": "Look up " + e.name + " in the Math Index", title: "Open in the Math Index", html: SEARCH_SVG }))))
        ));
      });
      if (!total) body.append(h("p", { class: "empty" }, "Nothing in the book matches “" + search.value + "”. Try a shorter word."));
    };
    search.addEventListener("input", draw);
    drawChips(); draw();

    view.append(
      h("header", { class: "page-head" },
        h("p", { class: "eyebrow" }, M.ENTRIES.length + " entries · " + M.GROUPS.length + " groups"),
        h("h1", null, "The Math Book"),
        h("p", { class: "lede" }, "Every entry is listed here by name. Press the magnifying glass next to one to open it in the Math Index, where you see the symbol and what it means.")),
      h("div", { class: "book-tools" },
        search,
        h("a", { class: "btn btn-accent lens-btn", href: "#index", html: SEARCH_SVG + "<span>Open the Math Index</span>" })),
      h("a", { class: "beginner-card", href: "#beginner" },
        h("span", { class: "bc-sym" }, "1+1"),
        h("span", { class: "bc-text" }, h("b", null, "The Beginner’s Math Book"),
          h("span", null, "Start here: counting, adding, taking away, times and sharing, with pictures."))),
      chips, body
    );
  }

  /* ---------------- The Math Index ---------------- */

  function renderIndexAll() {
    let group = store.get("igroup", "all");
    const chips = h("div", { class: "chips", role: "tablist", "aria-label": "Groups" });
    const grid = h("div", { class: "index-grid" });
    const search = h("input", { id: "index-search", class: "search", type: "search", placeholder: "Search the index", "aria-label": "Search the Math Index" });
    const drawChips = () => {
      chips.innerHTML = "";
      [{ key: "all", name: "All groups" }].concat(M.GROUPS).forEach(g => chips.append(
        h("button", { class: "chip g-" + g.key + (group === g.key ? " on" : ""), role: "tab", "aria-selected": group === g.key,
          onclick: () => { group = g.key; store.set("igroup", g.key); drawChips(); draw(); } }, g.name)));
    };
    const draw = () => {
      const q = search.value.trim().toLowerCase();
      grid.innerHTML = "";
      const items = M.ENTRIES.filter(e => (group === "all" || e.group === group) && (!q || (e.name + " " + e.sym + " " + e.text).toLowerCase().includes(q)));
      items.forEach(e => grid.append(h("a", { class: "index-card g-" + e.group, href: "#entry-" + hid(e.id) },
        h("span", { class: "ic-sym" + (e.sym.length > 6 ? " long" : "") }, e.sym),
        h("span", { class: "ic-name" }, e.name),
        h("span", { class: "ic-text" }, e.text))));
      if (!items.length) grid.append(h("p", { class: "empty" }, "No entries match."));
    };
    search.addEventListener("input", draw);
    drawChips(); draw();
    view.append(
      h("header", { class: "page-head" },
        h("p", { class: "eyebrow" }, "Symbol first, meaning underneath"),
        h("h1", null, "The Math Index"),
        h("p", { class: "lede" }, "Tap a card to open the full page with methods and the things to learn first.")),
      h("div", { class: "book-tools" }, search, h("a", { class: "btn btn-ghost", href: "#book" }, "Back to the Math Book")),
      chips, grid);
  }

  function renderEntry(id) {
    const e = M.BY_ID[id];
    const g = groupOf(e.group);
    const meth = methodFor(id);
    const siblings = M.ENTRIES.filter(x => x.group === e.group);
    const i = siblings.indexOf(e);
    const prev = siblings[i - 1], next = siblings[i + 1];
    const pre = (e.pre || []).map(p => M.BY_ID[p]).filter(Boolean);
    const usedBy = M.ENTRIES.filter(x => (x.pre || []).includes(id)).slice(0, 12);

    view.append(
      h("nav", { class: "trail", "aria-label": "Where you are" },
        h("a", { href: "#book" }, "Math Book"), h("span", null, "›"),
        h("a", { href: "#index" }, "Math Index"), h("span", null, "›"),
        h("span", { class: "chip g-" + e.group + " on static" }, g.name)),
      h("article", { class: "entry g-" + e.group },
        h("div", { class: "entry-top" },
          h("div", { class: "entry-sym" + (e.sym.length > 6 ? " long" : "") }, e.sym),
          meth ? h("a", { class: "btn btn-accent methods-btn", href: "#methods-" + hid(id) }, "Methods") : null),
        h("h1", { class: "entry-name" }, e.name),
        h("div", { class: "entry-text" }, e.text.split("\n").map(p => h("p", null, p))),
        e.ex ? h("p", { class: "entry-ex" }, h("span", null, "Example"), h("code", null, e.ex)) : null,
        pre.length ? h("div", { class: "learn-first" },
          h("p", null, "Learn this first if you don’t know it yet:"),
          h("div", { class: "pre-btns" }, pre.map(p => h("a", { class: "btn pre-btn", href: "#entry-" + hid(p.id) }, p.name)))) : null,
        h("div", { class: "entry-actions" },
          h("button", { class: "btn", onclick: () => window.Calc.addEntry(e, "main") }, "Add to my calculator"),
          h("a", { class: "btn btn-ghost", href: "#calc" }, "Open calculator"),
          BEGIN_BY_ID[id] ? h("a", { class: "btn btn-ghost", href: "#learn-" + hid(id) }, "See it in the Beginner’s Book") : null),
        usedBy.length ? h("div", { class: "used-by" }, h("p", null, "Helps you understand"),
          h("div", { class: "pre-btns" }, usedBy.map(u => h("a", { class: "link-chip", href: "#entry-" + hid(u.id) }, u.name)))) : null
      ),
      h("nav", { class: "pager" },
        prev ? h("a", { href: "#entry-" + hid(prev.id) }, "‹ " + prev.name) : h("span"),
        next ? h("a", { href: "#entry-" + hid(next.id) }, next.name + " ›") : h("span"))
    );
  }

  /* ---------------- Beginner’s Math Book ---------------- */

  const dot = cls => h("span", { class: "d" + (cls ? " " + cls : "") });
  const dots = (n, cls) => h("span", { class: "dots" }, Array.from({ length: n }, () => dot(cls)));
  const op = s => h("span", { class: "vis-op" }, s);

  const VIS = {
    count: () => h("div", { class: "vis" }, [1, 2, 3].map(n => h("span", { class: "counted" }, dot(), h("small", null, String(n))))),
    zero: () => h("div", { class: "vis" }, h("span", { class: "plate" }), op("= 0")),
    add: () => h("div", { class: "vis" }, dots(2), op("+"), dots(3, "b"), op("="), h("span", { class: "dots" }, dot(), dot(), dot("b"), dot("b"), dot("b")), op("5")),
    eq: () => h("div", { class: "vis seesaw" }, h("span", { class: "pan" }, dots(2), op("+"), dots(1)), op("="), h("span", { class: "pan" }, dots(3))),
    sub: () => h("div", { class: "vis" }, h("span", { class: "dots" }, dot(), dot(), dot(), dot("x"), dot("x")), op("→"), dots(3), op("5 − 2 = 3")),
    compare: () => h("div", { class: "vis" }, h("span", { class: "stack" }, dots(5), h("small", null, "5")), op(">"), h("span", { class: "stack" }, dots(2), h("small", null, "2"))),
    mul: () => h("div", { class: "vis" },
      h("span", { class: "grid-dots", style: "--c:3" }, Array.from({ length: 6 }, () => dot())),
      op("2 rows × 3 = 3 + 3 = 6")),
    div: () => h("div", { class: "vis" }, dots(6), op("→"),
      [0, 1, 2].map(() => h("span", { class: "share" }, dots(2)))),
    place: () => h("div", { class: "vis place" },
      [["hundreds", 1, "big"], ["tens", 2, "rod"], ["ones", 3, ""]].map(([nm, n, c]) =>
        h("span", { class: "pv" }, h("span", { class: "pv-blocks" }, Array.from({ length: n }, () => h("span", { class: "blk " + c }))),
          h("b", null, String(n)), h("small", null, nm)))),
    evenodd: () => h("div", { class: "vis" },
      h("span", { class: "pairs" }, [0, 1, 2].map(() => h("span", { class: "pair" }, dot(), dot()))), op("6 even"),
      h("span", { class: "pairs" }, [0, 1, 2].map(() => h("span", { class: "pair" }, dot("b"), dot("b"))), h("span", { class: "pair lone" }, dot("x"))), op("7 odd")),
    numberline: () => {
      const s = h("div", { class: "vis numline" });
      for (let n = -5; n <= 5; n++) s.append(h("span", { class: "tick" + (n === -3 ? " here" : "") + (n === 0 ? " zero" : "") }, h("i"), h("small", null, String(n).replace("-", "−"))));
      return s;
    },
    frac: () => h("div", { class: "vis", html: '<svg viewBox="0 0 100 100" width="96" height="96" role="img" aria-label="A circle cut into four slices with one shaded"><circle cx="50" cy="50" r="44" fill="var(--paper)" stroke="var(--ink)" stroke-width="3"/><path d="M50 50 L50 6 A44 44 0 0 1 94 50 Z" fill="var(--hl)" stroke="var(--ink)" stroke-width="3"/><path d="M50 6 V94 M6 50 H94" stroke="var(--ink)" stroke-width="3"/></svg><span class="vis-op">¼</span>' }),
    decimal: () => h("div", { class: "vis" }, h("span", { class: "bar10" }, Array.from({ length: 10 }, (_, i) => h("i", { class: i < 5 ? "on" : "" }))), op("0.5 = ½")),
    pct: () => h("div", { class: "vis" }, h("span", { class: "hundred" }, Array.from({ length: 100 }, (_, i) => h("i", { class: i < 25 ? "on" : "" }))), op("25%")),
    pow: () => h("div", { class: "vis" }, h("span", { class: "grid-dots", style: "--c:3" }, Array.from({ length: 9 }, () => dot())), op("3² = 3 × 3 = 9")),
    sqrt: () => h("div", { class: "vis" }, h("span", { class: "grid-dots side", style: "--c:3" }, Array.from({ length: 9 }, () => dot("b"))), op("side = 3, so √9 = 3")),
    order: () => h("div", { class: "vis col" }, h("code", null, "(2 + 3) × 4 → 5 × 4 = 20"), h("code", null, "2 + 3 × 4 → 2 + 12 = 14")),
    pi: () => h("div", { class: "vis", html: '<svg viewBox="0 0 220 100" width="220" height="100" role="img" aria-label="A circle with its diameter, and a string as long as the circle unrolled to just over three diameters"><circle cx="50" cy="50" r="30" fill="none" stroke="var(--ink)" stroke-width="3"/><path d="M20 50 H80" stroke="var(--accent)" stroke-width="3"/><path d="M100 50 H194" stroke="var(--hl-strong)" stroke-width="5" stroke-linecap="round"/><path d="M100 64 H130 M130 60v8 M160 60v8 M190 60v8" stroke="var(--accent)" stroke-width="2"/><text x="148" y="86" font-size="12" text-anchor="middle" fill="var(--muted)">3 diameters and a bit</text></svg>' })
  };

  function renderBeginner(focus) {
    const lessons = M.BEGINNER.map(b => {
      const entry = M.BY_ID[b.id];
      const meth = methodFor(b.id);
      const pre = (b.pre || []).map(p => BEGIN_BY_ID[p]).filter(Boolean);
      return h("article", { class: "lesson", id: "lesson-" + hid(b.id) },
        h("div", { class: "lesson-sym" }, b.sym),
        h("h2", null, b.title),
        VIS[b.vis] ? VIS[b.vis]() : null,
        h("p", { class: "lesson-text" }, b.text),
        h("div", { class: "lesson-foot" },
          pre.length ? h("div", { class: "lesson-pre" }, h("span", null, "Learn first:"),
            pre.map(p => h("a", { class: "btn pre-btn", href: "#learn-" + hid(p.id) }, p.title))) : h("span", { class: "start-here" }, "A good place to start"),
          h("div", { class: "lesson-more" },
            meth ? h("a", { class: "btn btn-small", href: "#methods-" + hid(b.id) }, "Methods") : null,
            entry ? h("a", { class: "btn btn-small btn-ghost", href: "#entry-" + hid(b.id) }, "In the Math Index") : null)));
    });
    view.append(
      h("header", { class: "page-head" },
        h("p", { class: "eyebrow" }, M.BEGINNER.length + " lessons, easiest first"),
        h("h1", null, "The Beginner’s Math Book"),
        h("p", { class: "lede" }, "Each lesson shows the symbol, a picture and what it means. If a lesson needs something you haven’t learned yet, the button at the bottom takes you to that lesson first.")),
      h("div", { class: "lessons" }, lessons));
    if (focus) {
      requestAnimationFrame(() => {
        const el = document.getElementById("lesson-" + hid(focus));
        if (el) {
          el.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
          el.classList.remove("flash"); void el.offsetWidth; el.classList.add("flash");
        }
      });
    }
  }

  /* ---------------- Methods ---------------- */

  const PLACES = ["ones", "tens", "hundreds", "thousands", "ten-thousands", "hundred-thousands", "millions", "ten-millions", "hundred-millions", "billions"];
  const placeName = i => PLACES[i] || ("column " + (i + 1));
  const big = s => { try { return BigInt(s); } catch (e) { return null; } };
  const steps = arr => h("ol", { class: "work-steps" }, arr.map(s => h("li", null, s)));
  const answer = (label, val) => h("p", { class: "work-answer" }, label, " ", h("b", null, val));
  const fmtBig = b => b.toString().replace("-", "−");

  function digitTable(rows, cols) {
    // rows: [{cells:[...], cls}] right-aligned into `cols` columns
    return h("div", { class: "table-wrap" }, h("table", { class: "digits" }, h("tbody", null, rows.map(r => {
      const cells = r.cells.slice();
      while (cells.length < cols) cells.unshift("");
      return h("tr", { class: r.cls || "" }, cells.map(c => h("td", { class: c && c.cls ? c.cls : "" }, c && c.t != null ? c.t : c)));
    }))));
  }

  const TOOLS = {
    add: { f: [["a", "First number", "478"], ["b", "Second number", "365"]], run(a, b) {
      if (!/^\d{1,15}$/.test(a) || !/^\d{1,15}$/.test(b)) throw new Error("Use whole numbers of up to 15 digits");
      const n = Math.max(a.length, b.length);
      const A = a.padStart(n, "0"), B = b.padStart(n, "0");
      const carry = Array(n + 1).fill(""), res = [], st = [];
      let c = 0;
      for (let i = n - 1; i >= 0; i--) {
        const da = +A[i], db = +B[i], s = da + db + c;
        const pl = placeName(n - 1 - i);
        st.push(pl[0].toUpperCase() + pl.slice(1) + ": " + da + " + " + db + (c ? " + 1 carried" : "") + " = " + s + "." +
          (s > 9 ? " That is more than 9, so write " + (s % 10) + " and carry 1 to the " + placeName(n - i) + "." : " Write " + s + "."));
        res.unshift(s % 10);
        c = s > 9 ? 1 : 0;
        if (c) carry[i] = { t: "1", cls: "carry" };
      }
      if (c) { res.unshift(1); st.push("There is still 1 carried, so write it at the front."); }
      const blank = (s, len) => s.split("").map((d, i) => (i < n - len ? "" : d));
      return [
        digitTable([
          { cells: carry, cls: "carry-row" },
          { cells: [""].concat(blank(A, a.length)) },
          { cells: ["+"].concat(blank(B, b.length)) },
          { cells: res.map(String), cls: "total" }
        ], n + 1),
        steps(st), answer(a + " + " + b + " =", res.join(""))
      ];
    } },
    sub: { f: [["a", "Top number", "503"], ["b", "Take away", "178"]], run(a, b) {
      if (!/^\d{1,15}$/.test(a) || !/^\d{1,15}$/.test(b)) throw new Error("Use whole numbers of up to 15 digits");
      let neg = false;
      if (big(a) < big(b)) { [a, b] = [b, a]; neg = true; }
      const n = a.length;
      const top = a.split("").map(Number), orig = top.slice(), bot = b.padStart(n, "0").split("").map(Number);
      const st = [], res = [];
      if (neg) st.push("The second number is bigger, so work out " + a + " − " + b + " and put a minus sign on the answer.");
      for (let i = n - 1; i >= 0; i--) {
        const pl = placeName(n - 1 - i);
        if (top[i] < bot[i]) {
          let j = i - 1;
          while (top[j] === 0) j--;
          const chain = [];
          top[j]--; chain.push(placeName(n - 1 - j));
          for (let k = j + 1; k < i; k++) { top[k] = 9; chain.push(placeName(n - 1 - k)); }
          top[i] += 10;
          st.push(pl[0].toUpperCase() + pl.slice(1) + ": " + (top[i] - 10) + " is smaller than " + bot[i] + ", so borrow 1 from the " + chain[0] +
            (chain.length > 1 ? " (the zeros in between become 9s)" : "") + ". Now " + top[i] + " − " + bot[i] + " = " + (top[i] - bot[i]) + ".");
        } else {
          st.push(pl[0].toUpperCase() + pl.slice(1) + ": " + top[i] + " − " + bot[i] + " = " + (top[i] - bot[i]) + ".");
        }
        res.unshift(top[i] - bot[i]);
      }
      const r = res.join("").replace(/^0+(?=\d)/, "");
      const bs = b.padStart(n, " ").split("").map(d => d.trim());
      return [
        digitTable([
          { cells: top.map((d, i) => d !== orig[i] ? { t: String(d), cls: "carry" } : ""), cls: "carry-row" },
          { cells: orig.map((d, i) => top[i] !== d ? { t: String(d), cls: "struck" } : String(d)) },
          { cells: ["−"].concat(bs) },
          { cells: r.split(""), cls: "total" }
        ], n + 1),
        steps(st), answer((neg ? b + " − " + a : a + " − " + b) + " =", (neg ? "−" : "") + r)
      ];
    } },
    mul: { f: [["a", "First number", "246"], ["b", "Second number", "37"]], run(a, b) {
      if (!/^\d{1,12}$/.test(a) || !/^\d{1,6}$/.test(b)) throw new Error("Use a first number up to 12 digits and a second up to 6");
      const A = BigInt(a), st = [], parts = [];
      b.split("").reverse().forEach((d, i) => {
        const p = A * BigInt(d) * 10n ** BigInt(i);
        parts.push(p);
        st.push("Multiply " + a + " by the " + placeName(i) + " digit " + d + (i ? " (which is really " + d + "0".repeat(i) + ")" : "") + ": " + fmtBig(p) + ".");
      });
      const total = parts.reduce((s, x) => s + x, 0n);
      if (parts.length > 1) st.push("Add the rows: " + parts.map(fmtBig).join(" + ") + " = " + fmtBig(total) + ".");
      const cols = Math.max(total.toString().length, a.length, b.length) + 1;
      return [
        digitTable([
          { cells: a.split("") }, { cells: ["×"].concat(b.split("")) },
          ...parts.map((p, i) => ({ cells: p.toString().split(""), cls: i === 0 ? "rule" : "" })),
          ...(parts.length > 1 ? [{ cells: total.toString().split(""), cls: "total" }] : [])
        ], cols),
        steps(st), answer(a + " × " + b + " =", fmtBig(total))
      ];
    } },
    div: { f: [["a", "Number to divide", "7452"], ["b", "Divide by", "6"]], run(a, b) {
      if (!/^\d{1,15}$/.test(a) || !/^\d{1,6}$/.test(b) || +b === 0) throw new Error(+b === 0 ? "You can’t divide by zero" : "Use whole numbers");
      const d = +b, st = [];
      let cur = 0, q = "";
      a.split("").forEach((ch, i) => {
        cur = cur * 10 + +ch;
        const qd = Math.floor(cur / d);
        q += qd;
        st.push((i === 0 ? "Start with " : "Bring down " + ch + " to make ") + cur + ". " + d + " goes into " + cur + " " + qd + " time" + (qd === 1 ? "" : "s") +
          " (" + qd + " × " + d + " = " + qd * d + "). " + cur + " − " + qd * d + " = " + (cur - qd * d) + " left.");
        cur -= qd * d;
      });
      q = q.replace(/^0+(?=\d)/, "");
      return [steps(st), answer(a + " ÷ " + b + " =", q + (cur ? " remainder " + cur : "")),
        cur ? h("p", { class: "muted" }, "As a decimal: " + fmt(+a / d)) : null];
    } },
    gcd: { f: [["a", "First number", "252"], ["b", "Second number", "105"]], run(a, b) {
      a = intIn(a); b = intIn(b);
      if (a < b) [a, b] = [b, a];
      const st = [];
      while (b) { const q = Math.floor(a / b), r = a % b; st.push(a + " = " + q + " × " + b + " + " + r); [a, b] = [b, r]; }
      st.push("The remainder is 0, so the gcd is the last divisor: " + a + ".");
      return [steps(st), answer("gcd =", String(a))];
    } },
    lcm: { f: [["a", "First number", "12"], ["b", "Second number", "18"]], run(a, b) {
      a = intIn(a); b = intIn(b);
      const g = window.Calc.gcd(a, b);
      return [steps(["gcd(" + a + ", " + b + ") = " + g + ".", a + " × " + b + " = " + a * b + ".", a * b + " ÷ " + g + " = " + a * b / g + "."]), answer("lcm =", String(a * b / g))];
    } },
    prime: { f: [["n", "Number to check", "221"]], run(n) {
      n = intIn(n, 1e12);
      if (n < 2) return [answer(n + " is", "not prime (primes start at 2)")];
      const root = Math.floor(Math.sqrt(n)), st = ["√" + n + " ≈ " + fmt(Math.sqrt(n)) + ", so try divisors from 2 to " + root + "."];
      let shown = 0;
      for (let d = 2; d <= root; d++) {
        if (n % d === 0) { st.push(n + " ÷ " + d + " = " + n / d + " exactly."); return [steps(st), answer(n + " is", "composite: " + d + " × " + n / d)]; }
        if (shown++ < 12) st.push(n + " ÷ " + d + " leaves remainder " + n % d + ".");
        else if (shown === 13) st.push("… and so on up to " + root + ".");
      }
      st.push("Nothing divides it exactly.");
      return [steps(st), answer(n + " is", "prime")];
    } },
    sieve: { f: [["n", "Find primes up to", "100"]], run(n) {
      n = intIn(n, 400);
      const by = Array(n + 1).fill(0), st = [];
      for (let p = 2; p * p <= n; p++) if (!by[p]) {
        const crossed = [];
        for (let m = p * p; m <= n; m += p) if (!by[m]) { by[m] = p; crossed.push(m); }
        st.push(p + " is prime. Cross out " + crossed.slice(0, 6).join(", ") + (crossed.length > 6 ? ", …" : "") + ".");
      }
      const grid = h("div", { class: "sieve" });
      const primes = [];
      for (let i = 2; i <= n; i++) {
        if (!by[i]) primes.push(i);
        grid.append(h("span", { class: by[i] ? "x" : "p", title: by[i] ? "Crossed out by " + by[i] : "Prime" }, String(i)));
      }
      return [grid, steps(st), answer("There are", primes.length + " primes up to " + n)];
    } },
    factor: { f: [["n", "Number to factor", "360"]], run(n) {
      n = intIn(n, 1e12);
      const st = [], f = {};
      let m = n;
      for (let d = 2; d * d <= m; d++) while (m % d === 0) { st.push(m + " ÷ " + d + " = " + m / d); m /= d; f[d] = (f[d] || 0) + 1; }
      if (m > 1) { st.push(m + " is prime"); f[m] = (f[m] || 0) + 1; }
      const sup = s => String(s).replace(/\d/g, d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
      return [steps(st), answer(n + " =", Object.keys(f).map(p => p + (f[p] > 1 ? sup(f[p]) : "")).join(" × ") || String(n))];
    } },
    frac: { f: [["a", "Top of first", "1"], ["b", "Bottom of first", "4"], ["c", "Top of second", "2"], ["d", "Bottom of second", "3"]], run(a, b, c, d) {
      a = intIn(a, 1e6, true); b = intIn(b); c = intIn(c, 1e6, true); d = intIn(d);
      const g = window.Calc.gcd, L = b * d / g(b, d), A = a * L / b, C = c * L / d, top = A + C, s = g(top, L) || 1;
      return [steps([
        "Common denominator: lcm(" + b + ", " + d + ") = " + L + ".",
        a + "/" + b + " = " + A + "/" + L + " (multiply top and bottom by " + L / b + ").",
        c + "/" + d + " = " + C + "/" + L + " (multiply top and bottom by " + L / d + ").",
        "Add the tops: " + A + " + " + C + " = " + top + ", so the sum is " + top + "/" + L + ".",
        s > 1 ? "Simplify by dividing top and bottom by " + s + "." : "It is already in simplest form."
      ]), answer(a + "/" + b + " + " + c + "/" + d + " =", (top / s) + "/" + (L / s) + "  (" + fmt(top / L) + ")")];
    } },
    pct: { f: [["p", "Percent", "15"], ["n", "Of", "240"]], run(p, n) {
      p = numIn(p); n = numIn(n);
      return [steps([n + " ÷ 100 = " + fmt(n / 100) + " (that is 1%).", fmt(n / 100) + " × " + p + " = " + fmt(n / 100 * p) + "."]), answer(p + "% of " + n + " =", fmt(n * p / 100))];
    } },
    pow: { f: [["b", "Base", "3"], ["e", "Exponent", "5"]], run(b, e) {
      b = numIn(b); e = intIn(e, 30, true);
      const st = []; let r = 1;
      for (let i = 1; i <= e; i++) { st.push(fmt(r) + " × " + fmt(b) + " = " + fmt(r * b)); r *= b; }
      if (!e) st.push("Any number to the power 0 is 1.");
      return [steps(st), answer(fmt(b) + "^" + e + " =", fmt(r))];
    } },
    sqrt: { f: [["n", "Number", "20"], ["g", "First guess", "4"]], run(n, g) {
      n = numIn(n); g = numIn(g);
      if (n < 0) throw new Error("Negative numbers have no real square root");
      if (g <= 0) throw new Error("Guess a number bigger than 0");
      const st = [];
      for (let i = 0; i < 8; i++) {
        const ng = (g + n / g) / 2;
        st.push("Guess " + fmt(+g.toPrecision(10)) + ": " + n + " ÷ " + fmt(+g.toPrecision(10)) + " = " + fmt(+(n / g).toPrecision(10)) + ". Average = " + fmt(+ng.toPrecision(12)) + ".");
        if (Math.abs(ng - g) < 1e-12) break;
        g = ng;
      }
      return [steps(st), answer("√" + n + " ≈", fmt(Math.sqrt(n)))];
    } },
    fact: { f: [["n", "n", "6"]], run(n) {
      n = intIn(n, 40, true);
      let r = 1n; const st = [];
      for (let i = 2n; i <= BigInt(n); i++) { st.push(fmtBig(r) + " × " + i + " = " + fmtBig(r * i)); r *= i; }
      if (n < 2) st.push(n + "! = 1 (there is one way to arrange " + (n ? "one thing" : "nothing") + ").");
      return [steps(st), answer(n + "! =", fmtBig(r))];
    } },
    mod: { f: [["a", "Number", "47"], ["n", "mod", "5"]], run(a, n) {
      a = intIn(a, 1e15, true); n = intIn(n);
      const q = Math.floor(a / n);
      return [steps([a + " ÷ " + n + " = " + fmt(a / n) + ", whole part " + q + ".", q + " × " + n + " = " + q * n + ".", a + " − " + q * n + " = " + (a - q * n) + "."]), answer(a + " mod " + n + " =", String(a - q * n))];
    } },
    collatz: { f: [["n", "Start with", "27"]], run(n) {
      n = intIn(n, 1e12);
      const seq = [n]; let peak = n;
      while (n !== 1 && seq.length < 1000) { n = n % 2 ? 3 * n + 1 : n / 2; seq.push(n); peak = Math.max(peak, n); }
      return [h("p", { class: "seq" }, seq.join(" → ")), answer("Reached 1 in", (seq.length - 1) + " steps, highest value " + peak)];
    } },
    fib: { f: [["n", "How many numbers", "20"]], run(n) {
      n = intIn(n, 150);
      const s = [1n, 1n];
      while (s.length < n) s.push(s[s.length - 1] + s[s.length - 2]);
      const list = s.slice(0, n);
      const st = list.slice(2, 8).map((v, i) => fmtBig(list[i]) + " + " + fmtBig(list[i + 1]) + " = " + fmtBig(v));
      return [steps(st), h("p", { class: "seq" }, list.map(fmtBig).join(", ")),
        n > 2 ? h("p", { class: "muted" }, "Last two divided: " + fmt(Number(list[n - 1]) / Number(list[n - 2])) + " (φ ≈ 1.6180339887)") : null];
    } },
    base: { f: [["n", "Number", "45"], ["b", "To base", "2"]], run(n, b) {
      n = intIn(n, 1e15, true); b = intIn(b, 36);
      if (b < 2) throw new Error("Bases go from 2 to 36");
      const st = []; let m = n;
      if (!m) st.push("0 is 0 in every base.");
      while (m) { st.push(m + " ÷ " + b + " = " + Math.floor(m / b) + " remainder " + (m % b).toString(b).toUpperCase()); m = Math.floor(m / b); }
      st.push("Read the remainders from the bottom up.");
      return [steps(st), answer(n + " in base " + b + " =", n.toString(b).toUpperCase())];
    } },
    pythag: { f: [["a", "Side a", "5"], ["b", "Side b", "12"]], run(a, b) {
      a = numIn(a); b = numIn(b);
      return [steps([a + "² = " + fmt(a * a) + " and " + b + "² = " + fmt(b * b) + ".", fmt(a * a) + " + " + fmt(b * b) + " = " + fmt(a * a + b * b) + ".", "√" + fmt(a * a + b * b) + " = " + fmt(Math.hypot(a, b)) + "."]), answer("c =", fmt(Math.hypot(a, b)))];
    } },
    droot: { f: [["n", "Number", "987654"]], run(n) {
      if (!/^\d{1,30}$/.test(n)) throw new Error("Use a whole number");
      const st = [];
      while (n.length > 1) { const s = n.split("").reduce((x, d) => x + +d, 0); st.push(n.split("").join(" + ") + " = " + s); n = String(s); }
      return [steps(st), answer("Digital root:", n)];
    } },
    perfect: { f: [["n", "Number", "28"]], run(n) {
      n = intIn(n, 1e8);
      const d = [];
      for (let i = 1; i <= n / 2; i++) if (n % i === 0) d.push(i);
      const s = d.reduce((a, b) => a + b, 0);
      return [steps(["Proper divisors of " + n + ": " + (d.join(", ") || "none") + ".", "They add up to " + s + "."]),
        answer(n + " is", s === n ? "perfect" : s > n ? "abundant (sum is bigger)" : "deficient (sum is smaller)")];
    } },
    mean: { f: [["list", "Numbers, separated by commas", "4, 8, 15, 16, 23, 42, 8"]], run(list) {
      const v = list.split(/[,\s]+/).filter(Boolean).map(Number);
      if (!v.length || v.some(isNaN)) throw new Error("Type numbers separated by commas");
      const sum = v.reduce((a, b) => a + b, 0), s = v.slice().sort((a, b) => a - b), mid = Math.floor(s.length / 2);
      const med = s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
      const cnt = {}; v.forEach(x => { cnt[x] = (cnt[x] || 0) + 1; });
      const top = Math.max(...Object.values(cnt));
      const modes = Object.keys(cnt).filter(k => cnt[k] === top);
      return [steps(["Sum: " + v.join(" + ") + " = " + fmt(sum) + ". Count: " + v.length + ".", "Mean = " + fmt(sum) + " ÷ " + v.length + " = " + fmt(sum / v.length) + ".",
        "Sorted: " + s.join(", ") + ". Median = " + fmt(med) + ".", top > 1 ? "Mode: " + modes.join(", ") + " (appears " + top + " times)." : "No mode: every value appears once."]),
        answer("Mean", fmt(sum / v.length))];
    } },
    tri: { f: [["n", "n", "100"]], run(n) {
      n = intIn(n, 1e7);
      return [steps(["Pair 1 with " + n + ", 2 with " + (n - 1) + ", and so on. Each pair adds to " + (n + 1) + ".", "There are " + n + " ÷ 2 = " + fmt(n / 2) + " pairs.", fmt(n / 2) + " × " + (n + 1) + " = " + n * (n + 1) / 2 + "."]), answer("1 + 2 + … + " + n + " =", String(n * (n + 1) / 2))];
    } },
    kaprekar: { f: [["n", "4-digit number", "3524"]], run(n) {
      if (!/^\d{4}$/.test(n) || /^(\d)\1{3}$/.test(n)) throw new Error("Use 4 digits that are not all the same");
      const st = [];
      for (let i = 0; i < 8 && n !== "6174"; i++) {
        const d = n.split("").sort(), lo = d.join(""), hi = d.slice().reverse().join("");
        const r = String(+hi - +lo).padStart(4, "0");
        st.push(hi + " − " + lo + " = " + r);
        n = r;
      }
      return [steps(st), answer("Reached", "6174")];
    } },
    happy: { f: [["n", "Number", "19"]], run(n) {
      n = intIn(n, 1e12);
      const seen = new Set(), st = [];
      while (n !== 1 && !seen.has(n)) {
        seen.add(n);
        const ds = String(n).split("");
        const s = ds.reduce((a, d) => a + d * d, 0);
        st.push(ds.map(d => d + "²").join(" + ") + " = " + s);
        n = s;
      }
      return [steps(st), answer("It is", n === 1 ? "happy" : "not happy (it loops)")];
    } },
    schizo: { f: [["n", "Odd n (1 to 99)", "49"]], run(n) {
      n = intIn(n, 99);
      let f = 0n;
      for (let i = 1n; i <= BigInt(n); i++) f = 10n * f + i;
      const D = 60n;
      const isqrt = v => { if (v < 2n) return v; let x = v, y = (x + 1n) / 2n; while (y < x) { x = y; y = (x + v / x) / 2n; } return x; };
      const r = isqrt(f * 10n ** (2n * D)).toString().padStart(Number(D) + 1, "0");
      const whole = r.slice(0, r.length - Number(D)), frac = r.slice(-Number(D));
      return [steps(["f(" + n + ") = " + f.toString() + ".", n % 2 ? "n is odd, so the square root shows the strange near-repeating pattern." : "n is even, so the pattern is less striking. Try an odd n."]),
        h("p", { class: "seq mono" }, "√f(" + n + ") = " + whole + "." + frac + "…")];
    } },
    deriv: { f: [["p", "Polynomial in x", "4x^3 − 2x^2 + 7x − 5"]], run(p) {
      const terms = parsePoly(p);
      const st = [], out = [];
      terms.forEach(({ c, e }) => {
        const t = polyTerm(c, e);
        if (e === 0) st.push(t + " is a constant, so it disappears.");
        else { const nc = c * e, ne = e - 1; st.push(t + " → " + e + " × " + fmt(c) + " x^" + ne + " = " + polyTerm(nc, ne)); out.push({ c: nc, e: ne }); }
      });
      return [steps(st), answer("d/dx =", joinPoly(out) || "0")];
    } },
    integral: { f: [["f", "f(x) =", "x²"], ["a", "From a", "0"], ["b", "To b", "3"]], run(fs, a, b) {
      const fn = window.Calc.compile(fs);
      a = numIn(a); b = numIn(b);
      const g = x => fn({ x });
      const mid = N => { const w = (b - a) / N; let s = 0; for (let i = 0; i < N; i++) s += g(a + (i + 0.5) * w) * w; return s; };
      const exact = window.Calc.evaluate("int(" + fs + "," + a + "," + b + ")");
      return [stripsSvg(g, a, b, 8), steps([4, 8, 100, 10000].map(N => N + " strips: area ≈ " + fmt(+mid(N).toPrecision(10))).concat(["With very thin strips the area settles on " + fmt(+exact.toPrecision(10)) + "."])),
        answer("∫ from " + a + " to " + b + " of " + fs + " dx ≈", fmt(+exact.toPrecision(10)))];
    } },
    gradient: { f: [["f", "f(x, y) =", "x² + 3xy"], ["x", "At x", "1"], ["y", "At y", "2"]], run(fs, x, y) {
      const fn = window.Calc.compile(fs);
      x = numIn(x); y = numIn(y);
      const e = 1e-5;
      const fx = (fn({ x: x + e, y }) - fn({ x: x - e, y })) / (2 * e);
      const fy = (fn({ x, y: y + e }) - fn({ x, y: y - e })) / (2 * e);
      const r = v => fmt(+v.toPrecision(8));
      return [steps(["Hold y = " + y + " fixed and nudge x: ∂f/∂x ≈ " + r(fx) + ".", "Hold x = " + x + " fixed and nudge y: ∂f/∂y ≈ " + r(fy) + ".",
        "Steepness |∇f| = √(" + r(fx) + "² + " + r(fy) + "²) ≈ " + r(Math.hypot(fx, fy)) + "."]),
        answer("∇f(" + x + ", " + y + ") ≈", "(" + r(fx) + ", " + r(fy) + ")")];
    } },
    sum: { f: [["f", "Term (use n)", "n²"], ["a", "From n =", "1"], ["b", "To", "6"]], run(fs, a, b) {
      const fn = window.Calc.compile(fs);
      a = intIn(a, 1e6, true); b = intIn(b, 1e6, true);
      if (b - a > 5000) throw new Error("Use fewer than 5,000 terms here");
      let total = 0; const st = [];
      for (let n = a; n <= b; n++) { const v = fn({ n, k: n }); total += v; if (n - a < 15) st.push("n = " + n + ": term = " + fmt(v) + ", running total = " + fmt(total)); }
      if (b - a >= 15) st.push("… and so on to n = " + b + ".");
      return [steps(st), answer("Σ =", fmt(total))];
    } },
    linear: { f: [["a", "a (in ax + b = c)", "3"], ["b", "b", "5"], ["c", "c", "20"]], run(a, b, c) {
      a = numIn(a); b = numIn(b); c = numIn(c);
      if (!a) throw new Error("a can’t be 0, or there is no x to solve for");
      return [steps([fmt(a) + "x + " + fmt(b) + " = " + fmt(c), "Subtract " + fmt(b) + " from both sides: " + fmt(a) + "x = " + fmt(c - b), "Divide both sides by " + fmt(a) + ": x = " + fmt((c - b) / a)]), answer("x =", fmt((c - b) / a))];
    } },
    quad: { f: [["a", "a", "1"], ["b", "b", "−3"], ["c", "c", "−10"]], run(a, b, c) {
      a = numIn(a); b = numIn(b); c = numIn(c);
      if (!a) throw new Error("a can’t be 0 in a quadratic");
      const D = b * b - 4 * a * c;
      const st = ["Discriminant: b² − 4ac = " + fmt(b * b) + " − " + fmt(4 * a * c) + " = " + fmt(D) + "."];
      if (D < 0) { st.push("It is negative, so there are no real solutions."); return [steps(st), answer("x =", "no real solutions")]; }
      const r = Math.sqrt(D), x1 = (-b + r) / (2 * a), x2 = (-b - r) / (2 * a);
      st.push("√" + fmt(D) + " = " + fmt(r) + ".", "x = (" + fmt(-b) + " ± " + fmt(r) + ") ÷ " + fmt(2 * a) + ".");
      return [steps(st), answer("x =", D === 0 ? fmt(x1) : fmt(x1) + " or " + fmt(x2))];
    } },
    ncr: { f: [["n", "n (how many things)", "6"], ["r", "r (how many you pick)", "2"]], run(n, r) {
      n = intIn(n, 170, true); r = intIn(r, 170, true);
      if (r > n) throw new Error("r can’t be bigger than n");
      const f = k => { let x = 1n; for (let i = 2n; i <= BigInt(k); i++) x *= i; return x; };
      const v = f(n) / (f(r) * f(n - r));
      return [steps([n + "! = " + fmtBig(f(n)), r + "! = " + fmtBig(f(r)) + " and " + (n - r) + "! = " + fmtBig(f(n - r)), fmtBig(f(n)) + " ÷ (" + fmtBig(f(r)) + " × " + fmtBig(f(n - r)) + ") = " + fmtBig(v)]),
        answer(n + "C" + r + " =", fmtBig(v))];
    } },
    totient: { f: [["n", "n", "12"]], run(n) {
      n = intIn(n, 2000);
      const keep = [];
      for (let i = 1; i <= n; i++) if (window.Calc.gcd(i, n) === 1) keep.push(i);
      return [steps(["Numbers from 1 to " + n + " that share no factor with " + n + ": " + keep.join(", ") + "."]), answer("φ(" + n + ") =", String(keep.length))];
    } }
  };

  function intIn(s, max, allowZero) {
    const v = Number(String(s).replace(/[−–]/g, "-").replace(/[, ]/g, ""));
    if (!Number.isInteger(v)) throw new Error("“" + s + "” needs to be a whole number");
    if (v < (allowZero ? 0 : 1)) throw new Error("Use a number " + (allowZero ? "0" : "1") + " or bigger");
    if (max && Math.abs(v) > max) throw new Error("Use a number up to " + max.toLocaleString());
    return v;
  }
  function numIn(s) {
    try { const v = window.Calc.evaluate(String(s)); if (isFinite(v)) return v; } catch (e) { /* fall through */ }
    throw new Error("“" + s + "” needs to be a number");
  }
  function parsePoly(p) {
    const s = p.replace(/[−–]/g, "-").replace(/\s+/g, "").replace(/²/g, "^2").replace(/³/g, "^3");
    if (!s) throw new Error("Type a polynomial like 3x^2 + 2x − 1");
    const parts = s.replace(/-/g, "+-").split("+").filter(Boolean);
    return parts.map(t => {
      const m = t.match(/^(-?\d*\.?\d*)(x(?:\^(-?\d+))?)?$/);
      if (!m || (m[1] === "" && !m[2]) ) throw new Error("I can’t read the term “" + t + "”");
      let c = m[1] === "" || m[1] === "-" ? (m[1] === "-" ? -1 : 1) : parseFloat(m[1]);
      const e = m[2] ? (m[3] != null ? parseInt(m[3], 10) : 1) : 0;
      return { c, e };
    });
  }
  const supNum = n => String(n).replace(/-/g, "⁻").replace(/\d/g, d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[d]);
  function polyTerm(c, e) {
    const cs = e === 0 ? fmt(c) : c === 1 ? "" : c === -1 ? "−" : fmt(c);
    return cs + (e === 0 ? "" : "x" + (e === 1 ? "" : supNum(e)));
  }
  function joinPoly(ts) {
    return ts.filter(t => t.c !== 0).map((t, i) => {
      const s = polyTerm(Math.abs(t.c), t.e);
      return (i === 0 ? (t.c < 0 ? "−" : "") : (t.c < 0 ? " − " : " + ")) + s;
    }).join("");
  }
  function stripsSvg(g, a, b, N) {
    const W = 320, H = 150, pad = 14;
    const xs = [], ys = [];
    for (let i = 0; i <= 100; i++) { const x = a + (b - a) * i / 100; xs.push(x); ys.push(g(x)); }
    const ymax = Math.max(0, ...ys.filter(isFinite)), ymin = Math.min(0, ...ys.filter(isFinite));
    const sx = x => pad + (x - a) / (b - a) * (W - 2 * pad);
    const sy = y => H - pad - (y - ymin) / ((ymax - ymin) || 1) * (H - 2 * pad);
    let rects = "";
    const w = (b - a) / N;
    for (let i = 0; i < N; i++) {
      const xm = a + (i + 0.5) * w, y = g(xm);
      if (!isFinite(y)) continue;
      const top = Math.min(sy(y), sy(0)), hh = Math.abs(sy(y) - sy(0));
      rects += '<rect x="' + sx(a + i * w).toFixed(1) + '" y="' + top.toFixed(1) + '" width="' + (sx(a + (i + 1) * w) - sx(a + i * w)).toFixed(1) + '" height="' + hh.toFixed(1) + '" fill="var(--hl)" stroke="var(--accent)" stroke-width="1"/>';
    }
    const path = xs.map((x, i) => isFinite(ys[i]) ? (i ? "L" : "M") + sx(x).toFixed(1) + " " + sy(ys[i]).toFixed(1) : "").join(" ");
    return h("div", { class: "table-wrap", html: '<svg viewBox="0 0 ' + W + " " + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Curve with ' + N + ' strips under it">' + rects +
      '<path d="M' + pad + " " + sy(0).toFixed(1) + " H" + (W - pad) + '" stroke="var(--ink-soft)" stroke-width="1.5"/><path d="' + path + '" fill="none" stroke="var(--ink)" stroke-width="2.5"/></svg>' });
  }

  function renderMethods(id) {
    const e = M.BY_ID[id];
    const mf = methodFor(id);
    if (!mf) { location.hash = "entry-" + hid(id); return; }
    const m = mf.m, target = M.BY_ID[mf.id];
    const tool = TOOLS[m.tool];
    const out = h("div", { class: "work-out", "aria-live": "polite" });
    let form = null;
    if (tool) {
      const inputs = tool.f.map(([k, label, def]) => {
        const inp = h("input", { id: "mt-" + k, value: def, autocomplete: "off", spellcheck: "false", inputmode: /list|f|p/.test(k) ? null : "decimal" });
        return { inp, el: h("label", { class: "field", for: "mt-" + k }, h("span", null, label), inp) };
      });
      const run = () => {
        out.innerHTML = "";
        try { out.append(...tool.run(...inputs.map(i => i.inp.value.trim())).filter(Boolean)); }
        catch (err) { out.append(h("p", { class: "work-err" }, err.message)); }
      };
      inputs.forEach(i => i.inp.addEventListener("input", run));
      form = h("form", { class: "tool-form", onsubmit: ev => { ev.preventDefault(); run(); } }, inputs.map(i => i.el), h("button", { class: "btn btn-accent", type: "submit" }, "Show the working"));
      run();
    }
    view.append(
      h("nav", { class: "trail", "aria-label": "Where you are" },
        h("a", { href: "#book" }, "Math Book"), h("span", null, "›"),
        h("a", { href: "#entry-" + hid(id) }, e.name), h("span", null, "›"), h("span", null, "Methods")),
      h("article", { class: "methods g-" + e.group },
        h("div", { class: "methods-head" },
          h("div", { class: "entry-sym small" }, e.sym),
          h("div", null, h("p", { class: "eyebrow" }, "Method"), h("h1", null, m.title),
            target !== e ? h("p", { class: "muted" }, "Uses the method for ", h("a", { href: "#entry-" + hid(target.id) }, target.name), ".") : null)),
        h("p", { class: "lede" }, m.intro),
        h("h2", { class: "h-small" }, "Steps"),
        h("ol", { class: "how-steps" }, m.steps.map(s => h("li", null, s))),
        tool ? h("section", { class: "try" }, h("h2", { class: "h-small" }, "Try it with your own numbers"), form, out) : null,
        h("div", { class: "entry-actions" }, h("a", { class: "btn btn-ghost", href: "#entry-" + hid(id) }, "Back to " + e.name)))
    );
  }

  /* ---------------- Calculator ---------------- */

  function renderCalc() {
    const box = h("div", { class: "calc-page" });
    view.append(box);
    window.Calc.mount(box);
  }

  route();
})();
