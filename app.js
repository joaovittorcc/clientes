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

const STATUS_LABEL = {
  andamento: "Em andamento",
  concluido: "Concluído",
  pausado: "Pausado",
};

const PAGAMENTO_LABEL = {
  pendente: "Pendente",
  pago: "Pago",
  parcial: "Parcial",
};

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

function loadClientes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

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

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

function mesclarSeed(existentes, seed) {
  const idsSeed = new Set(seed.map((c) => c.id));
  const idsExistentes = new Set(existentes.map((c) => c.id));

  // Mantém clientes criados manualmente pelo usuário (ou sem origem definida,
  // por compatibilidade com dados salvos antes deste campo existir), e
  // qualquer cliente de seed que ainda existe na base atual (sem sobrescrever
  // o que o usuário já editou).
  const mantidos = existentes.filter(
    (c) => (c.origem ?? "manual") === "manual" || idsSeed.has(c.id)
  );

  // Adiciona só os clientes de seed que ainda não existem na base local.
  const novos = seed.filter((c) => !idsExistentes.has(c.id));

  return mantidos.concat(novos);
}

let clientes = mesclarSeed(loadClientes(), typeof SEED_CLIENTES !== "undefined" ? SEED_CLIENTES : []).map(migrarCliente);
saveClientes(clientes);

let checklistsExpandidos = new Set();

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

  const notaTexto = c.nota_rapida ? escapeHtml(c.nota_rapida) : "Nenhuma nota ainda";
  const demoHtml = c.demo_url
    ? `<a class="cliente-demo" href="${escapeHtml(c.demo_url)}" target="_blank" rel="noopener">🔗 ${escapeHtml(c.demo_url)}</a>`
    : "";

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

function atualizarStats() {
  els.statTotal.textContent = clientes.length;
  els.statAndamento.textContent = clientes.filter((c) => c.status === "andamento").length;
  els.statConcluido.textContent = clientes.filter((c) => c.status === "concluido").length;
  const aReceber = clientes
    .filter((c) => c.pagamento !== "pago")
    .reduce((soma, c) => soma + (Number(c.valor_fechado) || Number(c.valor_max) || 0), 0);
  els.statPendente.textContent = formatMoeda(aReceber);
}

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

function fecharModal() {
  els.overlay.hidden = true;
}

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

function excluirCliente(id) {
  if (!confirm("Excluir este cliente?")) return;
  clientes = clientes.filter((c) => c.id !== id);
  saveClientes(clientes);
  render();
  fecharModal();
}

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

els.btnNovo.addEventListener("click", () => abrirModal(null));
els.btnFechar.addEventListener("click", fecharModal);
els.btnCancelar.addEventListener("click", fecharModal);
els.overlay.addEventListener("click", (e) => {
  if (e.target === els.overlay) fecharModal();
});
els.form.addEventListener("submit", onSubmit);
els.btnExcluir.addEventListener("click", () => {
  const id = document.getElementById("cliente-id").value;
  excluirCliente(id);
});
els.busca.addEventListener("input", render);
els.filtroStatus.addEventListener("change", render);

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

render();
