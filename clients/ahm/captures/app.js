(function () {
  const data = window.CAPTURES;
  const MAX_FUNDS = 3;
  // Defaults: the baseline fund and first persona.
  const state = { viewport: "web", persona: "P1", funds: ["ahm"] };
  let visible = []; // every tile currently on screen

  const $ = (id) => document.getElementById(id);
  const grid = $("grid"), empty = $("empty"), emptyText = $("empty-text"), pills = $("pills"), personaSel = $("persona");
  const viewer = $("viewer"), viewerImg = $("viewer-img"), viewerBody = $("viewer-body");
  const viewerTitle = $("viewer-title"), viewerDownload = $("viewer-download");
  let current = null;

  const fundName = (f) => data.funds[f] || f;
  const vpName = (v) => (v === "web" ? "Web" : "Mobile");
  // Persona names instead of P-codes: full label for the dropdown,
  // short form ("Single, 27", "Couple, 38") for the full view title.
  const personaFull = (p) => data.personas[p] || p;
  const personaShort = (p) => personaFull(p).split(",").slice(0, 2).join(",").trim();
  const label = (i) => `${fundName(i.fund)} · ${personaShort(i.persona)} · ${vpName(i.viewport)} · Step ${i.step}`;
  const fileName = (i) => `${i.fund}_${i.persona}_${i.viewport}_step-${String(i.step).padStart(2, "0")}.${i.src.split(".").pop()}`;
  const fundOrder = Object.keys(data.funds).sort((a, b) => fundName(a).localeCompare(fundName(b)));

  function fillControls() {
    Object.keys(data.personas).sort().forEach((p) =>
      personaSel.add(new Option(personaFull(p), p)));
    fundOrder.forEach((f) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pill";
      b.dataset.fund = f;
      b.textContent = fundName(f);
      pills.appendChild(b);
    });
    syncControls();
  }

  function syncControls() {
    personaSel.value = state.persona;
    document.querySelectorAll(".switch button").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.vp === state.viewport)));
    pills.querySelectorAll(".pill").forEach((b) =>
      b.setAttribute("aria-pressed", String(state.funds.includes(b.dataset.fund))));
  }

  // Pill rules: tap to add (up to 3), tap again to remove.
  // Picking a 4th replaces the most recent 3rd pick.
  function toggleFund(f) {
    const i = state.funds.indexOf(f);
    if (i >= 0) state.funds.splice(i, 1);
    else if (state.funds.length < MAX_FUNDS) state.funds.push(f);
    else state.funds[MAX_FUNDS - 1] = f;
  }

  const itemsFor = (fund) => data.items.filter((i) =>
    i.viewport === state.viewport && i.persona === state.persona && i.fund === fund);

  function render() {
    const groups = state.funds.map((f) => ({ fund: f, items: itemsFor(f) }));
    const multi = groups.length > 1;
    visible = groups.flatMap((g) => g.items);
    grid.classList.toggle("is-mobile", state.viewport === "mobile");
    grid.classList.toggle("is-multi", multi);
    grid.style.setProperty("--cols", groups.length);

    if (!groups.length) {
      grid.replaceChildren();
      emptyText.textContent = "Select at least one company to view screenshots.";
      empty.hidden = false;
      return;
    }
    if (!multi) {
      grid.replaceChildren(...groups[0].items.map(tile));
      emptyText.textContent = "No captures for this company and persona.";
      empty.hidden = groups[0].items.length > 0;
      return;
    }

    // Multi view: one column per company, rows lined up by step.
    empty.hidden = true;
    // One solid full-width strip of company names, so nothing shows through the gaps.
    const heads = document.createElement("div");
    heads.className = "col-heads";
    groups.forEach((g) => {
      const h = document.createElement("div");
      h.className = "col-head";
      h.textContent = fundName(g.fund);
      heads.appendChild(h);
    });
    const cells = [heads];
    const rows = Math.max(1, ...groups.map((g) => g.items.length));
    for (let r = 0; r < rows; r++) {
      groups.forEach((g) => {
        if (g.items[r]) return cells.push(tile(g.items[r]));
        const gap = document.createElement("div");
        gap.className = "col-gap";
        if (r === 0) gap.textContent = "No captures";
        cells.push(gap);
      });
    }
    grid.replaceChildren(...cells);
  }

  function tile(item) {
    const fig = document.createElement("figure");
    fig.className = "tile";
    fig.tabIndex = 0;
    fig.setAttribute("role", "button");
    fig.dataset.id = item.id;
    fig.innerHTML =
      `<div class="tile-media"><img loading="lazy" decoding="async"></div>` +
      `<figcaption class="tile-desc"><div class="tile-headline"></div></figcaption>`;
    const img = fig.querySelector("img");
    img.src = item.src;
    img.alt = label(item);
    fig.querySelector(".tile-headline").textContent = `Step ${item.step}`;
    return fig;
  }

  // Full view steps through the opened capture's own company.
  const sequence = (item) => visible.filter((i) => i.fund === item.fund);

  // Full view, driven by #view/<id> so the browser Back button closes it.
  function openViewer(id) {
    const item = data.items.find((i) => i.id === id);
    if (!item) return closeViewer();
    // Deep link to a capture outside the current filters: switch filters to match.
    if (!visible.includes(item)) {
      Object.assign(state, { viewport: item.viewport, persona: item.persona });
      if (!state.funds.includes(item.fund)) toggleFund(item.fund);
      syncControls();
      render();
    }
    current = item;
    viewerImg.src = item.src;
    viewerImg.alt = label(item);
    viewerImg.classList.toggle("is-mobile", item.viewport === "mobile");
    // "AHM · Single, 27 · Web" in black, then "Step 3 of 10" in light grey.
    const stepText = document.createElement("span");
    stepText.className = "viewer-step";
    stepText.textContent = `Step ${item.step} of ${sequence(item).length}`;
    viewerTitle.replaceChildren(
      `${fundName(item.fund)} · ${personaShort(item.persona)} · ${vpName(item.viewport)} · `, stepText);
    viewerDownload.href = item.src;
    viewerDownload.setAttribute("download", fileName(item));
    viewerBody.scrollTop = 0;
    if (viewer.hidden) {
      viewer.hidden = false;
      document.body.style.overflow = "hidden";
      $("viewer-close").focus();
    }
  }

  function closeViewer() {
    viewer.hidden = true;
    current = null;
    viewerImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (location.hash.startsWith("#view/")) {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }

  function requestClose() {
    if (location.hash.startsWith("#view/")) history.back();
    else closeViewer();
  }

  // Arrow keys step through the company's order without adding history entries.
  function step(delta) {
    if (!current) return;
    const seq = sequence(current);
    if (seq.length < 2) return;
    const next = seq[(seq.indexOf(current) + delta + seq.length) % seq.length];
    history.replaceState(null, "", `#view/${encodeURIComponent(next.id)}`);
    openViewer(next.id);
  }

  function syncFromHash() {
    const m = location.hash.match(/^#view\/(.+)$/);
    if (m) openViewer(decodeURIComponent(m[1]));
    else if (!viewer.hidden) closeViewer();
  }

  // Keep sticky column headers just under the nav, whatever its height.
  const nav = document.querySelector(".nav");
  const setNavHeight = () =>
    document.documentElement.style.setProperty("--nav-h", `${nav.offsetHeight}px`);

  // Events
  document.querySelectorAll(".switch button").forEach((btn) =>
    btn.addEventListener("click", () => { state.viewport = btn.dataset.vp; syncControls(); render(); }));
  personaSel.addEventListener("change", () => { state.persona = personaSel.value; render(); });
  pills.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    toggleFund(pill.dataset.fund);
    syncControls();
    render();
  });

  const openFrom = (fig) => { location.hash = `view/${encodeURIComponent(fig.dataset.id)}`; };
  grid.addEventListener("click", (e) => {
    const fig = e.target.closest(".tile");
    if (fig) openFrom(fig);
  });
  grid.addEventListener("keydown", (e) => {
    const fig = e.target.closest(".tile");
    if (fig && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openFrom(fig); }
  });

  $("viewer-close").addEventListener("click", requestClose);
  document.addEventListener("keydown", (e) => {
    if (viewer.hidden) return;
    if (e.key === "Escape") requestClose();
    else if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
  });
  window.addEventListener("hashchange", syncFromHash);
  window.addEventListener("resize", setNavHeight);

  fillControls();
  setNavHeight();
  render();
  syncFromHash();
})();
