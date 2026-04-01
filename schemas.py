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

    class Config:
        from_attributes =True

class AdicionaisSchema(BaseModel):
    nome: str
    preco: float

    class Config:
        from_attributes =True

class PrecoPizzaSchema(BaseModel):
    sabor_id: int
    tamanho_id: int
    preco: float

    class Config:
        from_attributes =True

class SaboresResponseSchema(BaseModel):
    nome: str

    class Config:
        from_attributes = True

class AdicionaisResponseSchema(BaseModel):
    nome: str
    preco: float

    class Config:
        from_attributes =True

class TamanhoResponseSchema(BaseModel):
    nome: str

    class Config:
        from_attributes = True


class PrecoPizzaResponseSchema(BaseModel):
    preco: float
    sabor_rel: SaboresResponseSchema
    tamanho_rel: TamanhoResponseSchema
    
    class Config:
        from_attributes = True    

class ItemPedidoSchema(BaseModel):
    quantidade:int = Field(ge=1)
    observacoes: Optional[str] = None
    precopizza_rel: PrecoPizzaResponseSchema
    adicionais_rel: List[AdicionaisResponseSchema]

    class Config:
        from_attributes = True

class ResponsePedidoSchema(BaseModel):
    preco: Optional[float] = None
    status: str
    itens: List[ItemPedidoSchema]

    class Config:
        from_attributes = True

class SaboresVisualizacaoSchema(BaseModel):
    nome: str
    descricao: str
    preco_float: List[PrecoPizzaResponseSchema]

    class Config:
        from_attributes = True

class EnderecoEntregaSchema(BaseModel):
    rua: str
    numero: str
    complemento: Optional[str] = None
    bairro: str
    cidade: str
    estado: str
    cep: str
    
    class Config:
        from_attributes = True