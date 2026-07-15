const STORAGE_KEY = "clientes";

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

function atualizarStats() {
  els.statTotal.textContent = clientes.length;
  els.statAndamento.textContent = clientes.filter((c) => c.status === "andamento").length;
  els.statConcluido.textContent = clientes.filter((c) => c.status === "concluido").length;
  const aReceber = clientes
    .filter((c) => c.pagamento !== "pago")
    .reduce((soma, c) => soma + (Number(c.valor_fechado) || Number(c.valor_max) || 0), 0);
  els.statPendente.textContent = formatMoeda(aReceber);
}

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

function fecharModal() {
  els.overlay.hidden = true;
}

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

function excluirCliente(id) {
  if (!confirm("Excluir este cliente?")) return;
  clientes = clientes.filter((c) => c.id !== id);
  saveClientes(clientes);
  render();
  fecharModal();
}

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

render();
