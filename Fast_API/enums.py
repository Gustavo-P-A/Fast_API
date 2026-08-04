
from enum import Enum


class TipoFormaPagamento(Enum):
    CREDITO = 'CREDITO'
    DEBITO = 'DEBITO'
    VALE_ALIMENTACAO = 'VALE_ALIMENTACAO'
    VALE_REFEICAO = 'VALE_REFEICAO'


class TipoPagamento(Enum):
    PIX = 'Pix'
    CARTAO_DE_CREDITO = 'Cartão de crédito'
    CARTAO_DE_DEBITO = 'Cartão de débito'
    DINHEIRO = 'Dinheiro'


class TipoItemSimples(Enum):
    BEBIDA = 'BEBIDA'
    INGREDIENTE = 'INGREDIENTE'
