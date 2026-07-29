"""
Enums puros de domínio — não têm nada a ver com SQLAlchemy, só eram
declarados dentro de models.py porque o SQLAlchemy Column(Enum(...))
também usava eles. Sem ORM, ficam aqui e continuam servindo pra:
  - validar query params / body nas rotas (FastAPI valida Enum sozinho)
  - montar o CHECK constraint em sql/schema.sql (os valores têm que
    bater com os definidos ali)
"""
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
