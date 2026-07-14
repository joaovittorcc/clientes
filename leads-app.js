const LEADS_STORAGE_KEY = "leads";

const STATUS_LEAD_LABEL = {
  a_contatar: "A contatar",
  contatado: "Contatado",
  proposta_enviada: "Proposta enviada",
  fechado: "Fechado",
  perdido: "Perdido",
};

const leadEls = {
  tbody: document.getElementById("tbody-leads"),
  vazio: document.getElementById("vazio-leads"),
  busca: document.getElementById("busca-lead"),
  filtroCidade: document.getElementById("filtro-cidade"),
  filtroNicho: document.getElementById("filtro-nicho"),
  filtroPrioridade: document.getElementById("filtro-prioridade"),
  filtroStatus: document.getElementById("filtro-status-lead"),
  statTotal: document.getElementById("stat-total"),
  statAContatar: document.getElementById("stat-a-contatar"),
  statEmConversa: document.getElementById("stat-em-conversa"),
  statFechados: document.getElementById("stat-fechados"),
  statFocoDia: document.getElementById("stat-foco-dia"),
  viewLista: document.getElementById("view-lista"),
  viewKanban: document.getElementById("view-kanban"),
  btnViewLista: document.getElementById("btn-view-lista"),
  btnViewKanban: document.getElementById("btn-view-kanban"),
};

function loadLeads() {
  try {
    const raw = localStorage.getItem(LEADS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLeads(leadsArr) {
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leadsArr));
}

function mesclarSeedLeads(existentes, seed) {
  const idsExistentes = new Set(existentes.map((l) => l.id));
  const novos = seed.filter((l) => !idsExistentes.has(l.id));
  return existentes.concat(novos);
}

function escapeHtmlLead(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function waLink(telefone) {
  if (!telefone) return "";
  const digitos = telefone.replace(/\D/g, "");
  return digitos ? `https://wa.me/${digitos}` : "";
}

let leads = mesclarSeedLeads(loadLeads(), typeof SEED_LEADS !== "undefined" ? SEED_LEADS : []);
saveLeads(leads);

function popularFiltros() {
  const cidades = [...new Set(leads.map((l) => l.cidade).filter(Boolean))].sort();
  const nichos = [...new Set(leads.map((l) => l.nicho).filter(Boolean))].sort();

  const valorCidade = leadEls.filtroCidade.value;
  leadEls.filtroCidade.innerHTML =
    '<option value="">Todas as cidades</option>' +
    cidades.map((c) => `<option value="${escapeHtmlLead(c)}">${escapeHtmlLead(c)}</option>`).join("");
  leadEls.filtroCidade.value = valorCidade;

  const valorNicho = leadEls.filtroNicho.value;
  leadEls.filtroNicho.innerHTML =
    '<option value="">Todos os nichos</option>' +
    nichos.map((n) => `<option value="${escapeHtmlLead(n)}">${escapeHtmlLead(n)}</option>`).join("");
  leadEls.filtroNicho.value = valorNicho;
}

function leadsFiltrados() {
  const termo = leadEls.busca.value.trim().toLowerCase();
  const cidade = leadEls.filtroCidade.value;
  const nicho = leadEls.filtroNicho.value;
  const prioridade = leadEls.filtroPrioridade.value;
  const status = leadEls.filtroStatus.value;

  return leads.filter((l) => {
    const combinaTermo =
      !termo ||
      l.nome.toLowerCase().includes(termo) ||
      (l.telefone || "").toLowerCase().includes(termo);
    const combinaCidade = !cidade || l.cidade === cidade;
    const combinaNicho = !nicho || l.nicho === nicho;
    const combinaPrioridade = !prioridade || l.prioridade === prioridade;
    const combinaStatus = !status || l.status === status;
    return combinaTermo && combinaCidade && combinaNicho && combinaPrioridade && combinaStatus;
  });
}

function renderLista(filtrados) {
  leadEls.tbody.innerHTML = filtrados
    .map((l) => {
      const link = waLink(l.telefone);
      const telefoneHtml = link
        ? `<a class="wa-link" href="${link}" target="_blank" rel="noopener">${escapeHtmlLead(l.telefone)}</a>`
        : "-";
      const avaliacaoHtml =
        l.avaliacao != null
          ? `${l.avaliacao.toFixed(1)}★ <span class="muted">(${l.n_avaliacoes ?? 0})</span>`
          : "-";
      const prioridadeSlug = (l.prioridade || "média").toLowerCase();
      return `
    <tr data-id="${l.id}">
      <td data-label="Nome"><strong>${escapeHtmlLead(l.nome)}</strong></td>
      <td data-label="Nicho">${escapeHtmlLead(l.nicho) || "-"}</td>
      <td data-label="Cidade">${escapeHtmlLead(l.cidade) || "-"}</td>
      <td data-label="Telefone">${telefoneHtml}</td>
      <td data-label="Avaliação" class="avaliacao-cell">${avaliacaoHtml}</td>
      <td data-label="Prioridade"><span class="badge badge-prioridade-${prioridadeSlug}">${escapeHtmlLead(l.prioridade)}</span></td>
      <td data-label="Status"><span class="badge badge-${l.status}">${STATUS_LEAD_LABEL[l.status] || l.status}</span></td>
      <td><span class="row-excluir" data-excluir-lead="${l.id}" title="Excluir">&times;</span></td>
    </tr>
  `;
    })
    .join("");

  leadEls.vazio.hidden = filtrados.length > 0;
  leadEls.tbody.parentElement.style.display = filtrados.length === 0 ? "none" : "";
}

function atualizarStatsLeads() {
  leadEls.statTotal.textContent = leads.length;
  leadEls.statAContatar.textContent = leads.filter((l) => l.status === "a_contatar").length;
  leadEls.statEmConversa.textContent = leads.filter(
    (l) => l.status === "contatado" || l.status === "proposta_enviada"
  ).length;
  leadEls.statFechados.textContent = leads.filter((l) => l.status === "fechado").length;
  leadEls.statFocoDia.textContent = leads.filter(
    (l) => l.prioridade === "Alta" && l.status === "a_contatar"
  ).length;
}

const STATUS_ORDER = ["a_contatar", "contatado", "proposta_enviada", "fechado"];
const KANBAN_COLUNAS = ["a_contatar", "contatado", "proposta_enviada", "fechado", "perdido"];

function encontrarLead(id) {
  return leads.find((l) => l.id === id);
}

function mudarStatusLead(id, novoStatus) {
  const lead = encontrarLead(id);
  if (!lead) return;
  lead.status = novoStatus;
  lead.updated_at = new Date().toISOString();
  saveLeads(leads);
  renderLeads();
}

function avancarStatus(id) {
  const lead = encontrarLead(id);
  if (!lead) return;
  const idx = STATUS_ORDER.indexOf(lead.status);
  if (idx === -1 || idx >= STATUS_ORDER.length - 1) return;
  mudarStatusLead(id, STATUS_ORDER[idx + 1]);
}

function voltarStatus(id) {
  const lead = encontrarLead(id);
  if (!lead) return;
  if (lead.status === "perdido") {
    mudarStatusLead(id, "a_contatar");
    return;
  }
  const idx = STATUS_ORDER.indexOf(lead.status);
  if (idx <= 0) return;
  mudarStatusLead(id, STATUS_ORDER[idx - 1]);
}

function abrirModalLead() {
  // implementado na etapa de CRUD manual
}

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

function renderLeads() {
  popularFiltros();
  const filtrados = leadsFiltrados();
  renderLista(filtrados);
  renderKanban(filtrados);
  atualizarStatsLeads();
}

leadEls.busca.addEventListener("input", renderLeads);
leadEls.filtroCidade.addEventListener("change", renderLeads);
leadEls.filtroNicho.addEventListener("change", renderLeads);
leadEls.filtroPrioridade.addEventListener("change", renderLeads);
leadEls.filtroStatus.addEventListener("change", renderLeads);

leadEls.btnViewLista.addEventListener("click", () => {
  leadEls.viewLista.hidden = false;
  leadEls.viewKanban.hidden = true;
  leadEls.btnViewLista.classList.add("active");
  leadEls.btnViewKanban.classList.remove("active");
});

leadEls.btnViewKanban.addEventListener("click", () => {
  leadEls.viewLista.hidden = true;
  leadEls.viewKanban.hidden = false;
  leadEls.btnViewKanban.classList.add("active");
  leadEls.btnViewLista.classList.remove("active");
});

renderLeads();
