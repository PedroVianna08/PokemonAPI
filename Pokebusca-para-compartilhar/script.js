/*
  PokéBusca — JavaScript do frontend.
  Etapa inicial: pesquisa na PokéAPI.
  Na etapa do Supabase, preencha SUPABASE_URL e SUPABASE_ANON_KEY
  com os dados públicos do seu próprio projeto.
*/


const SUPABASE_URL = "https://ewaufdfjrbfclwlfzbue.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ehzL5rdX_EypjoidzYXhsg_kKmBk7R-";

let supabaseClient = null;
let pokemonAtual = null;

const formBusca = document.getElementById("form-busca");
const campoBusca = document.getElementById("campo-busca");
const botaoBuscar = document.getElementById("botao-buscar");
const resultado = document.getElementById("resultado");
const listaFavoritos = document.getElementById("lista-favoritos");
const botaoAtualizar = document.getElementById("botao-atualizar");

function escaparHTML(valor) {
  return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[caractere]);
}

function inicializarSupabase() {
  if (
    !window.supabase ||
    !window.supabase.createClient ||
    SUPABASE_URL.startsWith("COLE_") ||
    SUPABASE_ANON_KEY.startsWith("COLE_")
  ) {
    return null;
  }

  try {
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (erro) {
    console.error("Não foi possível inicializar o Supabase:", erro);
    return null;
  }
}

function mostrarAviso(mensagem, tipo = "") {
  const avisoAnterior = document.getElementById("aviso-app");
  if (avisoAnterior) avisoAnterior.remove();

  const aviso = document.createElement("div");
  aviso.id = "aviso-app";
  aviso.className = `notice ${tipo}`.trim();
  aviso.textContent = mensagem;
  resultado.prepend(aviso);
}

function mostrarCarregando() {
  resultado.innerHTML = `
    <div class="empty-state panel">
      <div class="empty-icon" aria-hidden="true">◌</div>
      <h3>Buscando Pokémon...</h3>
      <p>Consultando a PokéAPI.</p>
    </div>`;
}

async function buscarPokemon(termo) {
  const busca = termo.trim().toLowerCase();

  if (!busca) {
    mostrarAviso("Digite o nome ou o número de um Pokémon.", "error");
    campoBusca.focus();
    return;
  }

  botaoBuscar.disabled = true;
  mostrarCarregando();

  try {
    const resposta = await fetch(
      `https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(busca)}`
    );

    if (!resposta.ok) {
      throw new Error("Pokémon não encontrado.");
    }

    const dados = await resposta.json();

    pokemonAtual = {
      id: dados.id,
      nome: dados.name,
      imagem:
        dados.sprites.other?.["official-artwork"]?.front_default ||
        dados.sprites.front_default ||
        "",
      altura: dados.height / 10,
      peso: dados.weight / 10,
      tipos: dados.types.map(item => item.type.name)
    };

    renderizarPokemon(pokemonAtual);
  } catch (erro) {
    pokemonAtual = null;
    resultado.innerHTML = `
      <div class="empty-state panel">
        <div class="empty-icon" aria-hidden="true">?</div>
        <h3>Não encontramos esse Pokémon</h3>
        <p>Confira a escrita ou tente pesquisar pelo número na Pokédex.</p>
      </div>`;
  } finally {
    botaoBuscar.disabled = false;
  }
}

function renderizarPokemon(pokemon) {
  const nome = escaparHTML(pokemon.nome);
  const imagem = escaparHTML(pokemon.imagem);
  const tipos = pokemon.tipos.map(escaparHTML);

  resultado.innerHTML = `
    <article class="pokemon-card panel">
      <div class="pokemon-art">
        ${imagem
          ? `<img src="${imagem}" alt="Ilustração de ${nome}">`
          : `<p>Imagem indisponível</p>`}
      </div>
      <div class="pokemon-info">
        <span class="pokemon-number">Nº ${String(pokemon.id).padStart(4, "0")}</span>
        <h3>${nome}</h3>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-label">Altura</span>
            <span class="stat-value">${pokemon.altura} m</span>
          </div>
          <div class="stat">
            <span class="stat-label">Peso</span>
            <span class="stat-value">${pokemon.peso} kg</span>
          </div>
          <div class="stat">
            <span class="stat-label">Número</span>
            <span class="stat-value">#${pokemon.id}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Tipo(s)</span>
            <div class="type-list">${tipos.map(tipo => `<span class="type-chip">${tipo}</span>`).join("")}</div>
          </div>
        </div>
        <button id="botao-favoritar" class="button-primary" type="button">
          ★ Salvar nos favoritos
        </button>
      </div>
    </article>`;

  document.getElementById("botao-favoritar")
    .addEventListener("click", adicionarFavorito);
}

async function adicionarFavorito() {
  if (!pokemonAtual) return;

  if (!supabaseClient) {
    mostrarAviso("A pesquisa funciona, mas os favoritos ainda precisam ser conectados ao Supabase na próxima etapa.");
    return;
  }

  const botao = document.getElementById("botao-favoritar");
  botao.disabled = true;
  botao.textContent = "Salvando...";

  try {
    const { data: existentes, error: erroBusca } = await supabaseClient
      .from("favoritos")
      .select("id")
      .eq("nome_item", pokemonAtual.nome)
      .limit(1);

    if (erroBusca) throw erroBusca;

    if (existentes?.length) {
      mostrarAviso("Esse Pokémon já está nos seus favoritos.");
      return;
    }

    const { error } = await supabaseClient
      .from("favoritos")
      .insert({
        nome_item: pokemonAtual.nome,
        dados_extra: pokemonAtual
      });

    if (error) throw error;

    mostrarAviso("Pokémon salvo nos favoritos!", "success");
    await carregarFavoritos();
  } catch (erro) {
    console.error("Erro ao salvar favorito:", erro);
    mostrarAviso("Não foi possível salvar. Vamos conferir a tabela e as permissões do Supabase.", "error");
  } finally {
    const botaoAtual = document.getElementById("botao-favoritar");
    if (botaoAtual) {
      botaoAtual.disabled = false;
      botaoAtual.textContent = "★ Salvar nos favoritos";
    }
  }
}

async function carregarFavoritos() {
  supabaseClient = inicializarSupabase();

  if (!supabaseClient) {
    listaFavoritos.innerHTML = `
      <div class="empty-state panel compact">
        <h3>Banco de dados ainda não conectado</h3>
        <p>Na próxima etapa vamos configurar o Supabase para salvar seus favoritos de verdade.</p>
      </div>`;
    return;
  }

  listaFavoritos.innerHTML = `<div class="empty-state panel compact"><p>Carregando favoritos...</p></div>`;

  try {
    const { data, error } = await supabaseClient
      .from("favoritos")
      .select("id, created_at, nome_item, dados_extra")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!data?.length) {
      listaFavoritos.innerHTML = `
        <div class="empty-state panel compact">
          <h3>Nenhum favorito por enquanto</h3>
          <p>Pesquise um Pokémon e salve-o para começar sua coleção.</p>
        </div>`;
      return;
    }

    listaFavoritos.innerHTML = data.map(favorito => {
      const pokemon = favorito.dados_extra || {};
      const nome = escaparHTML(favorito.nome_item || pokemon.nome || "Pokémon");
      const imagem = escaparHTML(pokemon.imagem || "");
      const tipos = Array.isArray(pokemon.tipos)
        ? pokemon.tipos.map(escaparHTML).join(", ")
        : "Tipo não informado";
      const id = escaparHTML(favorito.id);

      return `
        <article class="favorite-card">
          <div class="favorite-art">
            ${imagem ? `<img src="${imagem}" alt="Ilustração de ${nome}">` : ""}
          </div>
          <div>
            <h3>${nome}</h3>
            <p>${tipos} · Nº ${escaparHTML(pokemon.id ?? "—")}</p>
            <button class="delete-favorite" type="button" data-id="${id}">
              Remover favorito
            </button>
          </div>
        </article>`;
    }).join("");
  } catch (erro) {
    console.error("Erro ao carregar favoritos:", erro);
    listaFavoritos.innerHTML = `
      <div class="empty-state panel compact">
        <h3>Não foi possível carregar os favoritos</h3>
        <p>Verifique a tabela e as políticas de acesso do Supabase.</p>
      </div>`;
  }
}

async function excluirFavorito(id) {
  if (!supabaseClient) return;

  if (!window.confirm("Deseja remover este Pokémon dos favoritos?")) return;

  try {
    const { error } = await supabaseClient
      .from("favoritos")
      .delete()
      .eq("id", id);

    if (error) throw error;
    await carregarFavoritos();
  } catch (erro) {
    console.error("Erro ao excluir favorito:", erro);
    alert("Não foi possível excluir o favorito. Confira as permissões do Supabase.");
  }
}

formBusca.addEventListener("submit", evento => {
  evento.preventDefault();
  buscarPokemon(campoBusca.value);
});

listaFavoritos.addEventListener("click", evento => {
  const botao = evento.target.closest(".delete-favorite");
  if (botao) excluirFavorito(botao.dataset.id);
});

botaoAtualizar.addEventListener("click", carregarFavoritos);

carregarFavoritos();
