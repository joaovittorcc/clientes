# Dark Premium Mobile Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reskin the Clientes/Leads panel with the "Dark Premium" palette and fix mobile responsiveness (header wrap, bottom nav, Kanban that's unusable with 58 cards stacked).

**Architecture:** Pure CSS + minimal markup changes across the two static pages. `style.css` owns shared design tokens and base components (both pages load it); `leads-style.css` owns Leads-only components (Kanban, import modal, leads badges) and is loaded after `style.css` so it inherits the new tokens automatically. One small JS addition in `leads-app.js` for the mobile Kanban accordion — no other JS/data files touched.

**Tech Stack:** Plain HTML/CSS/JS, no build step, no test framework. Verification is done by loading the pages in the browser preview and inspecting them at desktop (1280px) and mobile (375px) widths with `resize_window` / `computer` screenshot / `read_page`.

## Global Constraints

- No changes to `app.js`, `leads-data.js`, `data.js` — CRUD, filters, import CSV, and status transitions must behave exactly as before.
- No new dependencies, no external fonts/icon libraries — keep the `"Segoe UI", system-ui, -apple-system, sans-serif` stack.
- Single breakpoint: `@media (max-width: 768px)` (spec: [docs/superpowers/specs/2026-07-13-dark-premium-mobile-redesign-design.md](../specs/2026-07-13-dark-premium-mobile-redesign-design.md)).
- Design tokens (exact values from the spec):
  `--bg:#0d0f14; --bg-elevated:#13151c; --bg-card:#171a22; --bg-card-hover:#1c1f29; --border:#23262f; --text:#f2f3f5; --text-muted:#7d8494; --accent:#2ee6a8; --accent-contrast:#0d0f14; --accent-soft:rgba(46,230,168,.12); --accent-hover:#4ef0ba; --green:#3fb950; --yellow:#d29922; --red:#f85149; --radius:12px; --radius-sm:8px;`
- Remove the `@media (prefers-color-scheme: light)` block in `style.css` — product is dark-only now.
- The dev server for manual verification: `mcp__Claude_Browser__preview_start` with `{name: "static-site"}` (config already in `.claude/launch.json`). Reload after every CSS/HTML edit — this is a static file server, no HMR.

---

### Task 1: Rewrite design tokens and shared components in `style.css`

**Files:**
- Modify: `style.css` (full rewrite, ~230 lines)

**Interfaces:**
- Produces: the CSS custom properties listed in Global Constraints — every later task (leads-style.css) relies on `var(--accent)`, `var(--bg-card)`, `var(--border)`, `var(--radius)`, `var(--accent-soft)` resolving to the Dark Premium values.
- Produces: `.bottomnav` and `.bottomnav a` / `.bottomnav a.active` classes (markup for these is added to the HTML files in Task 2) — must render `display:none` above 768px and `display:flex` at/below 768px.
- Produces: `.topbar-actions` flex/width rules reused by `leads.html`'s existing `<div class="topbar-actions">` wrapper.

- [ ] **Step 1: Replace the full contents of `style.css`**

```css
:root {
  --bg: #0d0f14;
  --bg-elevated: #13151c;
  --bg-card: #171a22;
  --bg-card-hover: #1c1f29;
  --border: #23262f;
  --text: #f2f3f5;
  --text-muted: #7d8494;
  --accent: #2ee6a8;
  --accent-contrast: #0d0f14;
  --accent-soft: rgba(46, 230, 168, 0.12);
  --accent-hover: #4ef0ba;
  --green: #3fb950;
  --yellow: #d29922;
  --red: #f85149;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}

.app {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 24px 64px;
}

.mainnav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border);
}

.mainnav .brand {
  font-weight: 700;
  color: var(--text);
  letter-spacing: 0.02em;
}

.mainnav .nav-links {
  display: flex;
  gap: 4px;
}

.mainnav .nav-links a {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 999px;
  transition: background 0.15s ease, color 0.15s ease;
}

.mainnav .nav-links a:hover {
  color: var(--text);
  background: var(--bg-card);
}

.mainnav .nav-links a.active {
  color: var(--accent-contrast);
  background: var(--accent);
}

.bottomnav {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border-top: 1px solid var(--border);
  z-index: 20;
}

.bottomnav a {
  flex: 1;
  text-align: center;
  padding: 10px 0 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.7rem;
  font-weight: 600;
}

.bottomnav a::before {
  content: "";
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.5;
  margin: 0 auto 4px;
}

.bottomnav a.active {
  color: var(--accent);
}

.bottomnav a.active::before {
  opacity: 1;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 28px;
}

.topbar h1 {
  font-size: 1.6rem;
  margin: 0;
}

.topbar-actions {
  display: flex;
  gap: 10px;
}

.btn {
  border: none;
  border-radius: var(--radius-sm);
  padding: 10px 18px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;
}

.btn-primary {
  background: var(--accent);
  color: var(--accent-contrast);
}

.btn-primary:hover {
  background: var(--accent-hover);
}

.btn-secondary {
  background: var(--bg-card);
  color: var(--text);
  border: 1px solid var(--border);
}

.btn-secondary:hover {
  background: var(--bg-card-hover);
}

.btn-danger {
  background: transparent;
  color: var(--red);
  border: 1px solid var(--red);
}

.btn-danger:hover {
  background: rgba(248, 81, 73, 0.1);
}

.btn-icon {
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
}

.btn-icon:hover {
  color: var(--text);
}

.stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-label {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.toolbar input,
.toolbar select {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 10px 12px;
  font-size: 0.9rem;
}

#busca {
  flex: 1;
}

.table-wrap {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 12px 16px;
  font-size: 0.88rem;
  border-bottom: 1px solid var(--border);
}

th {
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

tbody tr {
  cursor: pointer;
  transition: background 0.12s ease;
}

tbody tr:hover {
  background: var(--bg-card-hover);
}

tbody tr:last-child td {
  border-bottom: none;
}

.contato-linha {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contato-linha .muted {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
}

.badge-andamento {
  background: var(--accent-soft);
  color: var(--accent);
}

.badge-concluido {
  background: rgba(63, 185, 80, 0.15);
  color: var(--green);
}

.badge-pausado {
  background: rgba(210, 153, 34, 0.15);
  color: var(--yellow);
}

.badge-pago {
  background: rgba(63, 185, 80, 0.15);
  color: var(--green);
}

.badge-pendente {
  background: rgba(248, 81, 73, 0.15);
  color: var(--red);
}

.badge-parcial {
  background: rgba(210, 153, 34, 0.15);
  color: var(--yellow);
}

.row-excluir {
  color: var(--text-muted);
  font-size: 1.1rem;
}

.row-excluir:hover {
  color: var(--red);
}

.vazio {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 10;
}

.modal-overlay[hidden] {
  display: none;
}

.modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  width: 100%;
  max-width: 560px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-header h2 {
  margin: 0;
  font-size: 1.15rem;
}

#form-cliente,
#form-lead {
  padding: 20px 24px 24px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.field-full {
  grid-column: 1 / -1;
}

.field input,
.field select,
.field textarea {
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 10px 11px;
  font-size: 0.9rem;
  font-family: inherit;
  min-height: 40px;
}

.field textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 22px;
}

.modal-footer-right {
  display: flex;
  gap: 10px;
  margin-left: auto;
}

@media (max-width: 768px) {
  body {
    padding-bottom: 64px;
  }

  .mainnav .nav-links {
    display: none;
  }

  .bottomnav {
    display: flex;
  }

  .app {
    padding: 20px 16px 32px;
  }

  .topbar {
    flex-direction: column;
    align-items: stretch;
  }

  .topbar h1 {
    font-size: 1.3rem;
  }

  .topbar > .btn,
  .topbar-actions {
    width: 100%;
  }

  .topbar-actions .btn {
    flex: 1;
  }

  .btn {
    min-height: 44px;
  }

  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .toolbar {
    flex-direction: column;
  }

  .field input,
  .field select,
  .field textarea {
    min-height: 44px;
  }

  table,
  thead,
  tbody,
  th,
  td,
  tr {
    display: block;
  }

  thead {
    display: none;
  }

  tbody tr {
    border-bottom: 1px solid var(--border);
    padding: 12px 16px;
  }

  td {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
    border-bottom: none;
    padding: 6px 0;
  }

  td::before {
    content: attr(data-label);
    font-size: 0.7rem;
    color: var(--text-muted);
    text-transform: uppercase;
    flex: 0 0 auto;
  }
}
```

- [ ] **Step 2: Start the preview server and load the Clientes page**

Call `mcp__Claude_Browser__preview_start` with `{"name": "static-site"}`, then `mcp__Claude_Browser__navigate` the returned tab to `/index.html`.

- [ ] **Step 3: Verify desktop rendering**

Call `mcp__Claude_Browser__resize_window` with `{"preset": "desktop"}`, then `mcp__Claude_Browser__computer` `{"action": "screenshot"}`.
Expected: dark near-black background (`#0d0f14`), stat cards with emerald `+ Novo cliente` button, top nav pill active state in emerald — no light-mode colors anywhere (confirms the deleted `prefers-color-scheme: light` block took effect).

- [ ] **Step 4: Verify mobile rendering**

Call `mcp__Claude_Browser__resize_window` with `{"preset": "mobile"}`, then screenshot.
Expected: top nav no longer shows Clientes/Leads links (only brand), stats in 2 columns, `+ Novo cliente` button full width below the title (not squeezed beside it). The `.bottomnav` element isn't visible yet — it's added to the HTML in Task 2, this step only confirms the CSS rule exists and doesn't break layout with the element absent.

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "style: rework design tokens to Dark Premium palette"
```

---

### Task 2: Add bottom nav markup and fix header actions in `index.html` / `leads.html`

**Files:**
- Modify: `index.html:137-140` (insert bottomnav before the `<script>` tags)
- Modify: `leads.html:201-204` (insert bottomnav before the `<script>` tags)

**Interfaces:**
- Consumes: `.bottomnav`, `.bottomnav a`, `.bottomnav a.active`, `.topbar-actions` from Task 1's `style.css`.

- [ ] **Step 1: Update `index.html`**

The existing `<nav class="mainnav">` markup (lines 10-16) stays as-is — desktop nav is unchanged. Insert a second, bottom nav right before the closing `<script>` tags:

Find:
```html
  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

Replace with:
```html
  <nav class="bottomnav">
    <a href="index.html" class="active">Clientes</a>
    <a href="leads.html">Leads</a>
  </nav>

  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Update `leads.html`**

Find:
```html
  <script src="leads-data.js"></script>
  <script src="leads-app.js"></script>
</body>
</html>
```

Replace with:
```html
  <nav class="bottomnav">
    <a href="index.html">Clientes</a>
    <a href="leads.html" class="active">Leads</a>
  </nav>

  <script src="leads-data.js"></script>
  <script src="leads-app.js"></script>
</body>
</html>
```

- [ ] **Step 3: Verify in browser at mobile width**

Reload `index.html` in the preview tab (still at mobile preset from Task 1). Screenshot.
Expected: a fixed bar at the bottom of the viewport with "Clientes" (emerald, with filled dot above it) and "Leads" (muted, hollow dot). Page content isn't hidden behind the bar (there's breathing room at the bottom thanks to `body { padding-bottom: 64px }`).

Use `mcp__Claude_Browser__computer` `{"action": "left_click", "coordinate": [<Leads tab x>, <Leads tab y>]}` on the "Leads" bottom-nav item, then screenshot again.
Expected: navigates to `leads.html`, bottom nav now shows "Leads" active.

- [ ] **Step 4: Verify desktop is unaffected**

Resize to desktop preset, screenshot both pages.
Expected: no bottom bar visible, top nav pills work as before.

- [ ] **Step 5: Commit**

```bash
git add index.html leads.html
git commit -m "feat: add mobile bottom navigation"
```

---

### Task 3: Re-skin `leads-style.css` and unify the responsive breakpoint

**Files:**
- Modify: `leads-style.css:1-260` (targeted edits, not full rewrite)

**Interfaces:**
- Consumes: `var(--accent)`, `var(--accent-soft)`, `var(--bg-card)`, `var(--border)`, `var(--radius)`, `var(--radius-sm)` from Task 1.
- Produces: `.kanban-col-aberta`, `.kanban-col-title`, `.kanban-col-chevron` classes consumed by Task 4's markup/JS changes and by the mobile accordion CSS added in this task.

- [ ] **Step 1: Fix the hardcoded blue in `.stat-destaque` (lines 10-17)**

Find:
```css
.stat-destaque {
  border-color: var(--accent);
  background: linear-gradient(135deg, rgba(55, 138, 221, 0.18), rgba(12, 68, 124, 0.18));
}
```

Replace with:
```css
.stat-destaque {
  border-color: var(--accent);
  background: linear-gradient(135deg, var(--accent-soft), rgba(46, 230, 168, 0.03));
}
```

- [ ] **Step 2: Fix the hardcoded blue in `.badge-a_contatar` (lines 65-68)**

Find:
```css
.badge-a_contatar {
  background: rgba(55, 138, 221, 0.15);
  color: var(--accent);
}
```

Replace with:
```css
.badge-a_contatar {
  background: var(--accent-soft);
  color: var(--accent);
}
```

- [ ] **Step 3: Replace `.kanban-col-header` for button semantics + add chevron/title wrapper CSS (lines 129-140)**

Find:
```css
.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}
```

Replace with:
```css
.kanban-col-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  background: none;
  border: none;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--text-muted);
  padding: 0 0 8px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

.kanban-col-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.kanban-col-chevron {
  color: var(--text-muted);
  font-size: 0.7rem;
  transition: transform 0.15s ease;
  flex: 0 0 auto;
}
```

- [ ] **Step 4: Replace the `@media (max-width: 900px)` block at the end of the file (lines 253-260)**

Find:
```css
@media (max-width: 900px) {
  .stats-leads {
    grid-template-columns: repeat(2, 1fr);
  }
  .kanban {
    grid-template-columns: 1fr;
  }
}
```

Replace with:
```css
@media (max-width: 768px) {
  .stats-leads {
    grid-template-columns: repeat(2, 1fr);
  }

  .kanban {
    grid-template-columns: 1fr;
  }

  .kanban-col:not(.kanban-col-aberta) .kanban-cards {
    display: none;
  }

  .kanban-col:not(.kanban-col-aberta) .kanban-col-chevron {
    transform: rotate(-90deg);
  }

  .btn-toggle {
    min-height: 44px;
  }
}
```

- [ ] **Step 5: Verify the file has no remaining hardcoded blue values**

Run: `grep -n "55, 138, 221\|#378add\|#56a0ec" leads-style.css`
Expected: no output (empty match — confirms every old accent-blue reference was migrated to the token).

- [ ] **Step 6: Commit**

```bash
git add leads-style.css
git commit -m "style: reskin leads-style.css to Dark Premium and unify breakpoint"
```

---

### Task 4: Kanban mobile accordion (markup + JS)

**Files:**
- Modify: `leads-app.js:145` (add state variable after `KANBAN_COLUNAS`)
- Modify: `leads-app.js:456-492` (`renderKanban` function body)
- Modify: `leads-app.js:494-507` (click handler on `leadEls.viewKanban`)

**Interfaces:**
- Consumes: `KANBAN_COLUNAS` (array of status keys, line 145), `STATUS_LEAD_LABEL` (object, line 3), `leadEls.viewKanban` (DOM element, line 25) — all pre-existing, unchanged.
- Consumes: `.kanban-col-aberta`, `.kanban-col-title`, `.kanban-col-chevron` CSS classes from Task 3.
- Produces: module-level `let kanbanColunaAberta` — no other file reads this.

- [ ] **Step 1: Add the accordion state variable**

Find (`leads-app.js` line 145):
```js
const KANBAN_COLUNAS = ["a_contatar", "contatado", "proposta_enviada", "fechado", "perdido"];
```

Replace with:
```js
const KANBAN_COLUNAS = ["a_contatar", "contatado", "proposta_enviada", "fechado", "perdido"];
let kanbanColunaAberta = "a_contatar";
```

- [ ] **Step 2: Rewrite `renderKanban` to emit the accordion markup**

Find:
```js
function renderKanban(filtrados) {
  leadEls.viewKanban.innerHTML = KANBAN_COLUNAS.map((statusKey) => {
    const cards = filtrados.filter((l) => l.status === statusKey);
    const cardsHtml = cards
      .map((l) => {
        const prioridadeSlug = (l.prioridade || "média").toLowerCase();
        const podeVoltar = statusKey !== "a_contatar";
        const podeAvancar = statusKey !== "fechado" && statusKey !== "perdido";
        const podePerder = statusKey !== "fechado" && statusKey !== "perdido";
        const botoes = [];
        if (podeVoltar) botoes.push(`<button type="button" class="kanban-btn" data-voltar="${l.id}">◀ Voltar</button>`);
        if (podeAvancar) botoes.push(`<button type="button" class="kanban-btn" data-avancar="${l.id}">Avançar ▶</button>`);
        if (podePerder) botoes.push(`<button type="button" class="kanban-btn perder" data-perder="${l.id}">Perdido</button>`);
        return `
          <div class="kanban-card" data-abrir="${l.id}">
            <div class="kanban-card-nome">${escapeHtmlLead(l.nome)}</div>
            <div class="kanban-card-meta">
              ${escapeHtmlLead(l.nicho) || "-"} · ${escapeHtmlLead(l.cidade) || "-"}
              <span class="badge badge-prioridade-${prioridadeSlug}">${escapeHtmlLead(l.prioridade)}</span>
            </div>
            <div class="kanban-card-actions">${botoes.join("")}</div>
          </div>
        `;
      })
      .join("");

    return `
      <div class="kanban-col">
        <div class="kanban-col-header">
          <span>${STATUS_LEAD_LABEL[statusKey]}</span>
          <span class="kanban-col-count">${cards.length}</span>
        </div>
        <div class="kanban-cards">${cardsHtml}</div>
      </div>
    `;
  }).join("");
}
```

Replace with:
```js
function renderKanban(filtrados) {
  leadEls.viewKanban.innerHTML = KANBAN_COLUNAS.map((statusKey) => {
    const cards = filtrados.filter((l) => l.status === statusKey);
    const cardsHtml = cards
      .map((l) => {
        const prioridadeSlug = (l.prioridade || "média").toLowerCase();
        const podeVoltar = statusKey !== "a_contatar";
        const podeAvancar = statusKey !== "fechado" && statusKey !== "perdido";
        const podePerder = statusKey !== "fechado" && statusKey !== "perdido";
        const botoes = [];
        if (podeVoltar) botoes.push(`<button type="button" class="kanban-btn" data-voltar="${l.id}">◀ Voltar</button>`);
        if (podeAvancar) botoes.push(`<button type="button" class="kanban-btn" data-avancar="${l.id}">Avançar ▶</button>`);
        if (podePerder) botoes.push(`<button type="button" class="kanban-btn perder" data-perder="${l.id}">Perdido</button>`);
        return `
          <div class="kanban-card" data-abrir="${l.id}">
            <div class="kanban-card-nome">${escapeHtmlLead(l.nome)}</div>
            <div class="kanban-card-meta">
              ${escapeHtmlLead(l.nicho) || "-"} · ${escapeHtmlLead(l.cidade) || "-"}
              <span class="badge badge-prioridade-${prioridadeSlug}">${escapeHtmlLead(l.prioridade)}</span>
            </div>
            <div class="kanban-card-actions">${botoes.join("")}</div>
          </div>
        `;
      })
      .join("");

    const aberta = statusKey === kanbanColunaAberta ? " kanban-col-aberta" : "";

    return `
      <div class="kanban-col${aberta}">
        <button type="button" class="kanban-col-header" data-toggle="${statusKey}">
          <span class="kanban-col-title">
            <span>${STATUS_LEAD_LABEL[statusKey]}</span>
            <span class="kanban-col-count">${cards.length}</span>
          </span>
          <span class="kanban-col-chevron">▾</span>
        </button>
        <div class="kanban-cards">${cardsHtml}</div>
      </div>
    `;
  }).join("");
}
```

- [ ] **Step 3: Handle the toggle click alongside the existing action clicks**

Find:
```js
leadEls.viewKanban.addEventListener("click", (e) => {
  const idVoltar = e.target.dataset.voltar;
  const idAvancar = e.target.dataset.avancar;
  const idPerder = e.target.dataset.perder;
  if (idVoltar) return voltarStatus(idVoltar);
  if (idAvancar) return avancarStatus(idAvancar);
  if (idPerder) return mudarStatusLead(idPerder, "perdido");

  const card = e.target.closest("[data-abrir]");
  if (card) {
    const lead = encontrarLead(card.dataset.abrir);
    if (lead) abrirModalLead(lead);
  }
});
```

Replace with:
```js
leadEls.viewKanban.addEventListener("click", (e) => {
  const idVoltar = e.target.dataset.voltar;
  const idAvancar = e.target.dataset.avancar;
  const idPerder = e.target.dataset.perder;
  if (idVoltar) return voltarStatus(idVoltar);
  if (idAvancar) return avancarStatus(idAvancar);
  if (idPerder) return mudarStatusLead(idPerder, "perdido");

  const toggle = e.target.closest("[data-toggle]");
  if (toggle) {
    const statusKey = toggle.dataset.toggle;
    kanbanColunaAberta = kanbanColunaAberta === statusKey ? null : statusKey;
    return renderKanban(leadsFiltrados());
  }

  const card = e.target.closest("[data-abrir]");
  if (card) {
    const lead = encontrarLead(card.dataset.abrir);
    if (lead) abrirModalLead(lead);
  }
});
```

- [ ] **Step 4: Verify accordion behavior in the browser at mobile width**

Reload `leads.html` in the preview tab, resize to mobile preset, click "Kanban" toggle, screenshot.
Expected: "A contatar" column expanded (cards visible, chevron pointing down), other 4 columns collapsed to a single header row each with chevron pointing left (rotated -90deg).

Click the "Em conversa"/"Contatado" column header, screenshot again.
Expected: that column's cards now visible, "A contatar" collapses back to a header row. Only one column expanded at a time.

Click "Avançar ▶" on a card inside the open column.
Expected: card moves to the next status column, and the accordion stays on the column the user was viewing if that status is still `kanbanColunaAberta`, or the newly re-rendered board reflects the move without JS errors (check `mcp__Claude_Browser__read_console_messages` for errors).

- [ ] **Step 5: Verify desktop Kanban is unaffected**

Resize to desktop preset, screenshot.
Expected: all 5 columns visible side by side as before (the `:not(.kanban-col-aberta)` collapse rule only applies inside the `max-width: 768px` media query).

- [ ] **Step 6: Commit**

```bash
git add leads-app.js
git commit -m "feat: collapse kanban columns into an accordion on mobile"
```

---

### Task 5: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Desktop walkthrough of Clientes**

Navigate to `index.html` at desktop preset. Click "+ Novo cliente", fill the form (`f-nome` = "Teste Cliente"), submit, confirm it appears in the table. Edit it, delete it. Screenshot at each step, check `read_console_messages` for errors.

- [ ] **Step 2: Mobile walkthrough of Clientes**

Resize to mobile preset, repeat: open modal, create, edit, delete a client. Confirm modal inputs are comfortably tappable and the bottom nav stays visible and functional throughout.

- [ ] **Step 3: Desktop walkthrough of Leads**

Navigate to `leads.html` at desktop preset. Use search box and each filter dropdown, switch between Lista/Kanban views, open "Importar CSV" modal and close it without importing. Screenshot, check console.

- [ ] **Step 4: Mobile walkthrough of Leads**

Resize to mobile preset. Repeat search/filters, Lista view (confirm leads cards are visibly shorter than before — label/value on the same line, not stacked), Kanban view accordion (confirm only one column open at a time, "A contatar" open by default), open a lead's edit modal from a Kanban card.

- [ ] **Step 5: Confirm no regressions in existing data files**

Run: `git diff --stat 4eb3e4bbdc36e90bd7d7aa43c216d00c05a03879 -- app.js leads-app.js leads-data.js data.js`
Expected: only `leads-app.js` shows changes (from Task 4), and the diff is limited to the three edits made in that task — `app.js`, `leads-data.js`, `data.js` show zero changes.

- [ ] **Step 6: Final commit if any fixups were needed during the regression pass**

```bash
git add -A
git commit -m "fix: address issues found in mobile redesign regression pass"
```

(Skip this step if no fixes were needed.)
