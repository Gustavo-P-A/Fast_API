import unicodedata
import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from order_routes import _montar_resposta_pedido
from database import pegar_conexao, fetch_one, execute, ConnCommitRoute
from enums import TipoPagamento
from core.security import verificar_token

finalizar_pagamento = APIRouter(prefix="/order", tags=["pagamento"], route_class=ConnCommitRoute)


def normalizar(texto: str) -> str:
    return unicodedata.normalize("NFC", texto)


def gerar_pix_fake(preco: float) -> str:
    # Só pra parecer um "copia e cola" de verdade — não é um Pix real,
    # não processa pagamento nenhum. Quando integrar um gateway de
    # verdade, essa função inteira é trocada pela chamada à API dele.
    return f"00020126580014BR.GOV.BCB.PIX0136{secrets.token_hex(16)}5204000053039865802BR6009SAOPAULO62070503***6304{secrets.token_hex(2).upper()}"


@finalizar_pagamento.post('/pedido/finalizar/{id_pedido}')
async def finalizar_pedido(
    id_pedido: int,
    tipo_pagamento: TipoPagamento,
    id_endereco: int,
    forma_pagamento_id: int | None = None,   # obrigatório se cartão/vale
    parcelas: int | None = None,             # só cartão de crédito
    troco_para: float | None = None,         # só dinheiro
    conn = Depends(pegar_conexao),
    usuario: dict = Depends(verificar_token)
):
    pedido = fetch_one(conn, "SELECT id, usuario_id, preco FROM pedidos WHERE id = %s", (id_pedido,))
    if not pedido:
        raise HTTPException(status_code=404, detail='Pedido não encontrado')
    if not usuario["adm"] and usuario["id"] != pedido["usuario_id"]:
        raise HTTPException(status_code=401, detail='Você não tem autorização para fazer está modificação')

    endereco = fetch_one(conn, "SELECT id FROM enderecos_entrega WHERE id = %s", (id_endereco,))
    if not endereco:
        raise HTTPException(status_code=404, detail='Endereço não encontrado')

    eh_cartao = tipo_pagamento in (TipoPagamento.CARTAO_DE_CREDITO, TipoPagamento.CARTAO_DE_DEBITO)

    if eh_cartao:
        if not forma_pagamento_id:
            raise HTTPException(status_code=400, detail='Selecione um cartão cadastrado')
        forma = fetch_one(
            conn, "SELECT id, tipo FROM formas_pagamento WHERE id = %s AND usuario_id = %s AND ativo = true",
            (forma_pagamento_id, usuario["id"]),
        )
        if not forma:
            raise HTTPException(status_code=404, detail='Forma de pagamento não encontrada')
        if tipo_pagamento == TipoPagamento.CARTAO_DE_CREDITO and parcelas and parcelas > 1 and forma["tipo"] != "CREDITO":
            raise HTTPException(status_code=400, detail='Parcelamento só é permitido em cartão de crédito')

    if tipo_pagamento == TipoPagamento.DINHEIRO and troco_para is not None and troco_para < pedido["preco"]:
        raise HTTPException(status_code=400, detail='Valor do troco deve ser maior que o total do pedido')

    pix_codigo = None
    pix_expira_em = None
    status = 'PENDENTE'

    if tipo_pagamento == TipoPagamento.PIX:
        pix_codigo = gerar_pix_fake(pedido["preco"])
        pix_expira_em = datetime.now(timezone.utc) + timedelta(hours=1)
        status = 'AGUARDANDO_PAGAMENTO_PIX'

    execute(
        conn,
        """
        UPDATE pedidos
        SET formato_de_pagamento = %s, endereco_id = %s, forma_pagamento_id = %s,
            parcelas = %s, troco_para = %s, pix_codigo = %s, pix_expira_em = %s, status = %s
        WHERE id = %s
        """,
        (
            normalizar(tipo_pagamento.value), endereco["id"],
            forma_pagamento_id if eh_cartao else None,
            parcelas if eh_cartao and tipo_pagamento == TipoPagamento.CARTAO_DE_CREDITO else None,
            troco_para if tipo_pagamento == TipoPagamento.DINHEIRO else None,
            pix_codigo, pix_expira_em, status, id_pedido,
        ),
    )
    return {'mensagem': f'Pedido numero: {id_pedido} finalizado com sucesso', 'pedido': _montar_resposta_pedido(conn, id_pedido)}