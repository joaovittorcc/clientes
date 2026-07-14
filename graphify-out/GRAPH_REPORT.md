# Graph Report - .  (2026-07-13)

## Corpus Check
- Corpus is ~883 words - fits in a single context window. You may not need a graph.

## Summary
- 48 nodes · 49 edges · 15 communities (5 shown, 10 thin omitted)
- Extraction: 47% EXTRACTED · 51% INFERRED · 2% AMBIGUOUS · INFERRED: 25 edges (avg confidence: 0.81)
- Token cost: 58,558 input · 0 output

## Community Hubs (Navigation)
- Client Form Fields & Stats
- App State & Bootstrap
- Client Modal & Actions
- Render & Formatting Helpers
- Client CRUD Operations
- Seed Data
- Payment Status & Pending Amount
- Status Filter
- App Container
- Observations Field
- Stats Panel
- Clients Table Body
- Search & Filter Toolbar
- Topbar Header
- Empty State Message

## God Nodes (most connected - your core abstractions)
1. `Clients Table (#tabela-clientes)` - 14 edges
2. `render()` - 6 edges
3. `onSubmit()` - 4 edges
4. `excluirCliente()` - 4 edges
5. `saveClientes()` - 3 edges
6. `formatMoeda()` - 3 edges
7. `atualizarStats()` - 3 edges
8. `fecharModal()` - 3 edges
9. `Client Modal Overlay (#modal-overlay)` - 3 edges
10. `escapeHtml()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Amount Receivable Stat (#stat-pendente)` --shares_data_with--> `Clients Table (#tabela-clientes)`  [INFERRED]
  index.html → index.html  _Bridges community 6 → community 0_
- `Status Filter Select (#filtro-status)` --shares_data_with--> `Clients Table (#tabela-clientes)`  [INFERRED]
  index.html → index.html  _Bridges community 7 → community 0_
- `excluirCliente()` --calls--> `render()`  [EXTRACTED]
  app.js → app.js  _Bridges community 3 → community 4_

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cliente data model flows across form, table, and stats** — index_form_cliente, index_tabela_clientes, index_stats_panel [INFERRED 0.85]
- **Search input and status filter jointly narrow the clients table** — index_busca, index_filtro_status, index_tabela_clientes [INFERRED 0.85]
- **Add/edit client modal workflow (new client button, modal, form, delete)** — index_btn_novo, index_modal_overlay, index_form_cliente, index_btn_excluir [INFERRED 0.85]

## Communities (15 total, 10 thin omitted)

### Community 0 - "Client Form Fields & Stats"
Cohesion: 0.18
Nodes (11): Search Input (#busca), Email Field (#f-email), Company Field (#f-empresa), Name Field (#f-nome), Service Field (#f-servico), Phone Field (#f-telefone), Value Field (#f-valor), In-Progress Stat (#stat-andamento) (+3 more)

### Community 1 - "App State & Bootstrap"
Cohesion: 0.25
Nodes (4): clientes, els, PAGAMENTO_LABEL, STATUS_LABEL

### Community 2 - "Client Modal & Actions"
Cohesion: 0.25
Nodes (8): Cancel Button (#btn-cancelar), Delete Client Button (#btn-excluir), Close Modal Button (#btn-fechar), Novo Cliente Button (#btn-novo), Hidden Client ID Field (#cliente-id), Client Form (#form-cliente), Client Modal Overlay (#modal-overlay), Modal Title (#modal-title)

### Community 3 - "Render & Formatting Helpers"
Cohesion: 0.67
Nodes (4): atualizarStats(), escapeHtml(), formatMoeda(), render()

### Community 4 - "Client CRUD Operations"
Cohesion: 0.67
Nodes (4): excluirCliente(), fecharModal(), onSubmit(), saveClientes()

## Ambiguous Edges - Review These
- `Modal Title (#modal-title)` → `Hidden Client ID Field (#cliente-id)`  [AMBIGUOUS]
  index.html · relation: conceptually_related_to

## Knowledge Gaps
- **25 isolated node(s):** `STATUS_LABEL`, `PAGAMENTO_LABEL`, `els`, `clientes`, `SEED_CLIENTES` (+20 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **10 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Modal Title (#modal-title)` and `Hidden Client ID Field (#cliente-id)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Clients Table (#tabela-clientes)` connect `Client Form Fields & Stats` to `Payment Status & Pending Amount`, `Status Filter`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Are the 14 inferred relationships involving `Clients Table (#tabela-clientes)` (e.g. with `Search Input (#busca)` and `Email Field (#f-email)`) actually correct?**
  _`Clients Table (#tabela-clientes)` has 14 INFERRED edges - model-reasoned connections that need verification._
- **What connects `STATUS_LABEL`, `PAGAMENTO_LABEL`, `els` to the rest of the system?**
  _25 weakly-connected nodes found - possible documentation gaps or missing edges._