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
let kanbanColunaAberta = "a_contatar";

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

const modalLeadEls = {
  overlay: document.getElementById("modal-lead-overlay"),
  title: document.getElementById("modal-lead-title"),
  form: document.getElementById("form-lead"),
  btnNovo: document.getElementById("btn-novo-lead"),
  btnFechar: document.getElementById("btn-fechar-lead"),
  btnCancelar: document.getElementById("btn-cancelar-lead"),
  btnExcluir: document.getElementById("btn-excluir-lead"),
};

function abrirModalLead(lead) {
  modalLeadEls.form.reset();
  if (lead) {
    modalLeadEls.title.textContent = "Editar lead";
    document.getElementById("l-id").value = lead.id;
    document.getElementById("l-nome").value = lead.nome || "";
    document.getElementById("l-nicho").value = lead.nicho || "";
    document.getElementById("l-cidade").value = lead.cidade || "";
    document.getElementById("l-telefone").value = lead.telefone || "";
    document.getElementById("l-avaliacao").value = lead.avaliacao ?? "";
    document.getElementById("l-n-avaliacoes").value = lead.n_avaliacoes ?? "";
    document.getElementById("l-prioridade").value = lead.prioridade || "Média";
    document.getElementById("l-site-confirmado").value = lead.site_confirmado || "A verificar";
    document.getElementById("l-status").value = lead.status || "a_contatar";
    document.getElementById("l-obs").value = lead.obs || lead.observacoes || "";
    modalLeadEls.btnExcluir.hidden = false;
  } else {
    modalLeadEls.title.textContent = "Novo lead";
    document.getElementById("l-id").value = "";
    modalLeadEls.btnExcluir.hidden = true;
  }
  modalLeadEls.overlay.hidden = false;
}

function fecharModalLead() {
  modalLeadEls.overlay.hidden = true;
}

function slugifyLead(str) {
  return (str || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function gerarIdLead(nome, cidade) {
  const base = `${slugifyLead(nome)}-${slugifyLead(cidade)}` || `lead-${Date.now()}`;
  let id = base;
  let contador = 2;
  while (leads.some((l) => l.id === id)) {
    id = `${base}-${contador}`;
    contador++;
  }
  return id;
}

function onSubmitLead(e) {
  e.preventDefault();
  const id = document.getElementById("l-id").value;
  const nome = document.getElementById("l-nome").value.trim();
  const cidade = document.getElementById("l-cidade").value.trim();
  const dados = {
    nome,
    nicho: document.getElementById("l-nicho").value.trim(),
    cidade,
    telefone: document.getElementById("l-telefone").value.trim(),
    avaliacao: document.getElementById("l-avaliacao").value
      ? Number(document.getElementById("l-avaliacao").value)
      : null,
    n_avaliacoes: document.getElementById("l-n-avaliacoes").value
      ? Number(document.getElementById("l-n-avaliacoes").value)
      : null,
    prioridade: document.getElementById("l-prioridade").value,
    site_confirmado: document.getElementById("l-site-confirmado").value,
    status: document.getElementById("l-status").value,
    observacoes: document.getElementById("l-obs").value.trim(),
    updated_at: new Date().toISOString(),
  };

  if (id) {
    const idx = leads.findIndex((l) => l.id === id);
    if (idx !== -1) leads[idx] = { ...leads[idx], ...dados };
  } else {
    leads.push({
      id: gerarIdLead(nome, cidade),
      origem: "manual",
      created_at: new Date().toISOString(),
      ...dados,
    });
  }

  saveLeads(leads);
  renderLeads();
  fecharModalLead();
}

function excluirLead(id) {
  if (!confirm("Excluir este lead?")) return;
  leads = leads.filter((l) => l.id !== id);
  saveLeads(leads);
  renderLeads();
  fecharModalLead();
}

modalLeadEls.btnNovo.addEventListener("click", () => abrirModalLead(null));
modalLeadEls.btnFechar.addEventListener("click", fecharModalLead);
modalLeadEls.btnCancelar.addEventListener("click", fecharModalLead);
modalLeadEls.overlay.addEventListener("click", (e) => {
  if (e.target === modalLeadEls.overlay) fecharModalLead();
});
modalLeadEls.form.addEventListener("submit", onSubmitLead);
modalLeadEls.btnExcluir.addEventListener("click", () => {
  const id = document.getElementById("l-id").value;
  excluirLead(id);
});

leadEls.tbody.addEventListener("click", (e) => {
  const idExcluir = e.target.dataset.excluirLead;
  if (idExcluir) {
    excluirLead(idExcluir);
    return;
  }
  const tr = e.target.closest("tr");
  if (tr) {
    const lead = encontrarLead(tr.dataset.id);
    if (lead) abrirModalLead(lead);
  }
});

// --- Import CSV ---

function parseCsvTexto(texto) {
  const linhas = [];
  let linhaAtual = [];
  let campoAtual = "";
  let dentroDeAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const char = texto[i];
    const proximo = texto[i + 1];

    if (dentroDeAspas) {
      if (char === '"' && proximo === '"') {
        campoAtual += '"';
        i++;
      } else if (char === '"') {
        dentroDeAspas = false;
      } else {
        campoAtual += char;
      }
    } else if (char === '"') {
      dentroDeAspas = true;
    } else if (char === ",") {
      linhaAtual.push(campoAtual);
      campoAtual = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && proximo === "\n") i++;
      linhaAtual.push(campoAtual);
      campoAtual = "";
      if (linhaAtual.some((v) => v !== "")) linhas.push(linhaAtual);
      linhaAtual = [];
    } else {
      campoAtual += char;
    }
  }
  if (campoAtual !== "" || linhaAtual.length) {
    linhaAtual.push(campoAtual);
    linhas.push(linhaAtual);
  }

  if (linhas.length === 0) return [];
  const cabecalho = linhas[0].map((c) => c.trim());
  return linhas.slice(1).map((linha) => {
    const obj = {};
    cabecalho.forEach((chave, idx) => {
      obj[chave] = (linha[idx] ?? "").trim();
    });
    return obj;
  });
}

function chaveDedupe(nome, cidade) {
  return `${slugifyLead(nome)}|${slugifyLead(cidade)}`;
}

function importarLeadsCsv(texto) {
  const linhas = parseCsvTexto(texto);
  const chavesExistentes = new Set(leads.map((l) => chaveDedupe(l.nome, l.cidade)));

  let importados = 0;
  let ignorados = 0;
  let comErro = 0;

  linhas.forEach((linha) => {
    if (!linha.nome || !linha.nome.trim()) {
      comErro++;
      return;
    }
    const chave = chaveDedupe(linha.nome, linha.cidade);
    if (chavesExistentes.has(chave)) {
      ignorados++;
      return;
    }
    chavesExistentes.add(chave);
    leads.push({
      id: gerarIdLead(linha.nome, linha.cidade),
      nome: linha.nome.trim(),
      nicho: (linha.nicho || "").trim(),
      cidade: (linha.cidade || "").trim(),
      telefone: (linha.telefone || "").trim(),
      avaliacao: linha.avaliacao ? Number(linha.avaliacao) : null,
      n_avaliacoes: linha.n_avaliacoes ? Number(linha.n_avaliacoes) : null,
      prioridade: linha.prioridade || "Média",
      site_confirmado: linha.site_confirmado || "A verificar",
      status: linha.status || "a_contatar",
      observacoes: "",
      origem: "csv_import",
      created_at: new Date().toISOString(),
    });
    importados++;
  });

  if (importados > 0) saveLeads(leads);
  return { importados, ignorados, comErro, total: linhas.length };
}

const importEls = {
  overlay: document.getElementById("modal-import-overlay"),
  btnAbrir: document.getElementById("btn-importar"),
  btnFechar: document.getElementById("btn-fechar-import"),
  btnCancelar: document.getElementById("btn-cancelar-import"),
  btnConfirmar: document.getElementById("btn-confirmar-import"),
  file: document.getElementById("import-file"),
  texto: document.getElementById("import-texto"),
  resultado: document.getElementById("import-resultado"),
};

function abrirModalImport() {
  importEls.texto.value = "";
  importEls.file.value = "";
  importEls.resultado.hidden = true;
  importEls.overlay.hidden = false;
}

function fecharModalImport() {
  importEls.overlay.hidden = true;
}

importEls.btnAbrir.addEventListener("click", abrirModalImport);
importEls.btnFechar.addEventListener("click", fecharModalImport);
importEls.btnCancelar.addEventListener("click", fecharModalImport);
importEls.overlay.addEventListener("click", (e) => {
  if (e.target === importEls.overlay) fecharModalImport();
});

importEls.file.addEventListener("change", () => {
  const arquivo = importEls.file.files[0];
  if (!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = () => {
    importEls.texto.value = String(leitor.result || "");
  };
  leitor.readAsText(arquivo);
});

importEls.btnConfirmar.addEventListener("click", () => {
  const texto = importEls.texto.value.trim();
  if (!texto) return;
  const resultado = importarLeadsCsv(texto);
  importEls.resultado.hidden = false;
  importEls.resultado.textContent = `${resultado.importados} importado(s), ${resultado.ignorados} ignorado(s) por duplicidade, ${resultado.comErro} linha(s) com erro (de ${resultado.total} linhas lidas).`;
  if (resultado.importados > 0) renderLeads();
});

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
