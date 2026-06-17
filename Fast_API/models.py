from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import declarative_base, relationship
from enum import Enum
from datetime import datetime, timezone

#conexao do banco de dados
db = create_engine(
    'sqlite:///banco.db',
    connect_args={"check_same_thread": False}
)
#criação do db
Base = declarative_base()

#criação das classes
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, autoincrement=True ,primary_key=True)
    nome = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    senha = Column(String, nullable=False) 
    ativo = Column(Boolean, default=True)
    adm = Column(Boolean, default=True)

    pedidos = relationship('Pedidos', back_populates='usuario_rel')
    endereco_rel = relationship('EnderecoEntrega')
 

class Sabores(Base):
    __tablename__ = 'sabores'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    descricao = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    categoria_id = Column(Integer, ForeignKey('categoria.id'))
    imagem_url = Column(String, nullable=True)

    preco_float = relationship('PrecoPizza', back_populates='sabor_rel')

class Tamanhos(Base):
    __tablename__ = 'tamanhos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    qtd_sabores = Column(Integer, nullable=False)
    qtd_bordas = Column(Integer, nullable=False)

    preco_float = relationship('PrecoPizza', back_populates='tamanho_rel')
    preco_adicional = relationship('PrecoAdicional', back_populates='tamanho_rel')

class PrecoPizza(Base):
    __tablename__ = 'preco_pizza'

    id = Column(Integer, primary_key=True, autoincrement=True)
    sabor_id = Column(Integer, ForeignKey('sabores.id'),nullable=False)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'),nullable=False)
    preco = Column(Float, nullable=False)

    sabor_rel = relationship('Sabores', back_populates='preco_float')
    tamanho_rel = relationship('Tamanhos', back_populates='preco_float')

class Adicionais(Base):
    __tablename__ = 'adicionais'

    id = Column(Integer, autoincrement=True, primary_key=True)
    nome = Column(String, nullable=False)

    preco_adicional = relationship('PrecoAdicional', back_populates='adicional_rel')

class ItemPedidoAdicionais(Base):
    __tablename__ = 'item_adicionais'

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_pedido_id = Column(Integer, ForeignKey('itens_pedido.id'))
    preco_adicional_id = Column(Integer, ForeignKey('preco_adicional.id'))


class PrecoAdicional(Base):
    __tablename__ = 'preco_adicional'

    id = Column(Integer, autoincrement=True, primary_key=True)
    adicional_id = Column(Integer, ForeignKey('adicionais.id'), nullable=False)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'), nullable=False)
    preco = Column(Float, nullable=False)
    
    adicional_rel = relationship('Adicionais', back_populates='preco_adicional')
    tamanho_rel = relationship('Tamanhos', back_populates='preco_adicional')

class ItemPedido(Base):
    __tablename__ = 'itens_pedido'

    id = Column(Integer, primary_key=True, autoincrement=True)
    quantidade = Column(Integer, nullable=False, default=1)
    precopizza_id = Column(Integer, ForeignKey('preco_pizza.id'),nullable=False)
    pedido_id = Column(Integer,ForeignKey('pedidos.id'),nullable=False)
    observacoes = Column(String)
    
    pedido_rel = relationship('Pedidos', back_populates='itens')
    adicionais_rel = relationship('PrecoAdicional', secondary='item_adicionais')
    precopizza_rel = relationship('PrecoPizza')


    def soma_add(self):
        soma_adds = sum(e.preco for e in self.adicionais_rel)
        return soma_adds
    

class Grade(Base):
    __tablename__ = 'grade'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    posicao = Column(Integer, nullable=False)

    grade_sabor_rel = relationship('GradeSabores')

class GradeSabores(Base):
    __tablename__ ='grade_sabores'

    id = Column(Integer, autoincrement=True, primary_key=True)
    grade_id = Column (Integer, ForeignKey('grade.id'), nullable=False)
    sabores_id = Column(Integer, ForeignKey('sabores.id'), nullable=False)


class Categoria(Base):
    __tablename__ = 'categoria'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)


class EnderecoEntrega(Base):
    __tablename__ = 'enderecos_entrega'

    id = Column(Integer, primary_key=True, autoincrement=True)
    rua = Column(String, nullable=False)
    numero = Column(String, nullable=False)
    complemento = Column(String)
    bairro = Column(String, nullable=False)
    cidade = Column(String, nullable=False)
    estado = Column(String, nullable=False)
    cep = Column(String, nullable=False)
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)


class TipoPagamento(Enum):
    PIX = 'Pix'
    CARTAO_DE_CREDITO = 'Cartão de crédito'
    CARTAO_DE_DEBITO = 'Cartão de débito'
    DINHEIRO = 'Dinheiro'

class Pedidos(Base):
    __tablename__ = 'pedidos'

    id = Column(Integer, primary_key=True, autoincrement=True)
    status = Column(String, default='PENDENTE')
    usuario_id = Column(Integer, ForeignKey('usuarios.id'), nullable=False)
    preco = Column(Float)
    endereco_id = Column(Integer, ForeignKey('enderecos_entrega.id'), nullable=True)
    formato_de_pagamento = Column(SQLEnum(TipoPagamento))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    itens = relationship('ItemPedido', back_populates='pedido_rel', cascade='all, delete')
    usuario_rel = relationship('Usuario', back_populates='pedidos')

    def calcular_preco(self):
        self.preco = sum((i.precopizza_rel.preco + i.soma_add()) * i.quantidade for i in self.itens)

Base.metadata.create_all(db)
  