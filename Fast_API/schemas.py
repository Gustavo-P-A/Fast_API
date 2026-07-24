from datetime import datetime
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict, Field, field_serializer
from typing import Optional, List, Literal


class UsuarioSchema(BaseModel):
    nome: str
    email: str
    senha: str

    model_config = ConfigDict(from_attributes=True)

class LoginSchema(BaseModel):
    email: str
    senha: str

    model_config = ConfigDict(from_attributes=True)


class TamanhosSchema(BaseModel):
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


class ResponsePedidoSchema(BaseModel):
    id: int
    preco: Optional[float] = None
    status: str
    created_at: datetime
    formato_de_pagamento: Optional[str] = None
    endereco_rel: Optional[EnderecoEntregaResponseSchema] = None
    itens: List[ItemPedidoSchema]
 
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