# Redesign visual + responsivo — Dark Premium

## Contexto

Painel interno (Evodev) com duas telas: `index.html` (Clientes) e `leads.html`
(Leads de Prospecção). Design atual é navy escuro funcional, já com alguns
media queries (tabela → cards, stats em 2 colunas), mas com furos no mobile:

- Header de `leads.html` quebra layout — botões "Importar CSV" / "+ Novo lead"
  espremidos ao lado do título, causando wrap ruim.
- Kanban empilha todas as colunas verticalmente; a coluna "A contatar" com 58
  cards obriga rolar muito antes de ver as próximas colunas.
- Espaçamento apertado, visual genérico de dashboard.

## Objetivo

Reformular a identidade visual (paleta, tipografia, componentes) e resolver os
problemas de responsividade/mobile, **sem alterar nenhuma funcionalidade**
(CRUD de clientes, filtros/busca de leads, import CSV, kanban drag/avançar,
persistência em `localStorage`). Escopo é puramente CSS + markup mínimo +
pequeno JS de UI (toggle de acordeão).

## Direção visual: Dark Premium

Validada via companion visual (3 opções apresentadas: Navy Refinado, Claro
Moderno, Dark Premium — Dark Premium escolhida).

### Tokens de cor

```css
--bg: #0d0f14;              /* fundo geral, quase preto */
--bg-elevated: #13151c;     /* header, barra inferior mobile */
--bg-card: #171a22;         /* cards, stat cards, linhas */
--bg-card-hover: #1c1f29;
--border: #23262f;
--text: #f2f3f5;
--text-muted: #7d8494;
--accent: #2ee6a8;          /* verde-esmeralda — substitui o azul atual */
--accent-contrast: #0d0f14; /* texto sobre fundo accent (é claro, texto escuro) */
--accent-soft: rgba(46, 230, 168, 0.12); /* fundo de badges/destaques */
--green: #3fb950;           /* status "concluído/pago" — mantém verde padrão, distinto do accent */
--yellow: #d29922;
--red: #f85149;
--radius: 12px;
--radius-sm: 8px;
--shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
```

Observação: `--accent` (verde-esmeralda neon) é usado para ações primárias,
navegação ativa e destaques de prioridade. `--green` continua reservado para
badges de status "concluído/pago", mantendo os dois conceitualmente
separados (ação/destaque vs. status positivo).

### Tipografia

Mantém a stack de sistema atual: `"Segoe UI", system-ui, -apple-system,
sans-serif`. Sem fontes externas — evita dependência de rede num painel
interno. Ajuste: pesos e tamanhos ganham mais hierarquia (títulos maiores,
labels menores e mais espaçadas).

### Espaçamento e forma

`--radius` sobe de 10px para 12px. Paddings internos de cards/stat-cards
aumentam ~20%. Gaps de grid aumentam de 14px para 16-18px.

## Layout & navegação

### Desktop (≥768px)

Mantém a estrutura atual: header topo fixo com logo + pills de navegação
(Clientes/Leads), conteúdo em container centralizado max-width 1100px. Só
recebe a nova paleta, radius e espaçamento.

### Mobile (<768px)

- Header topo simplifica: só logo/título (remove os links de nav do topo).
- **Navegação Clientes/Leads migra para barra inferior fixa** (`position:
  fixed; bottom: 0`), com ícone + label por item, item ativo destacado em
  `--accent`. Altura ~56px, com `padding-bottom` equivalente adicionado ao
  `body`/`.app` para o conteúdo não ficar coberto.
- Ações do header (`+ Novo cliente` em `index.html`; `Importar CSV` / `+ Novo
  lead` em `leads.html`): no mobile, o título e as ações quebram para duas
  linhas de forma controlada (título em cima, ações abaixo, full-width ou
  lado a lado com `flex-wrap`) — em vez do wrap quebrado atual. Botões
  ganham `min-height: 44px` (touch target).

## Componentes

### Stat cards

Grid 2 colunas no mobile (mantém), 4 colunas no desktop (mantém). Nova
paleta aplicada. Card de destaque (ex.: "Alta prioridade · foco do dia" em
Leads) ganha borda `--accent` em vez do azul atual.

### Tabela de Clientes (`index.html`)

Mantém o fallback atual (tabela → card por linha via `td::before` com
`data-label`) no mobile. Apenas re-skin com os novos tokens. Aumenta
`padding` das células no modo card para touch target melhor.

### Lista de Leads (`leads.html`, view Lista)

Cards de lead no mobile reduzem a altura: hoje cada campo (Nome, Nicho,
Cidade, Telefone, Avaliação, Prioridade, Status) ocupa um bloco vertical
inteiro com label acima — muito alto. Nova versão agrupa em uma grade
2-colunas dentro do card (label pequeno + valor), reduzindo scroll por
lead.

### Kanban (`leads.html`, view Kanban)

**Mobile: colunas viram acordeão.** Cada coluna de status (A contatar, Em
conversa, Fechado, etc.) vira uma seção recolhível:

- Header da seção: nome do status + contador, sempre visível, com um
  chevron indicando expandido/recolhido.
- Apenas uma seção expandida por vez (accordion clássico) — ao abrir uma,
  as outras recolhem. Cards de lead só renderizam/ficam visíveis dentro da
  seção expandida.
- Seção "A contatar" abre expandida por padrão (é a mais usada).
- Requer pequeno JS novo em `leads-app.js`: estado de qual coluna está
  expandida + toggle no clique do header da seção. Lógica de drag/avançar
  status permanece igual, só a apresentação muda no breakpoint mobile.

**Desktop:** mantém colunas lado a lado como hoje, só re-skinned.

### Modal (formulário cliente/lead)

Mantém comportamento (overlay + card centralizado com scroll interno).
Re-skin com nova paleta. Inputs/selects/textarea e botões do rodapé ganham
`min-height: 44px` no mobile para touch target adequado.

## Breakpoint

Mantém o breakpoint único existente: `@media (max-width: 720px)` — ajustado
para `768px` para alinhar com a convenção mobile/tablet mais comum, sem
introduzir breakpoints intermediários (não há necessidade de tablet
dedicado — o layout de 2 colunas já serve tablet razoavelmente).

## Fora de escopo

- Nenhuma mudança em `app.js`, `leads-data.js`, `data.js`.
- Nenhuma nova feature, filtro, campo ou fluxo.
- `leads-app.js` recebe apenas a lógica de toggle do acordeão do Kanban
  mobile — o resto (CRUD, filtros, import CSV, drag/avançar status)
  permanece intocado.
- Sem dark/light mode toggle — o `@media (prefers-color-scheme: light)`
  atual em `style.css` é removido junto com a reformulação (produto passa a
  ser dark-only, consistente com a direção "Dark Premium" escolhida).

## Arquivos afetados

- `style.css` — reescrita de tokens/componentes (Clientes)
- `leads-style.css` — reescrita de tokens/componentes (Leads) + acordeão
- `index.html` — ajuste de markup do header/nav mobile
- `leads.html` — ajuste de markup do header/nav mobile + estrutura do
  Kanban para suportar acordeão
- `leads-app.js` — toggle de expandir/recolher coluna do Kanban no mobile
