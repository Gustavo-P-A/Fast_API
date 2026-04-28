import api from './axios.js'

export async function login (email, senha){

    try{
        const response  = await api.post('/auth/login', {email, senha});
        return response.data
    } catch (error) {
        console.error(error)
}}
    
    


export async function cadastro (nome, email, senha) {
    try {
        const response = await api.post ('/auth/criar_usuario', {nome, email, senha});
        return response.data
    } catch (error) {
        console.error(error)
    }
}



export async function cardapio() {
    try{
        const response = await api.get('/cardapio/sabores')
        return response.data
    } catch(error){
        console.error(error)
    }
}


export async function precos() {
    try{
        const response = await api.get('/cardapio/precos')
        return response.data
    } catch(error){
        console.error(error)
    }
}


export async function saborId(id) {
    try{
        const response = await api.get(`/cardapio/sabores/${id}`)
        return response.data
    } catch(error){
        console.error(error)
    }
}


export async function criar_pedido(token) {
    try{
        const response = await api.post('/order/pedido',{},{
        headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
    } catch(error){
        console.error(error)
    }
}


export async function pedido_adicionais(id, precopizza_id, token) {
    try {
        const response = await api.post(
            `/order/pedidos/adicionar-item/${id}?precopizza_id=${precopizza_id}`,
            { quantidade: 1 },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    } catch (error) {
        console.error(error);
    }
}
export async function me(token) {
    try {
        const response = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
    } catch(error) {
        console.error(error)
    }
}

export async function admin_sabores(token, nome, descricao) {
    try {
        const response = await api.post('/admin/sabores', 
            { nome, descricao },
            {headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
    } catch(error) {
        console.error(error)
    }
}

export async function admin_tamanho(token, nome) {
    try {
        const response = await api.post('/admin/tamanhos', 
            { nome },
            {headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
    } catch(error) {
        console.error(error)
    }
}

export async function admin_preco_pizza(token, sabor_id, tamanho_id, preco) {
    try {
        const response = await api.post('/admin/preco_pizza', 
            { sabor_id, tamanho_id, preco },
            {headers: { Authorization: `Bearer ${token}` }
        })
        return response.data
    } catch(error) {
        console.error(error)
    }
}