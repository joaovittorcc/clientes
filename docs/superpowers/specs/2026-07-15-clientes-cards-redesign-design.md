# Reformulação da aba Clientes — cards detalhados

## Contexto

A aba Clientes (`index.html`) hoje é uma tabela simples: nome, contato,
empresa, serviço, status, valor único, pagamento. Cobre o mínimo, mas não dá
controle real sobre o pipeline de vendas — não tem onde guardar o link da
demo enviada, não separa "o que já foi feito" de "o que falta", não tem faixa
de negociação, e qualquer nota exige abrir o modal de edição inteiro.

O objetivo é transformar cada cliente num card rico, com controle detalhado
do progresso de cada negociação/projeto, mantendo a aba Leads e o resto do
site intocados.

## Modelo de dados

Cada objeto de cliente (`localStorage`, `data.js` seed) ganha estes campos
novos, mantendo os já existentes (`id`, `nome`, `empresa`, `telefone`,
`email`, `servico`, `status`, `pagamento`, `obs`, `origem`):

- `valor_min` (number|null), `valor_max` (number|null) — faixa negociável.
  **Substitui** o campo `valor` único atual.
- `valor_fechado` (number|null) — valor real combinado. Só preenchido quando
  o negócio fecha. Enquanto `null`, o cliente ainda está em negociação.
- `demo_url` (string) — link do site demo (Vercel ou outro), sempre visível
  no card como link clicável.
- `nota_rapida` (string) — nota curta, editável direto no card sem abrir o
  modal. Distinta do `obs` longo (pesquisa/roteiro de abordagem), que
  continua só no modal.
- `checklist` (array de `{ texto: string, feito: boolean }`) — etapas do
  projeto. Cliente novo recebe um modelo padrão:
  1. Proposta enviada
  2. Demo enviada
  3. Aprovação do cliente
  4. Site no ar
  5. Pagamento recebido

  Itens podem ser adicionados/removidos/editados por cliente.
- `foto_capa` (string|null) — imagem de capa como data URL (base64),
  resultado de `FileReader.readAsDataURL` sobre o arquivo escolhido no
  input `type="file"`. Sem upload para servidor — tudo local.

**Progresso** não é um campo armazenado: é sempre `itens marcados / total de
itens` do `checklist`, calculado na hora de renderizar.

**Migração:** clientes existentes no `localStorage` (criados antes desta
mudança, com `valor` único) precisam de uma migração one-shot no load: se
`valor` existir e `valor_min`/`valor_max` não, vira `valor_min = valor_max =
valor` e `valor` é removido do objeto salvo de volta. `checklist` ausente
vira `[]` (sem forçar o modelo padrão em cliente já existente — o modelo
padrão é só para clientes novos, criados via formulário depois desta
mudança).

## Cálculo de "A receber"

Para cada cliente com `pagamento !== "pago"`:
- Se `valor_fechado` existir, soma `valor_fechado`.
- Senão, soma `valor_max` (teto da faixa, tratado como `0` se também for
  `null`).

Mantém a mesma lógica de filtro atual (`pagamento !== "pago"`), só troca a
fonte do número.

## Layout

Tabela vira grid de cards. Grid responsivo: `repeat(3, 1fr)` no desktop,
1 coluna abaixo de 768px (breakpoint já padronizado no resto do site).

Estrutura de cada card (topo → base):

1. **Foto de capa** — banner, altura fixa (~110px). Sem foto: área com
   fundo gradiente sutil e texto "+ Adicionar capa" (clicável, abre seletor
   de arquivo). Badge de status (Em andamento/Concluído/Pausado) sobreposto
   no canto superior direito da foto.
2. **Nome** (negrito) e **telefone** (linha secundária, muted).
3. **Nota rápida** — caixa com borda tracejada, mostra `nota_rapida` ou
   placeholder "+ nota rápida" se vazio. Clique vira campo editável inline
   (blur ou Enter salva).
4. **Link da demo** — se `demo_url` existir, mostra como link clicável
   (`target="_blank"`) com ícone; se vazio, mostra "+ adicionar link da
   demo" que abre edição inline do campo.
5. **Valor** — se `valor_fechado` existir, mostra ele em destaque (cor
   verde/sucesso, label "fechado"); senão mostra `R$valor_min – R$valor_max`
   (label "faixa").
6. **Progresso** — barra + texto `X/Y etapas`.
7. **Checklist** — lista dos itens com checkbox; clique no checkbox alterna
   `feito` sem abrir modal. Card mostra até 3 itens + "+N etapas · ver
   todas" caso tenha mais (expande a lista completa dentro do próprio card
   ao clicar, sem modal).

Clique em qualquer parte do card **fora** das áreas de edição rápida (nota,
checklist, link demo, foto) abre o modal "Editar cliente" — mesmo padrão de
hoje (clique na linha da tabela abre o modal).

## Modal de edição

Ganha os campos novos: faixa (`valor_min`/`valor_max`), `valor_fechado`,
`demo_url`, upload de `foto_capa`, e editor de checklist (adicionar/remover/
reordenar não é necessário — só adicionar item de texto livre e remover
item existente; reordenar fica fora de escopo). `nota_rapida` também
aparece no modal (edição inline no card e modal escrevem no mesmo campo).

`obs` (observações longas) continua existindo e só aparece no modal, sem
mudança de comportamento.

## Fora de escopo

- Aba Leads, Kanban, demais páginas — intocadas.
- Reordenar itens do checklist por drag-and-drop.
- Múltiplas fotos por cliente (só uma foto de capa).
- Qualquer envio/upload para servidor externo — tudo continua 100% local
  (`localStorage` + `data.js` seed), sem backend.
- Edição do modelo padrão de checklist (fica hardcoded no código, não é
  configurável pela UI).

## Arquivos afetados

- `data.js` — schema dos 4 clientes seed atuais migra `valor` pra
  `valor_min`/`valor_max`, usando as faixas já registradas no `obs` de cada
  um: Centro Odonto R$1.200–1.500, Poesia Arquitetura R$1.200–1.400,
  Anderson Junio R$1.500–1.800, Pedro Xavier R$1.800–2.500.
  `valor_fechado` fica `null` nos 4 (nenhum fechou ainda). Ganham checklist
  padrão (todos com só "Proposta enviada" marcado — é o estágio real deles
  hoje) e `demo_url` vazio (usuário preenche quando enviar a demo).
- `app.js` — lógica de render vira cards em vez de linhas de tabela; funções
  novas: cálculo de progresso, migração de `valor` legado, toggle de item de
  checklist, edição inline de nota rápida e link demo, upload/preview de
  foto de capa, cálculo de "A receber" atualizado.
- `index.html` — markup da seção de listagem (troca `<table>` por grid de
  cards), modal ganha os campos novos.
- `style.css` — estilos do card, badge de status sobreposto, barra de
  progresso, checklist, upload de foto, edição inline.
