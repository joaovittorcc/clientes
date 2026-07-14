#!/usr/bin/env node
// Lê data/leads_seed.csv e gera leads-data.js (SEED_LEADS) com ids estáveis.
// Repetível: rode `node scripts/build-leads-seed.js` sempre que o CSV mudar.

const fs = require("fs");
const path = require("path");

const CSV_PATH = path.join(__dirname, "..", "data", "leads_seed.csv");
const OUTPUT_PATH = path.join(__dirname, "..", "leads-data.js");

function parseCsv(texto) {
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

  const cabecalho = linhas[0];
  return linhas.slice(1).map((linha) => {
    const obj = {};
    cabecalho.forEach((chave, idx) => {
      obj[chave.trim()] = (linha[idx] ?? "").trim();
    });
    return obj;
  });
}

function slugify(str) {
  return str
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function main() {
  const csvTexto = fs.readFileSync(CSV_PATH, "utf-8");
  const linhas = parseCsv(csvTexto);

  const leads = linhas.map((linha) => ({
    id: `${slugify(linha.nome)}-${slugify(linha.cidade)}`,
    nome: linha.nome,
    nicho: linha.nicho || "",
    cidade: linha.cidade || "",
    telefone: linha.telefone || "",
    avaliacao: linha.avaliacao ? Number(linha.avaliacao) : null,
    n_avaliacoes: linha.n_avaliacoes ? Number(linha.n_avaliacoes) : null,
    prioridade: linha.prioridade || "Média",
    site_confirmado: linha.site_confirmado || "A verificar",
    status: linha.status || "a_contatar",
    observacoes: "",
    origem: "google_maps",
    created_at: new Date().toISOString(),
  }));

  const conteudo = `// Gerado por scripts/build-leads-seed.js a partir de data/leads_seed.csv
// Não edite à mão — rode o script novamente para atualizar.
const SEED_LEADS = ${JSON.stringify(leads, null, 2)};
`;

  fs.writeFileSync(OUTPUT_PATH, conteudo, "utf-8");
  console.log(`${leads.length} leads gerados em ${path.relative(process.cwd(), OUTPUT_PATH)}`);
}

main();
