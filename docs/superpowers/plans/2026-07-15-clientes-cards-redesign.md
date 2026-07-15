# Clientes Cards Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Clientes table with a grid of detailed cards (cover photo, negotiable value range vs. closed value, demo link, quick note, checklist-driven progress) while leaving Leads and every other page untouched.

**Architecture:** Same static-site pattern as the rest of the project — no build step, no backend. `data.js` seed and `localStorage` gain new client fields; `app.js` gets a migration pass for old records, a card renderer replacing the table renderer, and small inline-edit handlers (checklist toggle, quick note, demo link, cover photo) that mutate `clientes` and re-render. `index.html` swaps the `<table>` markup for a grid container and expands the edit modal. `style.css` gains the card component styles.

**Tech Stack:** Plain HTML/CSS/JS, no build step, no test framework. Verification is via browser (`mcp__Claude_Browser__preview_start` with `{"name": "static-site"}`, reload after every edit — static file server, no HMR).

## Global Constraints

- No changes to `leads.html`, `leads-app.js`, `leads-data.js`, `leads-style.css`, `data/leads_seed.csv`, `scripts/build-leads-seed.js` — Leads page and Kanban are out of scope entirely.
- Everything stays 100% local: `localStorage` + `data.js` seed, no server, no external upload. Cover photo is a base64 data URL from `FileReader.readAsDataURL`.
- Reuse existing Dark Premium tokens from `style.css` (`--bg`, `--bg-card`, `--bg-card-hover`, `--border`, `--text`, `--text-muted`, `--accent`, `--accent-soft`, `--green`, `--red`, `--radius`, `--radius-sm`) — no new color tokens.
- Single breakpoint `@media (max-width: 768px)`, matching the rest of the site.
- Exact field names on the client object: `valor_min`, `valor_max`, `valor_fechado`, `demo_url`, `nota_rapida`, `checklist` (array of `{ texto: string, feito: boolean }`), `foto_capa` (string data-URL or `null`). The old single `valor` field is removed.
- Default checklist for a brand-new client (created via "+ Novo cliente"): `["Proposta enviada", "Demo enviada", "Aprovação do cliente", "Site no ar", "Pagamento recebido"]`, all `feito: false`.
- "A receber" stat: for every client with `pagamento !== "pago"`, sum `valor_fechado` if set, else `valor_max` (0 if both are null/unset).

---

### Task 1: Data model, migration, and seed update

**Files:**
- Modify: `data.js` (all 4 seed clients)
- Modify: `app.js:33-48` (add migration + value-formatting helpers, apply migration at boot)
- Modify: `app.js:106` (Valor table cell — still a table in this task, Task 2 replaces it)
- Modify: `app.js:124-127` (`atualizarStats` — "A receber" calc)
- Modify: `app.js:167` (`onSubmit`'s `dados` object — drop the stray `valor` line so re-saving via the still-old modal doesn't reintroduce the removed field)

**Interfaces:**
- Produces: `migrarCliente(c)` — pure function, takes one client object, returns a new object with `valor` removed and `valor_min`/`valor_max`/`valor_fechado`/`demo_url`/`nota_rapida`/`checklist`/`foto_capa` guaranteed present (existing values kept, missing ones defaulted). Task 2+ code can assume every client in the `clientes` array already has these fields.
- Produces: `formatarValorCliente(c)` — takes one client object, returns `{ texto: string, label: "fechado"|"faixa"|"" }`. Task 2's card renderer uses this directly.
- Consumes: `formatMoeda` (existing, `app.js:46`), unchanged signature.

- [ ] **Step 1: Update the 4 seed clients in `data.js`**

Find (Centro Odonto, lines 12-17):
```js
    servico: "Site institucional",
    status: "andamento",
    valor: 1500,
    pagamento: "pendente",
    obs: "Clínica odontológica independente (não é rede), Anápolis-GO. Endereço: R. Luís França, 234 - Jundiaí, Anápolis - GO, 75110-760. Avaliação 4,9 (79 avaliações). Sem site próprio — aparece só em diretórios agregadores (Doctoralia, DentMap, Anápolis Club). Contato só por WhatsApp/telefone.\n\nInstitucional + agendamento WhatsApp. Faixa negociável: R$1.200–1.500.\n\nAbordagem sugerida (WhatsApp): \"Olá, equipe da Centro Odonto, tudo bem? Meu nome é João Vittor, sou desenvolvedor na Evodev Studio, baseado aqui na região de Pires do Rio / Anápolis. Estava buscando indicações de clínicas odontológicas de confiança em Jundiaí e encontrei o perfil de vocês com excelentes avaliações no Google Maps (média de 4.9!). Vi que vocês são uma clínica independente super conceituada, mas notei que ainda não possuem um site institucional próprio para agendamentos e apresentação dos tratamentos (implantes, estética, etc.). Hoje em dia, muitos pacientes buscam no Google antes de fechar tratamentos de maior valor, e a falta de um site próprio faz com que vocês percam espaço para redes de franquias que têm páginas pesadas na internet. Eu crio páginas focadas em conversão, agendamento facilitado via WhatsApp e apresentação profissional da equipe médica para o mercado de saúde. Poderíamos agendar uma conversa rápida de 5 minutos, sem compromisso, para eu lhes mostrar como um site exclusivo pode aumentar as consultas particulares de vocês? Obrigado pela atenção!\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
```

Replace with:
```js
    servico: "Site institucional",
    status: "andamento",
    valor_min: 1200,
    valor_max: 1500,
    valor_fechado: null,
    demo_url: "",
    nota_rapida: "",
    foto_capa: null,
    checklist: [
      { texto: "Proposta enviada", feito: true },
      { texto: "Demo enviada", feito: false },
      { texto: "Aprovação do cliente", feito: false },
      { texto: "Site no ar", feito: false },
      { texto: "Pagamento recebido", feito: false },
    ],
    pagamento: "pendente",
    obs: "Clínica odontológica independente (não é rede), Anápolis-GO. Endereço: R. Luís França, 234 - Jundiaí, Anápolis - GO, 75110-760. Avaliação 4,9 (79 avaliações). Sem site próprio — aparece só em diretórios agregadores (Doctoralia, DentMap, Anápolis Club). Contato só por WhatsApp/telefone.\n\nInstitucional + agendamento WhatsApp. Faixa negociável: R$1.200–1.500.\n\nAbordagem sugerida (WhatsApp): \"Olá, equipe da Centro Odonto, tudo bem? Meu nome é João Vittor, sou desenvolvedor na Evodev Studio, baseado aqui na região de Pires do Rio / Anápolis. Estava buscando indicações de clínicas odontológicas de confiança em Jundiaí e encontrei o perfil de vocês com excelentes avaliações no Google Maps (média de 4.9!). Vi que vocês são uma clínica independente super conceituada, mas notei que ainda não possuem um site institucional próprio para agendamentos e apresentação dos tratamentos (implantes, estética, etc.). Hoje em dia, muitos pacientes buscam no Google antes de fechar tratamentos de maior valor, e a falta de um site próprio faz com que vocês percam espaço para redes de franquias que têm páginas pesadas na internet. Eu crio páginas focadas em conversão, agendamento facilitado via WhatsApp e apresentação profissional da equipe médica para o mercado de saúde. Poderíamos agendar uma conversa rápida de 5 minutos, sem compromisso, para eu lhes mostrar como um site exclusivo pode aumentar as consultas particulares de vocês? Obrigado pela atenção!\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
```

Find (Poesia Arquitetura, lines 25-30 of the original file):
```js
    servico: "Site institucional",
    status: "andamento",
    valor: 1400,
    pagamento: "pendente",
    obs: "Escritório de arquitetura, Anápolis-GO. Endereço: London Eye Offices - Av. Sen. José Lourenço Dias - St. Central, Anápolis - GO, 75020-010. Redes: linktr.ee/poesiaarquitetura. Avaliação 5,0 (13 avaliações). Só Linktree, sem site dedicado — forte fit pro portfólio/institucional, já que arquitetura vive de mostrar projeto visualmente.\n\nPortfólio visual de projetos. Faixa negociável: R$1.200–1.400.\n\nAbordagem sugerida (WhatsApp): \"Olá, [Nome do Responsável / Equipe do Poesia Arquitetura], tudo bem? Me chamo João Vittor, sou desenvolvedor aqui no estado de Goiás (Evodev Studio) e acompanho muito o mercado de arquitetura de Anápolis. Estava avaliando os projetos incríveis e a excelente reputação que vocês construíram no Google Maps (nota máxima!) e notei que vocês utilizam o Linktree como ponto principal de contato. Como o trabalho de vocês é extremamente visual e de alto padrão, o Linktree acaba limitando a experiência do cliente ao não exibir de cara o portfólio de vocês de forma profissional, fluida e rápida. Eu desenvolvo plataformas de portfólio sob medida, rápidas e focadas em encantar o cliente logo no primeiro clique, trazendo muito mais valor aos projetos de interiores e residenciais de vocês. Vocês teriam 5 minutos nesta semana para eu mostrar como podemos transformar seu Linktree em um site exclusivo que faça jus à qualidade dos seus projetos? Um abraço!\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
```

Replace with:
```js
    servico: "Site institucional",
    status: "andamento",
    valor_min: 1200,
    valor_max: 1400,
    valor_fechado: null,
    demo_url: "",
    nota_rapida: "",
    foto_capa: null,
    checklist: [
      { texto: "Proposta enviada", feito: true },
      { texto: "Demo enviada", feito: false },
      { texto: "Aprovação do cliente", feito: false },
      { texto: "Site no ar", feito: false },
      { texto: "Pagamento recebido", feito: false },
    ],
    pagamento: "pendente",
    obs: "Escritório de arquitetura, Anápolis-GO. Endereço: London Eye Offices - Av. Sen. José Lourenço Dias - St. Central, Anápolis - GO, 75020-010. Redes: linktr.ee/poesiaarquitetura. Avaliação 5,0 (13 avaliações). Só Linktree, sem site dedicado — forte fit pro portfólio/institucional, já que arquitetura vive de mostrar projeto visualmente.\n\nPortfólio visual de projetos. Faixa negociável: R$1.200–1.400.\n\nAbordagem sugerida (WhatsApp): \"Olá, [Nome do Responsável / Equipe do Poesia Arquitetura], tudo bem? Me chamo João Vittor, sou desenvolvedor aqui no estado de Goiás (Evodev Studio) e acompanho muito o mercado de arquitetura de Anápolis. Estava avaliando os projetos incríveis e a excelente reputação que vocês construíram no Google Maps (nota máxima!) e notei que vocês utilizam o Linktree como ponto principal de contato. Como o trabalho de vocês é extremamente visual e de alto padrão, o Linktree acaba limitando a experiência do cliente ao não exibir de cara o portfólio de vocês de forma profissional, fluida e rápida. Eu desenvolvo plataformas de portfólio sob medida, rápidas e focadas em encantar o cliente logo no primeiro clique, trazendo muito mais valor aos projetos de interiores e residenciais de vocês. Vocês teriam 5 minutos nesta semana para eu mostrar como podemos transformar seu Linktree em um site exclusivo que faça jus à qualidade dos seus projetos? Um abraço!\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
```

Find (Anderson Junio, lines 38-43 of the original file):
```js
    servico: "Site institucional",
    status: "andamento",
    valor: 1800,
    pagamento: "pendente",
    obs: "Arquiteto/urbanista independente, mais de 10 anos de mercado, atuação residencial/comercial/industrial. Anápolis-GO. Endereço: Condomínio Residencial Havilah - R. 22, Q. A - Nº 38, bloco 05, A44 - Chácaras Americanas, Anápolis - GO, 75103-205. Redes: linktr.ee/andersonjunio_arq · Instagram @anderson_arquiteto (2.107 seguidores) · LinkedIn · Facebook. Avaliação 5,0 (26 avaliações). Sem site próprio, só Linktree/redes sociais. Junto com Poesia Arquitetura, indica que arquitetos independentes em Anápolis sem site são um nicho recorrente bom pra prospectar.\n\nPortfólio + múltiplas frentes (residencial/comercial/industrial), mais páginas. Faixa negociável: R$1.500–1.800.\n\nAbordagem sugerida (WhatsApp): \"Olá, [Nome do Responsável / Equipe do Anderson Junio], tudo bem? Me chamo João Vittor, sou desenvolvedor aqui no estado de Goiás (Evodev Studio) e acompanho muito o mercado de arquitetura de Anápolis. Estava avaliando os projetos incríveis e a excelente reputação que vocês construíram no Google Maps (nota máxima!) e notei que vocês utilizam o Linktree como ponto principal de contato. Como o trabalho de vocês é extremamente visual e de alto padrão, o Linktree acaba limitando a experiência do cliente ao não exibir de cara o portfólio de vocês de forma profissional, fluida e rápida. Eu desenvolvo plataformas de portfólio sob medida, rápidas e focadas em encantar o cliente logo no primeiro clique, trazendo muito mais valor aos projetos de interiores e residenciais de vocês. Vocês teriam 5 minutos nesta semana para eu mostrar como podemos transformar seu Linktree em um site exclusivo que faça jus à qualidade dos seus projetos? Um abraço!\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
```

Replace with:
```js
    servico: "Site institucional",
    status: "andamento",
    valor_min: 1500,
    valor_max: 1800,
    valor_fechado: null,
    demo_url: "",
    nota_rapida: "",
    foto_capa: null,
    checklist: [
      { texto: "Proposta enviada", feito: true },
      { texto: "Demo enviada", feito: false },
      { texto: "Aprovação do cliente", feito: false },
      { texto: "Site no ar", feito: false },
      { texto: "Pagamento recebido", feito: false },
    ],
    pagamento: "pendente",
    obs: "Arquiteto/urbanista independente, mais de 10 anos de mercado, atuação residencial/comercial/industrial. Anápolis-GO. Endereço: Condomínio Residencial Havilah - R. 22, Q. A - Nº 38, bloco 05, A44 - Chácaras Americanas, Anápolis - GO, 75103-205. Redes: linktr.ee/andersonjunio_arq · Instagram @anderson_arquiteto (2.107 seguidores) · LinkedIn · Facebook. Avaliação 5,0 (26 avaliações). Sem site próprio, só Linktree/redes sociais. Junto com Poesia Arquitetura, indica que arquitetos independentes em Anápolis sem site são um nicho recorrente bom pra prospectar.\n\nPortfólio + múltiplas frentes (residencial/comercial/industrial), mais páginas. Faixa negociável: R$1.500–1.800.\n\nAbordagem sugerida (WhatsApp): \"Olá, [Nome do Responsável / Equipe do Anderson Junio], tudo bem? Me chamo João Vittor, sou desenvolvedor aqui no estado de Goiás (Evodev Studio) e acompanho muito o mercado de arquitetura de Anápolis. Estava avaliando os projetos incríveis e a excelente reputação que vocês construíram no Google Maps (nota máxima!) e notei que vocês utilizam o Linktree como ponto principal de contato. Como o trabalho de vocês é extremamente visual e de alto padrão, o Linktree acaba limitando a experiência do cliente ao não exibir de cara o portfólio de vocês de forma profissional, fluida e rápida. Eu desenvolvo plataformas de portfólio sob medida, rápidas e focadas em encantar o cliente logo no primeiro clique, trazendo muito mais valor aos projetos de interiores e residenciais de vocês. Vocês teriam 5 minutos nesta semana para eu mostrar como podemos transformar seu Linktree em um site exclusivo que faça jus à qualidade dos seus projetos? Um abraço!\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
```

Find (Pedro Xavier Advogados, lines 51-56 of the original file):
```js
    servico: "Site institucional",
    status: "andamento",
    valor: 2500,
    pagamento: "pendente",
    obs: "Escritório de advocacia, Anápolis-GO. Endereço: R. do Carmo, 9 - Jundiaí, Anápolis - GO, 75113-050. Avaliação 4,9 (244 avaliações — volume muito alto pro setor). Sem site próprio — só Jusbrasil, CNPJ.biz e Facebook modesto (113 curtidas). Negócio grande e ativo sem presença digital própria. Pacote institucional cotado: R$1.200 (área de atuação, prova social com as 244 avaliações, contato direto).\n\nInstitucional jurídico, compliance visual OAB, alta prova social (244 avaliações). Faixa negociável: R$1.800–2.500.\n\nAbordagem sugerida (WhatsApp): \"Olá, Dr. Pedro Xavier e equipe, tudo bem? Me chamo João Vittor, sou desenvolvedor e fundador da Evodev Studio. Estava analisando os escritórios de advocacia mais influentes de Anápolis e o Pedro Xavier Advogados me chamou muito a atenção: vocês têm um volume impressionante de avaliações cinco estrelas (mais de 240!), o que mostra uma autoridade gigantesca na região. Contudo, reparei que essa forte autoridade ainda não está consolidada em um domínio próprio na internet (hoje o escritório depende de páginas de terceiros como o Jusbrasil e redes sociais). Para um escritório com esse porte e reputação, ter um site institucional limpo, seguro e elegante é fundamental para passar segurança a novos clientes corporativos e de alta renda, além de centralizar as áreas de atuação e o contato direto de forma organizada. Desenvolvo sites institucionais modernos específicos para o setor jurídico, respeitando as normas da OAB e focando em credibilidade. Podemos agendar uma ligação rápida de 5 minutos para que eu mostre como podemos estruturar essa presença digital do escritório? Atenciosamente, João Vittor C. Castro\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
];
```

Replace with:
```js
    servico: "Site institucional",
    status: "andamento",
    valor_min: 1800,
    valor_max: 2500,
    valor_fechado: null,
    demo_url: "",
    nota_rapida: "",
    foto_capa: null,
    checklist: [
      { texto: "Proposta enviada", feito: true },
      { texto: "Demo enviada", feito: false },
      { texto: "Aprovação do cliente", feito: false },
      { texto: "Site no ar", feito: false },
      { texto: "Pagamento recebido", feito: false },
    ],
    pagamento: "pendente",
    obs: "Escritório de advocacia, Anápolis-GO. Endereço: R. do Carmo, 9 - Jundiaí, Anápolis - GO, 75113-050. Avaliação 4,9 (244 avaliações — volume muito alto pro setor). Sem site próprio — só Jusbrasil, CNPJ.biz e Facebook modesto (113 curtidas). Negócio grande e ativo sem presença digital própria. Pacote institucional cotado: R$1.200 (área de atuação, prova social com as 244 avaliações, contato direto).\n\nInstitucional jurídico, compliance visual OAB, alta prova social (244 avaliações). Faixa negociável: R$1.800–2.500.\n\nAbordagem sugerida (WhatsApp): \"Olá, Dr. Pedro Xavier e equipe, tudo bem? Me chamo João Vittor, sou desenvolvedor e fundador da Evodev Studio. Estava analisando os escritórios de advocacia mais influentes de Anápolis e o Pedro Xavier Advogados me chamou muito a atenção: vocês têm um volume impressionante de avaliações cinco estrelas (mais de 240!), o que mostra uma autoridade gigantesca na região. Contudo, reparei que essa forte autoridade ainda não está consolidada em um domínio próprio na internet (hoje o escritório depende de páginas de terceiros como o Jusbrasil e redes sociais). Para um escritório com esse porte e reputação, ter um site institucional limpo, seguro e elegante é fundamental para passar segurança a novos clientes corporativos e de alta renda, além de centralizar as áreas de atuação e o contato direto de forma organizada. Desenvolvo sites institucionais modernos específicos para o setor jurídico, respeitando as normas da OAB e focando em credibilidade. Podemos agendar uma ligação rápida de 5 minutos para que eu mostre como podemos estruturar essa presença digital do escritório? Atenciosamente, João Vittor C. Castro\" — enviar junto com demo do site.",
    origem: "pesquisa_web",
  },
];
```

- [ ] **Step 2: Add migration and value-formatting helpers to `app.js`, apply migration at boot**

Find (`app.js` lines 42-49):
```js
function saveClientes(clientes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

function formatMoeda(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
```

Replace with:
```js
function saveClientes(clientes) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes));
}

function formatMoeda(valor) {
  const n = Number(valor) || 0;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function migrarCliente(c) {
  const migrado = { ...c };
  if (migrado.valor !== undefined) {
    if (migrado.valor_min === undefined) migrado.valor_min = migrado.valor;
    if (migrado.valor_max === undefined) migrado.valor_max = migrado.valor;
    delete migrado.valor;
  }
  if (migrado.valor_min === undefined) migrado.valor_min = null;
  if (migrado.valor_max === undefined) migrado.valor_max = null;
  if (migrado.valor_fechado === undefined) migrado.valor_fechado = null;
  if (migrado.demo_url === undefined) migrado.demo_url = "";
  if (migrado.nota_rapida === undefined) migrado.nota_rapida = "";
  if (migrado.checklist === undefined) migrado.checklist = [];
  if (migrado.foto_capa === undefined) migrado.foto_capa = null;
  return migrado;
}

function formatarValorCliente(c) {
  if (c.valor_fechado) {
    return { texto: formatMoeda(c.valor_fechado), label: "fechado" };
  }
  if (c.valor_min || c.valor_max) {
    return { texto: `${formatMoeda(c.valor_min)} – ${formatMoeda(c.valor_max)}`, label: "faixa" };
  }
  return { texto: "Valor a definir", label: "" };
}
```

- [ ] **Step 3: Apply the migration to the boot-time client list**

Find (`app.js`, currently around line 75):
```js
let clientes = mesclarSeed(loadClientes(), typeof SEED_CLIENTES !== "undefined" ? SEED_CLIENTES : []);
saveClientes(clientes);
```

Replace with:
```js
let clientes = mesclarSeed(loadClientes(), typeof SEED_CLIENTES !== "undefined" ? SEED_CLIENTES : []).map(migrarCliente);
saveClientes(clientes);
```

- [ ] **Step 4: Use the new value formatter in the (still-table) Valor cell**

Find (`app.js`, currently around line 106):
```js
      <td data-label="Valor">${formatMoeda(c.valor)}</td>
```

Replace with:
```js
      <td data-label="Valor">${formatarValorCliente(c).texto}</td>
```

- [ ] **Step 5: Update the "A receber" calculation**

Find (`app.js`, currently around lines 124-127):
```js
  const aReceber = clientes
    .filter((c) => c.pagamento !== "pago")
    .reduce((soma, c) => soma + (Number(c.valor) || 0), 0);
```

Replace with:
```js
  const aReceber = clientes
    .filter((c) => c.pagamento !== "pago")
    .reduce((soma, c) => soma + (Number(c.valor_fechado) || Number(c.valor_max) || 0), 0);
```

- [ ] **Step 6: Drop the stray `valor` line from `onSubmit`'s `dados` object**

Find (`app.js`, currently around lines 160-170):
```js
  const dados = {
    nome: document.getElementById("f-nome").value.trim(),
    empresa: document.getElementById("f-empresa").value.trim(),
    telefone: document.getElementById("f-telefone").value.trim(),
    email: document.getElementById("f-email").value.trim(),
    servico: document.getElementById("f-servico").value.trim(),
    status: document.getElementById("f-status").value,
    valor: document.getElementById("f-valor").value,
    pagamento: document.getElementById("f-pagamento").value,
    obs: document.getElementById("f-obs").value.trim(),
  };
```

Replace with:
```js
  const dados = {
    nome: document.getElementById("f-nome").value.trim(),
    empresa: document.getElementById("f-empresa").value.trim(),
    telefone: document.getElementById("f-telefone").value.trim(),
    email: document.getElementById("f-email").value.trim(),
    servico: document.getElementById("f-servico").value.trim(),
    status: document.getElementById("f-status").value,
    pagamento: document.getElementById("f-pagamento").value,
    obs: document.getElementById("f-obs").value.trim(),
  };
```

(The `f-valor` HTML input still exists and is now inert — Task 4 removes it from the modal and replaces it with the real faixa/fechado fields. Leaving it inert for one task is harmless: nothing reads its value anymore after this step.)

- [ ] **Step 7: Verify in the browser**

Start the preview server (`mcp__Claude_Browser__preview_start` with `{"name": "static-site"}`), navigate to `/index.html`, open browser devtools-equivalent via `mcp__Claude_Browser__javascript_tool` and run `localStorage.removeItem("clientes")`, then reload — this forces a fresh seed load through the new migration path.

Screenshot. Expected: table still renders (Task 2 hasn't touched markup yet), 4 rows, Valor column shows `R$1.200,00 – R$1.500,00` / `R$1.200,00 – R$1.400,00` / `R$1.500,00 – R$1.800,00` / `R$1.800,00 – R$2.500,00`. "A receber" stat card shows `R$7.200,00` (1500+1400+1800+2500). Check `mcp__Claude_Browser__read_console_messages` for errors.

- [ ] **Step 8: Commit**

```bash
git add data.js app.js
git commit -m "feat: migrate client valor to range + fechado, add card data model"
```

---

### Task 2: Card grid layout (read-only)

**Files:**
- Modify: `index.html:52-69` (table markup → grid container)
- Modify: `app.js` (`els` object, `render()`, click delegation on the list container)
- Modify: `style.css` (new card component styles, remove now-dead `.contato-linha` rules, mobile grid column)

**Interfaces:**
- Consumes: `formatarValorCliente(c)` from Task 1.
- Produces: `renderClienteCard(c)` — pure function, one client object in, HTML string out. Task 3 replaces this function's body (same name/signature) to add `data-*` attributes for inline editing.
- Produces: `els.grid` (replaces `els.tbody`) — the container Task 3's click delegation attaches to.

- [ ] **Step 1: Replace the table markup in `index.html`**

Find (`index.html` lines 52-69):
```html
    <section class="table-wrap">
      <table id="tabela-clientes">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Contato</th>
            <th>Empresa</th>
            <th>Serviço</th>
            <th>Status</th>
            <th>Valor</th>
            <th>Pagamento</th>
            <th></th>
          </tr>
        </thead>
        <tbody id="tbody-clientes"></tbody>
      </table>
      <p id="vazio" class="vazio" hidden>Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.</p>
    </section>
```

Replace with:
```html
    <section class="clientes-grid" id="clientes-grid"></section>
    <p id="vazio" class="vazio" hidden>Nenhum cliente cadastrado ainda. Clique em "Novo cliente" para começar.</p>
```

- [ ] **Step 2: Update `els` in `app.js`**

Find (`app.js` lines 15-31):
```js
const els = {
  tbody: document.getElementById("tbody-clientes"),
  vazio: document.getElementById("vazio"),
  busca: document.getElementById("busca"),
  filtroStatus: document.getElementById("filtro-status"),
  overlay: document.getElementById("modal-overlay"),
  modalTitle: document.getElementById("modal-title"),
  form: document.getElementById("form-cliente"),
  btnNovo: document.getElementById("btn-novo"),
  btnFechar: document.getElementById("btn-fechar"),
  btnCancelar: document.getElementById("btn-cancelar"),
  btnExcluir: document.getElementById("btn-excluir"),
  statTotal: document.getElementById("stat-total"),
  statAndamento: document.getElementById("stat-andamento"),
  statConcluido: document.getElementById("stat-concluido"),
  statPendente: document.getElementById("stat-pendente"),
};
```

Replace with:
```js
const els = {
  grid: document.getElementById("clientes-grid"),
  vazio: document.getElementById("vazio"),
  busca: document.getElementById("busca"),
  filtroStatus: document.getElementById("filtro-status"),
  overlay: document.getElementById("modal-overlay"),
  modalTitle: document.getElementById("modal-title"),
  form: document.getElementById("form-cliente"),
  btnNovo: document.getElementById("btn-novo"),
  btnFechar: document.getElementById("btn-fechar"),
  btnCancelar: document.getElementById("btn-cancelar"),
  btnExcluir: document.getElementById("btn-excluir"),
  statTotal: document.getElementById("stat-total"),
  statAndamento: document.getElementById("stat-andamento"),
  statConcluido: document.getElementById("stat-concluido"),
  statPendente: document.getElementById("stat-pendente"),
};
```

- [ ] **Step 3: Add `calcularProgresso` and `renderClienteCard`, rewrite `render()`**

Find (`app.js`, the entire `render()` function — currently lines 78-118):
```js
function render() {
  const termo = els.busca.value.trim().toLowerCase();
  const statusFiltro = els.filtroStatus.value;

  const filtrados = clientes.filter((c) => {
    const combinaTermo =
      !termo ||
      c.nome.toLowerCase().includes(termo) ||
      (c.empresa || "").toLowerCase().includes(termo) ||
      (c.servico || "").toLowerCase().includes(termo);
    const combinaStatus = !statusFiltro || c.status === statusFiltro;
    return combinaTermo && combinaStatus;
  });

  els.tbody.innerHTML = filtrados
    .map(
      (c) => `
    <tr data-id="${c.id}">
      <td data-label="Nome"><strong>${escapeHtml(c.nome)}</strong></td>
      <td data-label="Contato">
        <div class="contato-linha">
          <span>${escapeHtml(c.telefone) || "-"}</span>
          <span class="muted">${escapeHtml(c.email) || ""}</span>
        </div>
      </td>
      <td data-label="Empresa">${escapeHtml(c.empresa) || "-"}</td>
      <td data-label="Serviço">${escapeHtml(c.servico) || "-"}</td>
      <td data-label="Status"><span class="badge badge-${c.status}">${STATUS_LABEL[c.status] || c.status}</span></td>
      <td data-label="Valor">${formatarValorCliente(c).texto}</td>
      <td data-label="Pagamento"><span class="badge badge-${c.pagamento}">${PAGAMENTO_LABEL[c.pagamento] || c.pagamento}</span></td>
      <td><span class="row-excluir" data-excluir="${c.id}" title="Excluir">&times;</span></td>
    </tr>
  `
    )
    .join("");

  els.vazio.hidden = clientes.length > 0;
  els.tbody.parentElement.style.display = clientes.length === 0 ? "none" : "";

  atualizarStats();
}
```

Replace with:
```js
function calcularProgresso(checklist) {
  const lista = checklist || [];
  const total = lista.length;
  const feitos = lista.filter((item) => item.feito).length;
  const pct = total > 0 ? Math.round((feitos / total) * 100) : 0;
  return { feitos, total, pct };
}

function renderClienteCard(c) {
  const valorInfo = formatarValorCliente(c);
  const progresso = calcularProgresso(c.checklist);
  const checklist = c.checklist || [];
  const itensPreview = checklist.slice(0, 3);
  const resto = checklist.length - itensPreview.length;
  const capaStyle = c.foto_capa ? ` style="background-image:url('${c.foto_capa}')"` : "";

  const itensHtml = itensPreview
    .map(
      (item) => `
        <div class="cliente-checklist-item">
          <span>${item.feito ? "☑" : "☐"}</span>
          <span class="${item.feito ? "cliente-checklist-feito" : ""}">${escapeHtml(item.texto)}</span>
        </div>
      `
    )
    .join("");

  const notaTexto = c.nota_rapida ? escapeHtml(c.nota_rapida) : "Nenhuma nota ainda";
  const demoHtml = c.demo_url
    ? `<a class="cliente-demo" href="${escapeHtml(c.demo_url)}" target="_blank" rel="noopener">🔗 ${escapeHtml(c.demo_url)}</a>`
    : `<div class="cliente-demo cliente-demo-vazio">Sem link de demo ainda</div>`;

  return `
    <div class="cliente-card" data-id="${c.id}">
      <div class="cliente-capa"${capaStyle}>
        ${!c.foto_capa ? '<span class="cliente-capa-placeholder">+ Adicionar capa</span>' : ""}
        <span class="badge badge-${c.status} cliente-status-badge">${STATUS_LABEL[c.status] || c.status}</span>
      </div>
      <div class="cliente-card-body">
        <span class="row-excluir cliente-excluir" data-excluir="${c.id}" title="Excluir">&times;</span>
        <div class="cliente-nome">${escapeHtml(c.nome)}</div>
        <div class="cliente-telefone">${escapeHtml(c.telefone) || "-"}</div>

        <div class="cliente-nota">
          <span class="cliente-nota-icon">📌</span>
          <span class="cliente-nota-texto">${notaTexto}</span>
        </div>

        ${demoHtml}

        <div class="cliente-valor-linha">
          <span class="cliente-valor${valorInfo.label === "fechado" ? " cliente-valor-fechado" : ""}">${valorInfo.texto}</span>
          ${valorInfo.label ? `<span class="cliente-valor-label">${valorInfo.label}</span>` : ""}
        </div>

        <div class="cliente-progresso">
          <div class="cliente-progresso-topo">
            <span>Progresso</span>
            <span>${progresso.feitos}/${progresso.total} etapas</span>
          </div>
          <div class="cliente-progresso-barra">
            <div class="cliente-progresso-fill" style="width:${progresso.pct}%"></div>
          </div>
        </div>

        <div class="cliente-checklist">
          ${itensHtml}
          ${resto > 0 ? `<div class="cliente-checklist-mais">+${resto} etapas</div>` : ""}
        </div>
      </div>
    </div>
  `;
}

function render() {
  const termo = els.busca.value.trim().toLowerCase();
  const statusFiltro = els.filtroStatus.value;

  const filtrados = clientes.filter((c) => {
    const combinaTermo =
      !termo ||
      c.nome.toLowerCase().includes(termo) ||
      (c.empresa || "").toLowerCase().includes(termo) ||
      (c.servico || "").toLowerCase().includes(termo);
    const combinaStatus = !statusFiltro || c.status === statusFiltro;
    return combinaTermo && combinaStatus;
  });

  els.grid.innerHTML = filtrados.map(renderClienteCard).join("");

  els.vazio.hidden = clientes.length > 0;
  els.grid.style.display = clientes.length === 0 ? "none" : "";

  atualizarStats();
}
```

- [ ] **Step 4: Replace the table click delegation with grid click delegation**

Find (`app.js`, currently around lines 206-217):
```js
els.tbody.addEventListener("click", (e) => {
  const excluirId = e.target.dataset.excluir;
  if (excluirId) {
    excluirCliente(excluirId);
    return;
  }
  const tr = e.target.closest("tr");
  if (tr) {
    const cliente = clientes.find((c) => c.id === tr.dataset.id);
    if (cliente) abrirModal(cliente);
  }
});
```

Replace with:
```js
els.grid.addEventListener("click", (e) => {
  const excluirId = e.target.dataset.excluir;
  if (excluirId) {
    excluirCliente(excluirId);
    return;
  }
  if (e.target.closest("a")) return;
  const card = e.target.closest("[data-id]");
  if (card) {
    const cliente = clientes.find((c) => c.id === card.dataset.id);
    if (cliente) abrirModal(cliente);
  }
});
```

- [ ] **Step 5: Add card styles to `style.css`, remove dead `.contato-linha` rules**

Find (`style.css`, currently lines 277-286):
```css
.contato-linha {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contato-linha .muted {
  color: var(--text-muted);
  font-size: 0.8rem;
}

```

Replace with: (delete these two rules entirely — nothing else in the codebase references `.contato-linha`; confirmed via `grep -rn "contato-linha" .` returning only this file before the edit)
```css
```

Find (`style.css`, the closing brace of `.vazio` — currently lines 335-339):
```css
.vazio {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
}
```

Replace with:
```css
.vazio {
  text-align: center;
  color: var(--text-muted);
  padding: 40px 20px;
}

.clientes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.cliente-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
}

.cliente-capa {
  position: relative;
  height: 110px;
  background: linear-gradient(135deg, var(--bg-card-hover), var(--bg-card));
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cliente-capa-placeholder {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.cliente-status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
}

.cliente-card-body {
  position: relative;
  padding: 14px 16px;
}

.cliente-excluir {
  position: absolute;
  top: 10px;
  right: 12px;
  font-size: 1.2rem;
}

.cliente-nome {
  font-weight: 700;
  font-size: 0.95rem;
  padding-right: 20px;
}

.cliente-telefone {
  color: var(--text-muted);
  font-size: 0.8rem;
  margin-top: 2px;
}

.cliente-nota {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding: 7px 9px;
  background: var(--bg);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  font-size: 0.8rem;
}

.cliente-nota-texto {
  color: var(--text);
}

.cliente-demo {
  display: block;
  margin-top: 8px;
  padding: 7px 9px;
  background: var(--accent-soft);
  border: 1px solid rgba(46, 230, 168, 0.3);
  border-radius: var(--radius-sm);
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 600;
  text-decoration: none;
}

.cliente-demo-vazio {
  background: var(--bg);
  border: 1px dashed var(--border);
  color: var(--text-muted);
  font-weight: 400;
}

.cliente-valor-linha {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-top: 12px;
}

.cliente-valor {
  color: var(--text);
  font-size: 1.05rem;
  font-weight: 700;
}

.cliente-valor-fechado {
  color: var(--green);
}

.cliente-valor-label {
  color: var(--text-muted);
  font-size: 0.72rem;
  text-transform: uppercase;
}

.cliente-progresso {
  margin-top: 10px;
}

.cliente-progresso-topo {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: var(--text-muted);
  margin-bottom: 4px;
}

.cliente-progresso-barra {
  height: 6px;
  background: var(--bg);
  border-radius: 999px;
  overflow: hidden;
}

.cliente-progresso-fill {
  height: 100%;
  background: var(--accent);
}

.cliente-checklist {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.cliente-checklist-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.78rem;
  color: var(--text);
}

.cliente-checklist-feito {
  color: var(--text-muted);
  text-decoration: line-through;
}

.cliente-checklist-mais {
  color: var(--text-muted);
  font-size: 0.72rem;
  margin-top: 2px;
}
```

- [ ] **Step 6: Add the mobile grid column to the existing breakpoint**

Find (`style.css`, inside `@media (max-width: 768px)`, the `.stats` rule — currently around lines 473-475):
```css
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }
```

Replace with:
```css
  .stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .clientes-grid {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 7: Verify in the browser**

Reload `/index.html` at desktop width. Screenshot. Expected: 3-column grid of cards (4 clients → 3 + 1), each showing photo placeholder ("+ Adicionar capa"), status badge, name, phone, "Nenhuma nota ainda", "Sem link de demo ainda", value range (or "R$1.200,00 – R$1.500,00" style), progress bar (all at 20% — 1/5 items done), checklist preview with "Proposta enviada" checked (☑, strikethrough) and 2 more unchecked, "+2 etapas" text.

Click a card (not on the × or a link). Expected: edit modal opens (same modal as before, Task 1's field changes aside — still functional for existing fields).

Click a card's × directly. Expected: confirm dialog, then card removed, stats update.

Resize to mobile preset, screenshot. Expected: 1 card per row, full width.

Check `read_console_messages` for errors.

- [ ] **Step 8: Commit**

```bash
git add index.html app.js style.css
git commit -m "feat: replace clientes table with card grid"
```

---

### Task 3: Inline quick-edit (checklist, nota rápida, demo link, cover photo)

**Files:**
- Modify: `index.html` (add hidden file input for cover photo upload)
- Modify: `app.js` (extend `renderClienteCard`'s markup with `data-*` hooks, extend click delegation, add new handler functions and module state)
- Modify: `style.css` (cursor/hover affordances for the new interactive areas, inline nota input style)

**Interfaces:**
- Consumes: `renderClienteCard(c)`, `render()`, `els.grid` from Task 2.
- Produces: `toggleChecklistItem(id, itemIdx)`, `salvarNotaRapida(id, valor)`, `salvarDemoUrl(id, valor)`, `abrirSeletorCapa(id)` — none consumed by later tasks (Task 4 and 5 don't call these directly), documented for completeness.

- [ ] **Step 1: Add the hidden file input to `index.html`**

Find (`index.html`, right before the `<nav class="bottomnav">` block added by a previous redesign):
```html
  <nav class="bottomnav">
    <a href="index.html" class="active">Clientes</a>
    <a href="leads.html">Leads</a>
  </nav>
```

Replace with:
```html
  <input type="file" id="input-foto-capa" accept="image/*" hidden />

  <nav class="bottomnav">
    <a href="index.html" class="active">Clientes</a>
    <a href="leads.html">Leads</a>
  </nav>
```

- [ ] **Step 2: Add `data-*` hooks to `renderClienteCard`**

Find (`app.js`, inside `renderClienteCard`, the capa/nota/demo/checklist block written in Task 2):
```js
  return `
    <div class="cliente-card" data-id="${c.id}">
      <div class="cliente-capa"${capaStyle}>
        ${!c.foto_capa ? '<span class="cliente-capa-placeholder">+ Adicionar capa</span>' : ""}
        <span class="badge badge-${c.status} cliente-status-badge">${STATUS_LABEL[c.status] || c.status}</span>
      </div>
      <div class="cliente-card-body">
        <span class="row-excluir cliente-excluir" data-excluir="${c.id}" title="Excluir">&times;</span>
        <div class="cliente-nome">${escapeHtml(c.nome)}</div>
        <div class="cliente-telefone">${escapeHtml(c.telefone) || "-"}</div>

        <div class="cliente-nota">
          <span class="cliente-nota-icon">📌</span>
          <span class="cliente-nota-texto">${notaTexto}</span>
        </div>

        ${demoHtml}

        <div class="cliente-valor-linha">
          <span class="cliente-valor${valorInfo.label === "fechado" ? " cliente-valor-fechado" : ""}">${valorInfo.texto}</span>
          ${valorInfo.label ? `<span class="cliente-valor-label">${valorInfo.label}</span>` : ""}
        </div>

        <div class="cliente-progresso">
          <div class="cliente-progresso-topo">
            <span>Progresso</span>
            <span>${progresso.feitos}/${progresso.total} etapas</span>
          </div>
          <div class="cliente-progresso-barra">
            <div class="cliente-progresso-fill" style="width:${progresso.pct}%"></div>
          </div>
        </div>

        <div class="cliente-checklist">
          ${itensHtml}
          ${resto > 0 ? `<div class="cliente-checklist-mais">+${resto} etapas</div>` : ""}
        </div>
      </div>
    </div>
  `;
```

Replace with:
```js
  return `
    <div class="cliente-card" data-id="${c.id}">
      <div class="cliente-capa" data-capa="${c.id}"${capaStyle}>
        ${!c.foto_capa ? '<span class="cliente-capa-placeholder">+ Adicionar capa</span>' : ""}
        <span class="badge badge-${c.status} cliente-status-badge">${STATUS_LABEL[c.status] || c.status}</span>
      </div>
      <div class="cliente-card-body">
        <span class="row-excluir cliente-excluir" data-excluir="${c.id}" title="Excluir">&times;</span>
        <div class="cliente-nome">${escapeHtml(c.nome)}</div>
        <div class="cliente-telefone">${escapeHtml(c.telefone) || "-"}</div>

        <div class="cliente-nota" data-nota="${c.id}">
          <span class="cliente-nota-icon">📌</span>
          <span class="cliente-nota-texto">${notaTexto}</span>
        </div>

        ${c.demo_url ? demoHtml : `<div class="cliente-demo cliente-demo-vazio" data-demo="${c.id}">+ adicionar link da demo</div>`}

        <div class="cliente-valor-linha">
          <span class="cliente-valor${valorInfo.label === "fechado" ? " cliente-valor-fechado" : ""}">${valorInfo.texto}</span>
          ${valorInfo.label ? `<span class="cliente-valor-label">${valorInfo.label}</span>` : ""}
        </div>

        <div class="cliente-progresso">
          <div class="cliente-progresso-topo">
            <span>Progresso</span>
            <span>${progresso.feitos}/${progresso.total} etapas</span>
          </div>
          <div class="cliente-progresso-barra">
            <div class="cliente-progresso-fill" style="width:${progresso.pct}%"></div>
          </div>
        </div>

        <div class="cliente-checklist">
          ${itensHtml}
          ${resto > 0 ? `<div class="cliente-checklist-mais" data-expandir="${c.id}">+${resto} etapas · ver todas</div>` : ""}
          ${expandido && checklist.length > 3 ? `<div class="cliente-checklist-mais" data-expandir="${c.id}">ver menos</div>` : ""}
        </div>
      </div>
    </div>
  `;
```

- [ ] **Step 3: Add expansion state, real checklist indices, and checkbox `data-*` to the item builder**

Find (`app.js`, the start of `renderClienteCard` through the `itensHtml` build, written in Task 2):
```js
function renderClienteCard(c) {
  const valorInfo = formatarValorCliente(c);
  const progresso = calcularProgresso(c.checklist);
  const checklist = c.checklist || [];
  const itensPreview = checklist.slice(0, 3);
  const resto = checklist.length - itensPreview.length;
  const capaStyle = c.foto_capa ? ` style="background-image:url('${c.foto_capa}')"` : "";

  const itensHtml = itensPreview
    .map(
      (item) => `
        <div class="cliente-checklist-item">
          <span>${item.feito ? "☑" : "☐"}</span>
          <span class="${item.feito ? "cliente-checklist-feito" : ""}">${escapeHtml(item.texto)}</span>
        </div>
      `
    )
    .join("");
```

Replace with:
```js
let checklistsExpandidos = new Set();

function renderClienteCard(c) {
  const valorInfo = formatarValorCliente(c);
  const progresso = calcularProgresso(c.checklist);
  const checklist = c.checklist || [];
  const expandido = checklistsExpandidos.has(c.id);
  const itensComIndice = checklist.map((item, i) => ({ ...item, _i: i }));
  const itensPreview = expandido ? itensComIndice : itensComIndice.slice(0, 3);
  const resto = checklist.length - itensPreview.length;
  const capaStyle = c.foto_capa ? ` style="background-image:url('${c.foto_capa}')"` : "";

  const itensHtml = itensPreview
    .map(
      (item) => `
        <div class="cliente-checklist-item" data-toggle-item="${item._i}" data-cliente="${c.id}">
          <span>${item.feito ? "☑" : "☐"}</span>
          <span class="${item.feito ? "cliente-checklist-feito" : ""}">${escapeHtml(item.texto)}</span>
        </div>
      `
    )
    .join("");
```

- [ ] **Step 4: Add the handler functions and extend click delegation**

Find (`app.js`, the `els.grid.addEventListener("click", ...)` block written in Task 2):
```js
els.grid.addEventListener("click", (e) => {
  const excluirId = e.target.dataset.excluir;
  if (excluirId) {
    excluirCliente(excluirId);
    return;
  }
  if (e.target.closest("a")) return;
  const card = e.target.closest("[data-id]");
  if (card) {
    const cliente = clientes.find((c) => c.id === card.dataset.id);
    if (cliente) abrirModal(cliente);
  }
});
```

Replace with:
```js
function toggleChecklistItem(id, itemIdx) {
  const idx = clientes.findIndex((c) => c.id === id);
  if (idx === -1) return;
  const checklist = (clientes[idx].checklist || []).map((item, i) =>
    i === itemIdx ? { ...item, feito: !item.feito } : item
  );
  clientes[idx] = { ...clientes[idx], checklist };
  saveClientes(clientes);
  render();
}

function salvarNotaRapida(id, valor) {
  const idx = clientes.findIndex((c) => c.id === id);
  if (idx === -1) return;
  clientes[idx] = { ...clientes[idx], nota_rapida: valor.trim() };
  saveClientes(clientes);
  render();
}

function salvarDemoUrl(id, valor) {
  const idx = clientes.findIndex((c) => c.id === id);
  if (idx === -1) return;
  clientes[idx] = { ...clientes[idx], demo_url: valor.trim() };
  saveClientes(clientes);
  render();
}

let capaEditandoId = null;
const inputFotoCapa = document.getElementById("input-foto-capa");

function abrirSeletorCapa(id) {
  capaEditandoId = id;
  inputFotoCapa.value = "";
  inputFotoCapa.click();
}

inputFotoCapa.addEventListener("change", () => {
  const arquivo = inputFotoCapa.files[0];
  if (!arquivo || !capaEditandoId) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    const idx = clientes.findIndex((c) => c.id === capaEditandoId);
    if (idx !== -1) {
      clientes[idx] = { ...clientes[idx], foto_capa: String(leitor.result || "") };
      saveClientes(clientes);
      render();
    }
    capaEditandoId = null;
  };
  leitor.readAsDataURL(arquivo);
});

els.grid.addEventListener("click", (e) => {
  const excluirId = e.target.dataset.excluir;
  if (excluirId) {
    excluirCliente(excluirId);
    return;
  }

  const notaEl = e.target.closest("[data-nota]");
  if (notaEl) {
    if (e.target.tagName === "INPUT") return;
    const id = notaEl.dataset.nota;
    const cliente = clientes.find((c) => c.id === id);
    notaEl.innerHTML = `<input type="text" class="cliente-nota-input" value="${escapeHtml(cliente.nota_rapida || "")}" placeholder="Nota rápida..." />`;
    const input = notaEl.querySelector("input");
    input.focus();
    input.addEventListener("blur", () => salvarNotaRapida(id, input.value));
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") input.blur();
    });
    return;
  }

  const demoVazioEl = e.target.closest("[data-demo]");
  if (demoVazioEl) {
    if (e.target.tagName === "INPUT") return;
    const id = demoVazioEl.dataset.demo;
    demoVazioEl.innerHTML = `<input type="text" class="cliente-nota-input" placeholder="https://meuprojeto.vercel.app" />`;
    const input = demoVazioEl.querySelector("input");
    input.focus();
    input.addEventListener("blur", () => salvarDemoUrl(id, input.value));
    input.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter") input.blur();
    });
    return;
  }

  if (e.target.closest("a")) return;

  const capaEl = e.target.closest("[data-capa]");
  if (capaEl) {
    abrirSeletorCapa(capaEl.dataset.capa);
    return;
  }

  const toggleItem = e.target.closest("[data-toggle-item]");
  if (toggleItem) {
    toggleChecklistItem(toggleItem.dataset.cliente, Number(toggleItem.dataset.toggleItem));
    return;
  }

  const expandirEl = e.target.closest("[data-expandir]");
  if (expandirEl) {
    const id = expandirEl.dataset.expandir;
    if (checklistsExpandidos.has(id)) checklistsExpandidos.delete(id);
    else checklistsExpandidos.add(id);
    render();
    return;
  }

  const card = e.target.closest("[data-id]");
  if (card) {
    const cliente = clientes.find((c) => c.id === card.dataset.id);
    if (cliente) abrirModal(cliente);
  }
});
```

- [ ] **Step 5: Add interactive-affordance styles**

Find (`style.css`, the `.cliente-checklist-mais` rule added in Task 2):
```css
.cliente-checklist-mais {
  color: var(--text-muted);
  font-size: 0.72rem;
  margin-top: 2px;
}
```

Replace with:
```css
.cliente-checklist-mais {
  color: var(--text-muted);
  font-size: 0.72rem;
  margin-top: 2px;
  cursor: pointer;
}

.cliente-checklist-mais:hover {
  color: var(--accent);
}

.cliente-checklist-item {
  cursor: pointer;
}

.cliente-nota,
.cliente-demo-vazio,
.cliente-capa {
  cursor: pointer;
}

.cliente-nota-input {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--accent);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  font-size: 0.8rem;
  font-family: inherit;
}
```

- [ ] **Step 6: Verify in the browser**

Reload `/index.html`. Click a checklist item on a card (e.g. "Demo enviada"). Expected: item toggles to ☑ with strikethrough, progress bar/count update immediately (e.g. 2/5, 40%), no modal opens.

Click "+2 etapas · ver todas". Expected: card expands to show all 5 items, label changes to "ver menos"; click again collapses back to 3.

Click the "Nenhuma nota ainda" box. Expected: turns into a text input, focused. Type "teste" and press Enter. Expected: input disappears, box now shows "teste". Reload the page — value persists.

Click "+ adicionar link da demo". Expected: turns into a text input. Type `https://teste.vercel.app` and press Enter. Expected: box now renders as a real clickable link with 🔗 prefix (since `demo_url` is now set, `renderClienteCard`'s conditional switches to the `<a>` branch on next render).

Click the photo placeholder area ("+ Adicionar capa"). Expected: a native file picker opens (can't be driven headlessly — confirm the click reaches `inputFotoCapa.click()` without a console error; skip actually selecting a file).

Check `read_console_messages` for errors throughout.

- [ ] **Step 7: Commit**

```bash
git add index.html app.js style.css
git commit -m "feat: inline quick-edit for checklist, nota rápida, demo link, and cover photo"
```

---

### Task 4: Modal fields (faixa, valor fechado, demo link, foto, checklist editor)

**Files:**
- Modify: `index.html` (modal form fields)
- Modify: `app.js` (`abrirModal`, `onSubmit`, new checklist-editor state/functions, new foto-upload-in-modal handler)
- Modify: `style.css` (checklist editor styles)

**Interfaces:**
- Consumes: `CHECKLIST_PADRAO` (new constant this task defines), `els`, `abrirModal`, `onSubmit` from Task 1/2.
- Produces: nothing consumed by Task 5 (Task 5 is verification-only).

- [ ] **Step 1: Replace the Valor field with faixa/fechado/demo/nota/foto/checklist fields in `index.html`**

Find (`index.html`, inside `#form-cliente`'s `.form-grid`):
```html
          <label class="field">
            <span>Valor (R$)</span>
            <input type="number" id="f-valor" min="0" step="0.01" placeholder="0,00" />
          </label>
          <label class="field">
            <span>Pagamento</span>
            <select id="f-pagamento">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="parcial">Parcial</option>
            </select>
          </label>
          <label class="field field-full">
            <span>Observações</span>
            <textarea id="f-obs" rows="3" placeholder="Anotações sobre o cliente..."></textarea>
          </label>
```

Replace with:
```html
          <label class="field">
            <span>Valor mínimo (R$)</span>
            <input type="number" id="f-valor-min" min="0" step="0.01" placeholder="0,00" />
          </label>
          <label class="field">
            <span>Valor máximo (R$)</span>
            <input type="number" id="f-valor-max" min="0" step="0.01" placeholder="0,00" />
          </label>
          <label class="field">
            <span>Valor fechado (R$)</span>
            <input type="number" id="f-valor-fechado" min="0" step="0.01" placeholder="Preencher ao fechar" />
          </label>
          <label class="field">
            <span>Pagamento</span>
            <select id="f-pagamento">
              <option value="pendente">Pendente</option>
              <option value="pago">Pago</option>
              <option value="parcial">Parcial</option>
            </select>
          </label>
          <label class="field field-full">
            <span>Link da demo</span>
            <input type="text" id="f-demo-url" placeholder="https://meuprojeto.vercel.app" />
          </label>
          <label class="field field-full">
            <span>Nota rápida</span>
            <input type="text" id="f-nota-rapida" placeholder="Lembrete curto..." />
          </label>
          <label class="field field-full">
            <span>Foto de capa</span>
            <input type="file" id="f-foto-capa" accept="image/*" />
          </label>
          <div class="field field-full">
            <span>Checklist</span>
            <div id="checklist-editor"></div>
            <div class="checklist-editor-add">
              <input type="text" id="f-checklist-novo" placeholder="Nova etapa..." />
              <button type="button" id="btn-checklist-add" class="btn btn-secondary">Adicionar</button>
            </div>
          </div>
          <label class="field field-full">
            <span>Observações</span>
            <textarea id="f-obs" rows="3" placeholder="Anotações sobre o cliente..."></textarea>
          </label>
```

- [ ] **Step 2: Add `CHECKLIST_PADRAO`, checklist-editor state, and the editor renderer to `app.js`**

Find (`app.js`, the top of the file — lines 1-2):
```js
const STORAGE_KEY = "clientes";

```

Replace with:
```js
const STORAGE_KEY = "clientes";

const CHECKLIST_PADRAO = [
  { texto: "Proposta enviada", feito: false },
  { texto: "Demo enviada", feito: false },
  { texto: "Aprovação do cliente", feito: false },
  { texto: "Site no ar", feito: false },
  { texto: "Pagamento recebido", feito: false },
];

let checklistEditando = [];
let fotoCapaEditando;

function renderChecklistEditor() {
  const container = document.getElementById("checklist-editor");
  container.innerHTML = checklistEditando
    .map(
      (item, i) => `
        <div class="checklist-editor-item">
          <input type="checkbox" data-checklist-feito="${i}" ${item.feito ? "checked" : ""} />
          <span>${escapeHtml(item.texto)}</span>
          <span class="checklist-editor-remove" data-checklist-remover="${i}" title="Remover">&times;</span>
        </div>
      `
    )
    .join("");
}

document.getElementById("checklist-editor").addEventListener("click", (e) => {
  const removerIdx = e.target.dataset.checklistRemover;
  if (removerIdx !== undefined) {
    checklistEditando.splice(Number(removerIdx), 1);
    renderChecklistEditor();
  }
});

document.getElementById("checklist-editor").addEventListener("change", (e) => {
  const feitoIdx = e.target.dataset.checklistFeito;
  if (feitoIdx !== undefined) {
    checklistEditando[Number(feitoIdx)] = { ...checklistEditando[Number(feitoIdx)], feito: e.target.checked };
  }
});

document.getElementById("btn-checklist-add").addEventListener("click", () => {
  const input = document.getElementById("f-checklist-novo");
  const texto = input.value.trim();
  if (!texto) return;
  checklistEditando.push({ texto, feito: false });
  input.value = "";
  renderChecklistEditor();
});

document.getElementById("f-foto-capa").addEventListener("change", (e) => {
  const arquivo = e.target.files[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    fotoCapaEditando = String(leitor.result || "");
  };
  leitor.readAsDataURL(arquivo);
});

```

- [ ] **Step 3: Wire the new fields into `abrirModal`**

Find (`app.js`, the `abrirModal` function):
```js
function abrirModal(cliente) {
  els.form.reset();
  if (cliente) {
    els.modalTitle.textContent = "Editar cliente";
    document.getElementById("cliente-id").value = cliente.id;
    document.getElementById("f-nome").value = cliente.nome || "";
    document.getElementById("f-empresa").value = cliente.empresa || "";
    document.getElementById("f-telefone").value = cliente.telefone || "";
    document.getElementById("f-email").value = cliente.email || "";
    document.getElementById("f-servico").value = cliente.servico || "";
    document.getElementById("f-status").value = cliente.status || "andamento";
    document.getElementById("f-valor").value = cliente.valor || "";
    document.getElementById("f-pagamento").value = cliente.pagamento || "pendente";
    document.getElementById("f-obs").value = cliente.obs || "";
    els.btnExcluir.hidden = false;
  } else {
    els.modalTitle.textContent = "Novo cliente";
    document.getElementById("cliente-id").value = "";
    els.btnExcluir.hidden = true;
  }
  els.overlay.hidden = false;
}
```

Replace with:
```js
function abrirModal(cliente) {
  els.form.reset();
  fotoCapaEditando = undefined;
  if (cliente) {
    els.modalTitle.textContent = "Editar cliente";
    document.getElementById("cliente-id").value = cliente.id;
    document.getElementById("f-nome").value = cliente.nome || "";
    document.getElementById("f-empresa").value = cliente.empresa || "";
    document.getElementById("f-telefone").value = cliente.telefone || "";
    document.getElementById("f-email").value = cliente.email || "";
    document.getElementById("f-servico").value = cliente.servico || "";
    document.getElementById("f-status").value = cliente.status || "andamento";
    document.getElementById("f-valor-min").value = cliente.valor_min || "";
    document.getElementById("f-valor-max").value = cliente.valor_max || "";
    document.getElementById("f-valor-fechado").value = cliente.valor_fechado || "";
    document.getElementById("f-demo-url").value = cliente.demo_url || "";
    document.getElementById("f-nota-rapida").value = cliente.nota_rapida || "";
    document.getElementById("f-pagamento").value = cliente.pagamento || "pendente";
    document.getElementById("f-obs").value = cliente.obs || "";
    checklistEditando = (cliente.checklist || []).map((item) => ({ ...item }));
    els.btnExcluir.hidden = false;
  } else {
    els.modalTitle.textContent = "Novo cliente";
    document.getElementById("cliente-id").value = "";
    checklistEditando = CHECKLIST_PADRAO.map((item) => ({ ...item }));
    els.btnExcluir.hidden = true;
  }
  renderChecklistEditor();
  els.overlay.hidden = false;
}
```

- [ ] **Step 4: Wire the new fields into `onSubmit`**

Find (`app.js`, the `onSubmit` function):
```js
function onSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("cliente-id").value;
  const dados = {
    nome: document.getElementById("f-nome").value.trim(),
    empresa: document.getElementById("f-empresa").value.trim(),
    telefone: document.getElementById("f-telefone").value.trim(),
    email: document.getElementById("f-email").value.trim(),
    servico: document.getElementById("f-servico").value.trim(),
    status: document.getElementById("f-status").value,
    pagamento: document.getElementById("f-pagamento").value,
    obs: document.getElementById("f-obs").value.trim(),
  };

  if (id) {
    const idx = clientes.findIndex((c) => c.id === id);
    if (idx !== -1) clientes[idx] = { ...clientes[idx], ...dados };
  } else {
    clientes.push({ id: crypto.randomUUID(), origem: "manual", ...dados });
  }

  saveClientes(clientes);
  render();
  fecharModal();
}
```

Replace with:
```js
function onSubmit(e) {
  e.preventDefault();
  const id = document.getElementById("cliente-id").value;
  const valorMin = document.getElementById("f-valor-min").value;
  const valorMax = document.getElementById("f-valor-max").value;
  const valorFechado = document.getElementById("f-valor-fechado").value;
  const dados = {
    nome: document.getElementById("f-nome").value.trim(),
    empresa: document.getElementById("f-empresa").value.trim(),
    telefone: document.getElementById("f-telefone").value.trim(),
    email: document.getElementById("f-email").value.trim(),
    servico: document.getElementById("f-servico").value.trim(),
    status: document.getElementById("f-status").value,
    valor_min: valorMin ? Number(valorMin) : null,
    valor_max: valorMax ? Number(valorMax) : null,
    valor_fechado: valorFechado ? Number(valorFechado) : null,
    demo_url: document.getElementById("f-demo-url").value.trim(),
    nota_rapida: document.getElementById("f-nota-rapida").value.trim(),
    pagamento: document.getElementById("f-pagamento").value,
    obs: document.getElementById("f-obs").value.trim(),
    checklist: checklistEditando,
  };
  if (fotoCapaEditando !== undefined) {
    dados.foto_capa = fotoCapaEditando;
  }

  if (id) {
    const idx = clientes.findIndex((c) => c.id === id);
    if (idx !== -1) clientes[idx] = { ...clientes[idx], ...dados };
  } else {
    clientes.push({ id: crypto.randomUUID(), origem: "manual", foto_capa: null, ...dados });
  }

  saveClientes(clientes);
  render();
  fecharModal();
}
```

- [ ] **Step 5: Add checklist-editor styles**

Find (`style.css`, the `.cliente-nota-input` rule added in Task 3):
```css
.cliente-nota-input {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--accent);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  font-size: 0.8rem;
  font-family: inherit;
}
```

Replace with:
```css
.cliente-nota-input {
  width: 100%;
  background: var(--bg-card);
  border: 1px solid var(--accent);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 4px 6px;
  font-size: 0.8rem;
  font-family: inherit;
}

.checklist-editor-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.85rem;
  border-bottom: 1px solid var(--border);
}

.checklist-editor-item:last-child {
  border-bottom: none;
}

.checklist-editor-item span:nth-child(2) {
  flex: 1;
}

.checklist-editor-remove {
  color: var(--text-muted);
  cursor: pointer;
  font-size: 1rem;
}

.checklist-editor-remove:hover {
  color: var(--red);
}

.checklist-editor-add {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.checklist-editor-add input {
  flex: 1;
  background: var(--bg-card);
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  font-size: 0.85rem;
  font-family: inherit;
}
```

- [ ] **Step 6: Verify in the browser**

Reload `/index.html`, click a card to open the edit modal. Expected: Valor mínimo/máximo/fechado, Link da demo, Nota rápida, Foto de capa, and a Checklist section (5 rows with checkboxes matching the card's current state, an "Adicionar" row) all present and pre-filled with the client's data.

Check a checklist checkbox in the modal, add a new item "Contrato assinado", remove one existing item, then click Salvar. Expected: modal closes, card re-renders with the updated checklist/progress reflecting all three changes.

Click "+ Novo cliente". Expected: checklist editor shows the 5 default items, all unchecked. Fill Nome + Valor mínimo/máximo, Salvar. Expected: new card appears with a faixa value and 0/5 progress.

Check `read_console_messages` for errors throughout.

- [ ] **Step 7: Commit**

```bash
git add index.html app.js style.css
git commit -m "feat: add faixa, valor fechado, demo link, foto, and checklist editor to client modal"
```

---

### Task 5: Full regression pass

**Files:** none (verification only)

- [ ] **Step 1: Desktop walkthrough**

Navigate to `/index.html` at desktop width. Create a client via "+ Novo cliente" (fill nome, valor mínimo/máximo, a checklist item), confirm it appears as a card. Edit it: change status, mark 2 checklist items done via the modal, save — confirm card updates. Toggle a checklist item directly on the card (not via modal) — confirm it persists after a page reload. Set a nota rápida and a demo link via the card's inline editors — confirm both persist after reload. Delete the client via the card's × — confirm it's removed and stats update.

- [ ] **Step 2: Mobile walkthrough**

Resize to mobile preset. Repeat: open a card's modal, confirm all fields are usable (touch targets, no overflow). Confirm the grid is 1 column. Confirm inline nota/checklist/demo interactions still work at mobile width.

- [ ] **Step 3: "A receber" stat sanity check**

Prior verification steps in earlier tasks may have toggled checklist items or set a nota/demo on the 4 seed clients — that's harmless (doesn't affect this calculation), but to get a clean baseline, run `mcp__Claude_Browser__javascript_tool` with `localStorage.removeItem("clientes")` and reload first. This re-seeds all 4 clients with `valor_fechado: null`.

Confirm the "A receber" stat card shows `R$7.200,00` (sum of `valor_max`: 1500+1400+1800+2500). Open **Centro Odonto**'s modal specifically (its `valor_max` is 1500), set Valor fechado to `1300`, save. Confirm "A receber" recalculates to `R$7.000,00` (1300 replacing Centro Odonto's 1500 contribution: 1300+1400+1800+2500).

- [ ] **Step 4: Confirm Leads and other pages are untouched**

Navigate to `/leads.html`. Confirm it renders normally (stats, Lista/Kanban toggle, filters) with no console errors — nothing in this plan should have touched `leads.html`, `leads-app.js`, `leads-style.css`, or `leads-data.js`.

Run: `git diff --stat 8157b1c -- leads.html leads-app.js leads-style.css leads-data.js data/leads_seed.csv scripts/build-leads-seed.js`
Expected: empty output (no changes to any Leads-related file across all 4 tasks).

- [ ] **Step 5: Final commit if any fixups were needed during the regression pass**

```bash
git add -A
git commit -m "fix: address issues found in clientes cards regression pass"
```

(Skip this step if no fixes were needed.)
