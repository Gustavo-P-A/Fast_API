from datetime import datetime
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field, field_serializer, field_validator
from typing import Optional, List, Literal
import re


class UsuarioSchema(BaseModel):
    nome: str
    email: str
    senha: str = Field(min_length=8)

    model_config = ConfigDict(from_attributes=True)

    @field_validator('senha')
    @classmethod
    def senha_forte(cls, valor: str) -> str:
        if not re.search(r'[A-Za-z]', valor) or not re.search(r'\d', valor):
            raise ValueError('A senha precisa ter pelo menos 8 caracteres, incluindo letras e números')
        return valor

class LoginSchema(BaseModel):
    email: str
    senha: str

    model_config = ConfigDict(from_attributes=True)


def _cpf_valido(cpf: str) -> bool:
    """Valida CPF pelo algoritmo oficial dos dois dígitos verificadores."""
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False

    def _digito_verificador(cpf_parcial: str) -> str:
        peso_inicial = len(cpf_parcial) + 1
        soma = sum(int(d) * peso for d, peso in zip(cpf_parcial, range(peso_inicial, 1, -1)))
        resto = soma % 11
        return '0' if resto < 2 else str(11 - resto)

    d1 = _digito_verificador(cpf[:9])
    d2 = _digito_verificador(cpf[:9] + d1)
    return cpf[-2:] == d1 + d2


class AtualizarUsuarioSchema(BaseModel):
    nome: str
    email: str
    cpf: Optional[str] = None
    telefone: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator('nome')
    @classmethod
    def nome_nao_vazio(cls, valor: str) -> str:
        if not valor.strip():
            raise ValueError('Informe seu nome completo')
        return valor.strip()

    @field_validator('cpf')
    @classmethod
    def cpf_formatado_e_valido(cls, valor: Optional[str]) -> Optional[str]:
        if not valor:
            return None
        digitos = re.sub(r'\D', '', valor)
        if not _cpf_valido(digitos):
            raise ValueError('CPF inválido')
        return digitos

    @field_validator('telefone')
    @classmethod
    def telefone_valido(cls, valor: Optional[str]) -> Optional[str]:
        if not valor:
            return None
        digitos = re.sub(r'\D', '', valor)
        if len(digitos) not in (10, 11):
            raise ValueError('Telefone inválido, informe DDD + número')
        return digitos


class TamanhosSchema(BaseModel):
    nome: str
    qtd_sabores: int
    qtd_bordas: int

    model_config = ConfigDict(from_attributes=True)


class TamanhoPublicoSchema(BaseModel):
    id: int
    nome: str
    qtd_sabores: int
    qtd_bordas: int

    model_config = ConfigDict(from_attributes=True)


class AdicionaisSchema(BaseModel):
    nome: str

    model_config = ConfigDict(from_attributes=True)


class SaboresResponseSchema(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    imagem_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class AdicionaisResponseSchema(BaseModel):
    id: int
    nome: str
    ativo: bool

    model_config = ConfigDict(from_attributes=True)


class TamanhoResponseSchema(BaseModel):
    id: int
    nome: str
    qtd_sabores: int
    qtd_bordas: int

    model_config = ConfigDict(from_attributes=True)


class ItemPedidoCriacaoSchema(BaseModel):
    tamanho_id: int
    sabor_ids: List[int] = Field(min_length=1)
    quantidade: int = Field(ge=1, default=1)
    observacoes: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class PrecoAdicionalResponseSchema(BaseModel):
    id: int
    preco: float
    adicional_rel: AdicionaisResponseSchema

    model_config = ConfigDict(from_attributes=True)


class PrecoPizzaResponseSchema(BaseModel):
    id: int
    preco: float
    sabor_rel: SaboresResponseSchema
    tamanho_rel: TamanhoResponseSchema

    model_config = ConfigDict(from_attributes=True)


class ItemPedidoSaborResponseSchema(BaseModel):
    sabor_rel: SaboresResponseSchema

    model_config = ConfigDict(from_attributes=True)


class PrecoAdicionalItemResponseSchema(BaseModel):
    partes: int
    preco_adicional_rel: PrecoAdicionalResponseSchema

    model_config = ConfigDict(from_attributes=True)


class ItemSimplesResponseSchema(BaseModel):
    id: int
    tipo: str
    nome: str
    categoria_id: Optional[int] = None
    grade_id: Optional[int] = None
    preco: float
    descricao: Optional[str] = None
    ativo: bool
    imagem_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ItemPedidoIngredienteResponseSchema(BaseModel):
    quantidade: int
    item_simples_rel: ItemSimplesResponseSchema

    model_config = ConfigDict(from_attributes=True)


class ItemPedidoBebidaResponseSchema(BaseModel):
    quantidade: int
    item_simples_rel: ItemSimplesResponseSchema

    model_config = ConfigDict(from_attributes=True)


class ItemPedidoSchema(BaseModel):
    id: int
    quantidade: int = Field(ge=1)
    observacoes: Optional[str] = None
    tamanho_rel: TamanhoResponseSchema
    sabores_rel: List[ItemPedidoSaborResponseSchema]
    adicionais_rel: List[PrecoAdicionalItemResponseSchema]
    ingredientes_rel: List[ItemPedidoIngredienteResponseSchema] = []

    model_config = ConfigDict(from_attributes=True)

class PrecoAdicionalSchema(BaseModel):
    adicional_id: int
    tamanho_id: int
    preco: float

    model_config = ConfigDict(from_attributes=True)


class SaboresVisualizacaoSchema(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    ativo: bool
    imagem_url: Optional[str] = None
    preco_float: List[PrecoPizzaResponseSchema]
    disponivel_cardapio_normal: bool
    disponivel_monte_sua_pizza: bool
    permite_borda: bool
    permite_ingrediente: bool

    model_config = ConfigDict(from_attributes=True)

class EnderecoEntregaBaseSchema(BaseModel):
    rua: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    cidade: str
    estado: str
    cep: str

    model_config = ConfigDict(from_attributes=True)


class EnderecoEntregaCreateSchema(EnderecoEntregaBaseSchema):
    pass


class EnderecoEntregaResponseSchema(EnderecoEntregaBaseSchema):
    id: int

    model_config = ConfigDict(from_attributes=True)


class FormaPagamentoCreateSchema(BaseModel):
    tipo: Literal['CREDITO', 'DEBITO', 'VALE_ALIMENTACAO', 'VALE_REFEICAO']
    bandeira: Optional[str] = None
    nome_impresso: str
    # Número completo recebido do front, mas só os 4 últimos dígitos são persistidos (ver FormaPagamento no models.py)
    numero: str = Field(min_length=4)
    validade: Optional[str] = None
    padrao: bool = False

    model_config = ConfigDict(from_attributes=True)


class FormaPagamentoResponseSchema(BaseModel):
    id: int
    tipo: str
    bandeira: Optional[str] = None
    nome_impresso: str
    final_numero: str
    validade: Optional[str] = None
    padrao: bool
    ativo: bool

    model_config = ConfigDict(from_attributes=True)


class ResponsePedidoSchema(BaseModel):
    id: int
    preco: Optional[float] = None
    status: str
    created_at: datetime
    formato_de_pagamento: Optional[str] = None
    endereco_rel: Optional[EnderecoEntregaResponseSchema] = None
    itens: List[ItemPedidoSchema]
    bebidas_rel: List[ItemPedidoBebidaResponseSchema] = []
 
    @field_serializer('created_at')
    def serializar_created_at(self, dt: datetime) -> str:
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
 
    model_config = ConfigDict(from_attributes=True)


class GradeSchema(BaseModel):
    id: int
    nome: str
    posicao: int

    model_config = ConfigDict(from_attributes=True)


class GradeSaboresSchema(BaseModel):
    id_grade: int
    id_sabores: int

    model_config = ConfigDict(from_attributes=True)


class GradeCriarSchema(BaseModel):
    nome: str
    posicao: int

    model_config = ConfigDict(from_attributes=True)


class PrecoItemSchema(BaseModel):
    tamanho_id: int
    preco: float

    model_config = ConfigDict(from_attributes=True)


class NovoProdutoSchema(BaseModel):
    nome: str
    descricao: str
    ativo: bool
    grade_id: int
    categoria_id: int
    precos: List[PrecoItemSchema]
    imagem_url: Optional[str] = None
    disponivel_cardapio_normal: bool = True
    disponivel_monte_sua_pizza: bool = False
    permite_borda: bool = True
    permite_ingrediente: bool = True

    model_config = ConfigDict(from_attributes=True)


class CategoriaSchema(BaseModel):
    nome: str

    model_config = ConfigDict(from_attributes=True)

class ItemSimplesSchema(BaseModel):
    tipo: Literal['BEBIDA', 'INGREDIENTE']
    nome: str
    categoria_id: Optional[int] = None
    grade_id: Optional[int] = None
    preco: float
    descricao: Optional[str] = None
    ativo: bool = True
    imagem_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)



class ConfigMonteSuaPizzaSchema(BaseModel):
    quantidade_sabores: int
    tipo_divisao: str

    model_config = ConfigDict(from_attributes=True)


class ProdutoMonteSuaPizzaSchema(BaseModel):
    nome: str
    tamanho_id: int
    categoria_id: Optional[int] = None
    grade_id: Optional[int] = None
    imagem_url: Optional[str] = None
    descricao: Optional[str] = None
    ativo: bool = True
    qtd_sabores_override: Optional[int] = Field(default=None, ge=1)
    permite_borda: bool = True
    permite_ingrediente: bool = True

    model_config = ConfigDict(from_attributes=True)


class MonteSuaPizzaSaborItemSchema(BaseModel):
    id: int
    nome: str
    preco: Optional[float] = None  # preço vivo naquele tamanho (None se não cadastrado)

    model_config = ConfigDict(from_attributes=True)


class MonteSuaPizzaSaborSchema(BaseModel):
    sabor_ids: List[int] = Field(min_length=1)

    model_config = ConfigDict(from_attributes=True)


class ProdutoMonteSuaPizzaResponseSchema(BaseModel):
    id: int
    nome: str
    tamanho_id: int
    tamanho_nome: str
    categoria_id: Optional[int] = None
    grade_id: Optional[int] = None
    imagem_url: Optional[str] = None
    descricao: Optional[str] = None
    ativo: bool
    qtd_sabores_override: Optional[int] = None
    qtd_sabores_efetiva: int
    permite_borda: bool
    permite_ingrediente: bool
    sabores: List[MonteSuaPizzaSaborItemSchema] = []

    model_config = ConfigDict(from_attributes=True)