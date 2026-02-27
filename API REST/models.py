from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy_utils import ChoiceType

#conexao do banco de dados
db = create_engine('sqlite:///banco.db')

#criação do db
Base = declarative_base()

#criação das classes
class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column('id', Integer, autoincrement=True ,primary_key=True)
    nome = Column('nome', String, nullable=False)
    email = Column('email', String, nullable=False, unique=True)
    senha = Column('senha', String, nullable=False)
    ativo = Column('ativo', Boolean)
    adm = Column("adm", Boolean, default=False)

    def __init__(self,nome, email, senha, ativo=True, adm=False):
        self.nome = nome
        self.email = email
        self.senha = senha
        self.ativo = ativo
        self.adm = adm

class Pedidos(Base):
    __tablename__ = 'pedidos'

    id = Column('id', Integer, primary_key=True, autoincrement=True)
    status = Column("status", String)
    usuario = Column('usuario', ForeignKey('usuarios.id'))
    preco = Column('preco', Float)
    itens = relationship('ItemPedido', cascade='all, delete')

    def __init__(self,usuario, status='PENDENTE', preco=0):
        self.status = status
        self.preco = preco
        self.usuario = usuario

    def calcular_preco(self):
        self.preco = sum(item.preco * item.quantidade for item in self.itens)

class ItemPedido(Base):
    __tablename__ = 'itens_pedido'

    id = Column("id", Integer, primary_key=True, autoincrement=True)
    quantidade = Column('quantidade', Integer)
    sabor = Column('sabor', String)
    tamanho = Column('tamanho', String)
    preco = Column('preco', Float)
    pedido = Column('pedido', ForeignKey('pedidos.id'))

    def __init__(self, quantidade, sabor, tamanho, preco, pedido):
        self.quantidade = quantidade
        self.sabor = sabor
        self.pedido = pedido
        self.tamanho = tamanho
        self.preco = preco

class HistoricoPedidos(Base):
    __tablename__ = 'historico_pedidos'

    id = Column('id', Integer, primary_key=True, autoincrement=True)
    pedido = Column('pedido', ForeignKey('pedidos.id'))
    usuario = Column('usuario', ForeignKey('usuarios.id'))
    status = Column('status', String(50))
    preco = Column('preco', Float)

    def __init__(self, pedido, usuario, status, preco):
        self.pedido = pedido
        self.usuario = usuario
        self.status = status
        self.preco = preco
