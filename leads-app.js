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

function renderLeads() {
  popularFiltros();
  const filtrados = leadsFiltrados();
  renderLista(filtrados);
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
