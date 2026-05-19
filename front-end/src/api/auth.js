import api from "./axios.js";

export async function login(email, senha) {
  try {
    const response = await api.post("/auth/login", { email, senha });
    return response.data;
  } catch (error) {
    console.error(error);
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
  }
}

export async function cardapio() {
  try {
    const response = await api.get("/cardapio/sabores");
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function precos() {
  try {
    const response = await api.get("/cardapio/precos");
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function saborId(id) {
  try {
    const response = await api.get(`/cardapio/sabores/${id}`);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function criar_pedido(token) {
  try {
    const response = await api.post(
      "/order/pedido",
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function pedido_adicionais(id, precopizza_id, token) {
  try {
    const response = await api.post(
      `/order/pedidos/adicionar-item/${id}?precopizza_id=${precopizza_id}`,
      { quantidade: 1 },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}
export async function me(token) {
  try {
    const response = await api.get("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function admin_sabores(token, nome, descricao) {
  try {
    const response = await api.post(
      "/admin/sabores",
      { nome, descricao },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function admin_tamanho(token, nome) {
  try {
    const response = await api.post(
      "/admin/tamanhos",
      { nome },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function admin_preco_pizza(token, sabor_id, tamanho_id, preco) {
  try {
    const response = await api.post(
      "/admin/preco_pizza",
      { sabor_id, tamanho_id, preco },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function meus_pedidos(token) {
  try {
    const response = await api.get("/order/listar/meus-pedidos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function endereco(token) {
  try {
    const response = await api.get("/enderecos/meus-enderecos", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function finalizar_pedido_id(id, id_endereco, tipo_pagamento, token) {
  try {
    const response = await api.post(
      `/order/pedido/finalizar/${id}?tipo_pagamento=${tipo_pagamento}&id_endereco=${id_endereco}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}


export async function editar_endereco(id,endereco, token) {
  try {
    const response = await api.put(
      `/enderecos/meus-enderecos/editar/${id}`,
      endereco,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function criar_endereco(endereco, token) {
  try {
    const response = await api.post(
      '/enderecos/localizacao',
      endereco,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function delete_endereco(id, token) {
  try {
    const response = await api.delete(
      `/enderecos/meus-enderecos/deletar/${id}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}


export async function preco_adicional(tamanho_id) {
  try {
    const response = await api.get(
      `/cardapio/preco_adicional?tamanho_id=${tamanho_id}`
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function adicionar_adicional(id_pedido, id_item_pedido, id_adicional, id_tamanho, token) {
  try {
    const response = await api.post(
      `/order/adicionais?id_pedido=${id_pedido}&id_item_pedido=${id_item_pedido}&id_adicional=${id_adicional}&id_tamanho=${id_tamanho}`,
       {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}


export async function criar_grade(nome, posicao,token) {
  try {
    const response = await api.post(
      '/admin/grade',
       {nome, posicao},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function listar_grade(token) {
  try {
    const response = await api.get(
      '/admin/listar/grade',    
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export async function deletar_grade(id_grade, token) {
  try {
    const response = await api.delete(
      `/admin/deletar/grade/${id_grade}`,
       {},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}


export async function criar_grade_sabores(id_grade,id_sabores, token) {
  try {
    const response = await api.post(
      '/admin/grade_sabores',
       {id_grade, id_sabores},
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
}