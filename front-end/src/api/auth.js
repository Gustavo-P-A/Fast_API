import api from "./axios.js";

export function validarDadosCadastro(nome, email, senha) {
  if (!nome?.trim()) {
    return "Informe seu nome.";
  }

  if (!email?.trim()) {
    return "Informe um e-mail válido.";
  }

  if (!senha || senha.length < 8) {
    return "A senha precisa ter pelo menos 8 caracteres.";
  }

  if (!/[A-Za-z]/.test(senha) || !/\d/.test(senha)) {
    return "A senha precisa ter letras e números.";
  }

  return null;
}

export async function login(email, senha) {
  try {
    const response = await api.post("/auth/login", { email, senha });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function cadastro(nome, email, senha) {
  try {
    const response = await api.post("/auth/criar_usuario", {
      nome,
      email,
      senha,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function me() {
  try {
    const response = await api.get("/auth/me");
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return null;
    }
    console.error(error);
    throw error;
  }
}

export async function atualizar_meus_dados(payload) {
  try {
    const response = await api.put("/auth/me", payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function cardapio() {
  try {
    const response = await api.get("/cardapio/sabores");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function precos() {
  try {
    const response = await api.get("/cardapio/precos");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function saborId(id) {
  try {
    const response = await api.get(`/cardapio/sabores/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function tamanhos_publico() {
  try {
    const response = await api.get("/cardapio/tamanhos");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function preco_adicional(tamanho_id) {
  try {
    const response = await api.get(
      `/cardapio/preco_adicional?tamanho_id=${tamanho_id}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_pedido() {
  try {
    const response = await api.post("/order/pedido", {});
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function pedido_adicionais(id_pedido, payload) {
  try {
    const response = await api.post(
      `/order/pedidos/adicionar-item/${id_pedido}`,
      payload,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function meus_pedidos() {
  try {
    const response = await api.get("/order/listar/meus-pedidos");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function finalizar_pedido_id(id, id_endereco, tipo_pagamento) {
  try {
    const response = await api.post(
      `/order/pedido/finalizar/${id}?tipo_pagamento=${tipo_pagamento}&id_endereco=${id_endereco}`,
      {},
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function endereco() {
  try {
    const response = await api.get("/enderecos/meus-enderecos");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_endereco(endereco) {
  try {
    const response = await api.post("/enderecos/localizacao", endereco);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_endereco(id, endereco) {
  try {
    const response = await api.put(
      `/enderecos/meus-enderecos/editar/${id}`,
      endereco,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function delete_endereco(id) {
  try {
    const response = await api.delete(
      `/enderecos/meus-enderecos/deletar/${id}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
export async function admin_tamanho(nome, qtd_sabores, qtd_bordas) {
  try {
    const response = await api.post("/admin/tamanhos", {
      nome,
      qtd_sabores,
      qtd_bordas,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_grade(nome, posicao) {
  try {
    const response = await api.post("/admin/grade", { nome, posicao });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_grade(id, nome, posicao) {
  try {
    const response = await api.put(`/admin/grade/${id}`, { nome, posicao });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function excluir_grade(id) {
  try {
    const response = await api.delete(`/admin/deletar/grade/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_grade() {
  try {
    const response = await api.get("/admin/listar/grade");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletar_grade(id_grade) {
  try {
    const response = await api.delete(`/admin/deletar/grade/${id_grade}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_grade_sabores(id_grade, id_sabores) {
  try {
    const response = await api.post("/admin/grade_sabores", {
      id_grade,
      id_sabores,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_categoria() {
  try {
    const response = await api.get("/admin/listar/categoria");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_tamanho() {
  try {
    const response = await api.get("/admin/listar/tamanho");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_novo_produto(
  nome,
  descricao,
  ativo,
  categoria_id,
  grade_id,
  precos,
  imagem_url,
  flags = {},
) {
  try {
    const response = await api.post("/admin/novo-produto", {
      nome,
      descricao,
      ativo,
      categoria_id,
      grade_id,
      precos,
      imagem_url,
      disponivel_cardapio_normal: flags.disponivel_cardapio_normal ?? true,
      disponivel_monte_sua_pizza: flags.disponivel_monte_sua_pizza ?? false,
      permite_borda: flags.permite_borda ?? true,
      permite_ingrediente: flags.permite_ingrediente ?? true,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletar_sabor(id_sabor) {
  try {
    const response = await api.delete(`/admin/deletar/sabor/${id_sabor}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_produto(
  id_novo_produto,
  nome,
  descricao,
  ativo,
  grade_id,
  categoria_id,
  precos,
  imagem_url,
  flags = {},
) {
  try {
    const response = await api.put(
      `/admin/editar/novo-produto/${id_novo_produto}`,
      {
        nome,
        descricao,
        ativo,
        grade_id,
        categoria_id,
        precos,
        imagem_url,
        disponivel_cardapio_normal: flags.disponivel_cardapio_normal ?? true,
        disponivel_monte_sua_pizza: flags.disponivel_monte_sua_pizza ?? false,
        permite_borda: flags.permite_borda ?? true,
        permite_ingrediente: flags.permite_ingrediente ?? true,
      },
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_novo_produto(id) {
  try {
    const response = await api.get(`/admin/listar/novo-produto/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletar_tamanho(id) {
  try {
    const response = await api.delete(`/admin/deletar/tamanho/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_pedidos_admin(status = "") {
  try {
    const params = status ? `?status=${status}` : "";
    const response = await api.get(`/admin/listar/pedidos-cliente${params}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function upload_imagem(arquivo) {
  try {
    const formData = new FormData();
    formData.append("file", arquivo);

    const response = await api.post("/admin/upload-imagem", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("Erro no upload:", error);
    throw error;
  }
}

export async function toggle_status_produto(id) {
  try {
    const response = await api.patch(`/admin/produto/${id}/status`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function mudar_status_pedido(id, status) {
  try {
    const response = await api.put(
      `/admin/mudar_status/${id}?tipo_status=${encodeURIComponent(status)}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_clientes_admin() {
  try {
    const response = await api.get("/admin/clientes");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function pedidos_do_cliente(id) {
  try {
    const response = await api.get(`/admin/clientes/${id}/pedidos`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_todos_produtos() {
  try {
    const response = await api.get("/admin/listar/todos-produtos");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_categoria(nome) {
  try {
    const response = await api.post("/admin/categoria", { nome });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_categoria(id, nome) {
  try {
    const response = await api.put(`/admin/categoria/${id}`, { nome });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function excluir_categoria(id) {
  try {
    const response = await api.delete(`/admin/categoria/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function mover_produtos_grade(
  sabor_ids,
  grade_id,
  monte_pizza_ids = [],
  item_simples_ids = [],
) {
  try {
    const response = await api.patch("/admin/produtos/mover-grade", {
      sabor_ids,
      grade_id,
      monte_pizza_ids,
      item_simples_ids,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_produtos_por_grade() {
  try {
    const response = await api.get("/admin/listar/produtos-por-grade");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function cardapio_por_grade() {
  try {
    const response = await api.get("/cardapio/grades");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_adicionais(nome) {
  try {
    const response = await api.post("/admin/adicionais", { nome });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_adicionais() {
  try {
    const response = await api.get("/admin/listar/adicionais");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_preco_adicional(adicional_id, tamanho_id, preco) {
  try {
    const response = await api.post("/admin/preco_adicional", {
      adicional_id,
      tamanho_id,
      preco,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_preco_adicional(id_adicionais, id_tamanho, preco) {
  try {
    const response = await api.put(
      `/admin/editar/adicionais/${id_adicionais}?id_tamanho=${id_tamanho}`,
      {
        adicional_id: id_adicionais,
        tamanho_id: id_tamanho,
        preco,
      },
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function adicionar_adicional(
  id_pedido,
  id_item_pedido,
  id_adicional,
  id_tamanho,
  partes = 1,
) {
  try {
    const params = new URLSearchParams({
      id_pedido,
      id_item_pedido,
      id_adicional,
      id_tamanho,
      partes,
    });
    const response = await api.post(
      `/order/adicionais?${params.toString()}`,
      {},
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function adicionar_ingrediente(
  id_pedido,
  id_item_pedido,
  id_item_simples,
  quantidade = 1,
) {
  try {
    const params = new URLSearchParams({
      id_pedido,
      id_item_pedido,
      id_item_simples,
      quantidade,
    });
    const response = await api.post(
      `/order/ingredientes?${params.toString()}`,
      {},
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function remover_ingrediente(id_item_pedido, id_item_simples) {
  try {
    const response = await api.delete(
      `/order/ingredientes/${id_item_pedido}/${id_item_simples}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function adicionar_bebida_pedido(id_pedido, id_item_simples, quantidade = 1) {
  try {
    const params = new URLSearchParams({ id_pedido, id_item_simples, quantidade });
    const response = await api.post(`/order/bebidas?${params.toString()}`, {});
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function remover_bebida_pedido(id_pedido, id_item_simples) {
  try {
    const response = await api.delete(`/order/bebidas/${id_pedido}/${id_item_simples}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function itens_simples_publico(tipo) {
  try {
    const response = await api.get(`/cardapio/itens-simples?tipo=${tipo}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function monte_pizza_publico() {
  try {
    const response = await api.get("/cardapio/monte-pizza");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function buscar_monte_pizza_publico(id) {
  try {
    const response = await api.get(`/cardapio/monte-pizza/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function pedido_por_id(id) {
  try {
    const response = await api.get(`/order/pedido/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_item_simples(payload) {
  try {
    const response = await api.post("/admin/item-simples", payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_item_simples(id, payload) {
  try {
    const response = await api.put(`/admin/item-simples/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_item_simples(tipo) {
  try {
    const response = await api.get(`/admin/listar/item-simples?tipo=${tipo}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function toggle_status_item_simples(id) {
  try {
    const response = await api.patch(`/admin/item-simples/${id}/status`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletar_item_simples(id) {
  try {
    const response = await api.delete(`/admin/item-simples/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function buscar_item_simples(id) {
  try {
    const response = await api.get(`/admin/item-simples/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function salvar_preco_adicional(id_adicional, id_tamanho, preco) {
  try {
    const response = await api.put(
      `/admin/adicionais/${id_adicional}/preco/${id_tamanho}`,
      {
        adicional_id: id_adicional,
        tamanho_id: id_tamanho,
        preco,
      },
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function toggle_status_adicional(id) {
  try {
    const response = await api.patch(`/admin/adicionais/${id}/status`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletar_adicional(id) {
  try {
    const response = await api.delete(`/admin/adicionais/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_monte_pizza(payload) {
  try {
    const response = await api.post("/admin/monte-pizza/", payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_monte_pizza(id, payload) {
  try {
    const response = await api.put(`/admin/monte-pizza/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function buscar_monte_pizza(id) {
  try {
    const response = await api.get(`/admin/monte-pizza/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_monte_pizza() {
  try {
    const response = await api.get("/admin/monte-pizza/");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function toggle_status_monte_pizza(id) {
  try {
    const response = await api.patch(`/admin/monte-pizza/${id}/status`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletar_monte_pizza(id) {
  try {
    const response = await api.delete(`/admin/monte-pizza/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function importar_sabores_monte_pizza(id) {
  try {
    const response = await api.post(
      `/admin/monte-pizza/${id}/sabores/importar-automatico`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function adicionar_sabores_monte_pizza(id, sabor_ids) {
  try {
    const response = await api.post(
      `/admin/monte-pizza/${id}/sabores/adicionar`,
      { sabor_ids },
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function remover_sabor_monte_pizza(id, sabor_id) {
  try {
    const response = await api.delete(
      `/admin/monte-pizza/${id}/sabores/${sabor_id}`,
    );
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function listar_formas_pagamento() {
  try {
    const response = await api.get("/formas-pagamento/minhas");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function criar_forma_pagamento(payload) {
  try {
    const response = await api.post("/formas-pagamento/", payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function editar_forma_pagamento(id, payload) {
  try {
    const response = await api.put(`/formas-pagamento/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function definir_forma_pagamento_padrao(id) {
  try {
    const response = await api.patch(`/formas-pagamento/${id}/padrao`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function deletar_forma_pagamento(id) {
  try {
    const response = await api.delete(`/formas-pagamento/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function itemSimplesId(id) {
  try {
    const response = await api.get(`/cardapio/itens-simples/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}