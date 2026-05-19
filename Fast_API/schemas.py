from pydantic import BaseModel, Field
from typing import Optional, List

class UsuarioSchema(BaseModel):
    nome: str
    email: str
    senha: str

    class Config:
        from_attributes = True

class PedidoSchema(BaseModel):
    id_usuario: int

    class Config:
        from_attributes = True 

class LoginSchema(BaseModel):
    email: str
    senha: str

    class Config:
        from_attributes = True

class SaboresSchema(BaseModel):
    nome: str
    descricao: Optional[str] = None

    class Config:
        from_attributes =True

class TamanhosSchema(BaseModel):
    nome: str
    qtd_sabores: int
    qtd_bordas: int

    class Config:
        from_attributes =True

class AdicionaisSchema(BaseModel):
    nome: str

    class Config:
        from_attributes =True

class PrecoPizzaSchema(BaseModel):
    sabor_id: int
    tamanho_id: int
    preco: float

    class Config:
        from_attributes =True

class SaboresResponseSchema(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None


    class Config:
        from_attributes = True

class AdicionaisResponseSchema(BaseModel):
    id: int
    nome: str

    class Config:
        from_attributes =True 

class TamanhoResponseSchema(BaseModel):
    id: int
    nome: str
    qtd_sabores: int
    qtd_bordas: int

    class Config:
        from_attributes = True

class ItemPedidoCriacaoSchema(BaseModel):
    quantidade: int = Field(ge=1)
    observacoes: Optional[str] = None

    class Config:
        from_attributes = True

class PrecoPizzaResponseSchema(BaseModel):
    id: int
    preco: float
    sabor_rel: SaboresResponseSchema
    tamanho_rel: TamanhoResponseSchema
    
    class Config:
        from_attributes = True    


class PrecoAdicionalResponseSchema(BaseModel):
    id: int
    preco: float
    adicional_rel: AdicionaisResponseSchema

    class Config:
        from_attributes = True


class ItemPedidoSchema(BaseModel):
    quantidade:int = Field(ge=1)
    observacoes: Optional[str] = None
    precopizza_rel: PrecoPizzaResponseSchema
    adicionais_rel: List[PrecoAdicionalResponseSchema]

    class Config:
        from_attributes = True

class ResponsePedidoSchema(BaseModel):
    preco: Optional[float] = None
    status: str
    itens: List[ItemPedidoSchema]
    

    class Config:
        from_attributes = True


class PrecoAdicionalSchema(BaseModel):
    adicional_id: int
    tamanho_id: int
    preco: float

    class Config:
        from_attributes = True

class SaboresVisualizacaoSchema(BaseModel):
    nome: str
    descricao: str
    preco_float: List[PrecoPizzaResponseSchema]

    class Config:
        from_attributes = True

class EnderecoEntregaBaseSchema(BaseModel):
    rua: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    cidade: str
    estado: str
    cep: str
    
    class Config:
        from_attributes = True


class EnderecoEntregaCreateSchema(EnderecoEntregaBaseSchema):
    pass


class EnderecoEntregaResponseSchema(EnderecoEntregaBaseSchema):
    id: int

    class Config:
        from_attributes = True


class GradeSchema(BaseModel):
    nome: str
    posicao: int

    class Config:
        from_attributes = True


class GradeSaboresSchema(BaseModel):
    id_grade: int
    id_sabores: int

    class Config:
        from_attributes = True

class NovoProdutoSchema(BaseModel):
    nome: str
    id_tamanho: int
    id_preco: int
    id_grade: int
    id_grade_sabores: int
    
    class Config:
        from_attributes = True