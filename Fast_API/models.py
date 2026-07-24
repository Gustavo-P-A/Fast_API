from sqlalchemy import create_engine, Column, String, Integer, Float, Boolean, ForeignKey, Enum as SQLEnum, DateTime
from sqlalchemy.orm import declarative_base, relationship
from enum import Enum
from datetime import datetime, timezone

db = create_engine(
    'sqlite:///banco.db',
    connect_args={"check_same_thread": False}
)
Base = declarative_base()


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, autoincrement=True, primary_key=True)
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
    disponivel_cardapio_normal = Column(Boolean, default=True)
    disponivel_monte_sua_pizza = Column(Boolean, default=False)
    permite_borda = Column(Boolean, default=True)
    permite_ingrediente = Column(Boolean, default=True)

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
    sabor_id = Column(Integer, ForeignKey('sabores.id'), nullable=False)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'), nullable=False)
    preco = Column(Float, nullable=False)

    sabor_rel = relationship('Sabores', back_populates='preco_float')
    tamanho_rel = relationship('Tamanhos', back_populates='preco_float')


class Adicionais(Base):
    __tablename__ = 'adicionais'

    id = Column(Integer, autoincrement=True, primary_key=True)
    nome = Column(String, nullable=False)
    ativo = Column(Boolean, default=True)

    preco_adicional = relationship('PrecoAdicional', back_populates='adicional_rel')


class PrecoAdicional(Base):
    __tablename__ = 'preco_adicional'

    id = Column(Integer, autoincrement=True, primary_key=True)
    adicional_id = Column(Integer, ForeignKey('adicionais.id'), nullable=False)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'), nullable=False)
    preco = Column(Float, nullable=False)

    adicional_rel = relationship('Adicionais', back_populates='preco_adicional')
    tamanho_rel = relationship('Tamanhos', back_populates='preco_adicional')


# ── liga um item a 1 ou N sabores (meio a meio) ──
class ItemPedidoSabor(Base):
    __tablename__ = 'item_pedido_sabor'

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_pedido_id = Column(Integer, ForeignKey('itens_pedido.id'), nullable=False)
    sabor_id = Column(Integer, ForeignKey('sabores.id'), nullable=False)

    item_pedido_rel = relationship('ItemPedido', back_populates='sabores_rel')
    sabor_rel = relationship('Sabores')


# ── borda: quantas partes de cada sabor (preço proporcional) ──
class ItemPedidoAdicionais(Base):
    __tablename__ = 'item_adicionais'

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_pedido_id = Column(Integer, ForeignKey('itens_pedido.id'))
    preco_adicional_id = Column(Integer, ForeignKey('preco_adicional.id'))
    partes = Column(Integer, nullable=False, default=1)

    item_pedido_rel = relationship('ItemPedido', back_populates='adicionais_rel')
    preco_adicional_rel = relationship('PrecoAdicional')


class ItemPedido(Base):
    __tablename__ = 'itens_pedido'

    id = Column(Integer, primary_key=True, autoincrement=True)
    quantidade = Column(Integer, nullable=False, default=1)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'), nullable=False)
    pedido_id = Column(Integer, ForeignKey('pedidos.id'), nullable=False)
    observacoes = Column(String)

    pedido_rel = relationship('Pedidos', back_populates='itens')
    sabores_rel = relationship('ItemPedidoSabor', back_populates='item_pedido_rel', cascade='all, delete')
    adicionais_rel = relationship('ItemPedidoAdicionais', back_populates='item_pedido_rel', cascade='all, delete')
    ingredientes_rel = relationship('ItemPedidoIngrediente', back_populates='item_pedido_rel', cascade='all, delete')
    tamanho_rel = relationship('Tamanhos')

    def preco_base(self):
        precos = []
        for ips in self.sabores_rel:
            pp = next((p for p in ips.sabor_rel.preco_float if p.tamanho_id == self.tamanho_id), None)
            if pp:
                precos.append(pp.preco)
        return max(precos) if precos else 0

    def soma_add(self):
        if not self.adicionais_rel:
            return 0
        if len(self.adicionais_rel) == 1:
            return self.adicionais_rel[0].preco_adicional_rel.preco
        total_partes = self.tamanho_rel.qtd_bordas or 1
        return sum(
            ia.preco_adicional_rel.preco * (ia.partes / total_partes)
            for ia in self.adicionais_rel
        )
    
    def soma_ingredientes(self):
        return sum(
            ir.item_simples_rel.preco * ir.quantidade
            for ir in self.ingredientes_rel
        )

    def preco_total(self):
        return (self.preco_base() + self.soma_add() + self.soma_ingredientes()) * self.quantidade


class Grade(Base):
    __tablename__ = 'grade'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    posicao = Column(Integer, nullable=False)

    grade_sabor_rel = relationship('GradeSabores')


class GradeSabores(Base):
    __tablename__ = 'grade_sabores'

    id = Column(Integer, autoincrement=True, primary_key=True)
    grade_id = Column(Integer, ForeignKey('grade.id'), nullable=False)
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
    troco_para = Column(Float, nullable=True)  

    itens = relationship('ItemPedido', back_populates='pedido_rel', cascade='all, delete')
    usuario_rel = relationship('Usuario', back_populates='pedidos')

    def calcular_preco(self):
        self.preco = sum(i.preco_total() for i in self.itens)
    endereco_rel = relationship('EnderecoEntrega')

class TipoItemSimples(Enum):
    BEBIDA = 'BEBIDA'
    INGREDIENTE = 'INGREDIENTE'

class ItemSimples(Base):
    __tablename__ = 'itens_simples'

    id = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(SQLEnum(TipoItemSimples), nullable=False)
    nome = Column(String, nullable=False)
    categoria_id = Column(Integer, ForeignKey('categoria.id'), nullable=True)
    grade_id = Column(Integer, ForeignKey('grade.id'), nullable=True)
    preco = Column(Float, nullable=False)
    descricao = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)
    imagem_url = Column(String, nullable=True)

    categoria_rel = relationship('Categoria')
    grade_rel = relationship('Grade')

class ConfigMonteSuaPizza(Base):
    __tablename__ = 'config_monte_pizza'
    id = Column(Integer, primary_key=True, autoincrement=True)
    quantidade_sabores = Column(Integer, default=2)
    tipo_divisao = Column(String, default='metade_metade')

class ProdutoMonteSuaPizza(Base):
    __tablename__ = 'produto_monte_pizza'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nome = Column(String, nullable=False)
    tamanho_id = Column(Integer, ForeignKey('tamanhos.id'), nullable=False)
    categoria_id = Column(Integer, ForeignKey('categoria.id'), nullable=True)
    grade_id = Column(Integer, ForeignKey('grade.id'), nullable=True)
    imagem_url = Column(String, nullable=True)
    descricao = Column(String, nullable=True)
    ativo = Column(Boolean, default=True)

    tamanho_rel = relationship('Tamanhos')
    categoria_rel = relationship('Categoria')
    grade_rel = relationship('Grade')
    sabores_rel = relationship('MonteSuaPizzaSabor', back_populates='produto_rel', cascade='all, delete')


class MonteSuaPizzaSabor(Base):
    __tablename__ = 'monte_pizza_sabor'

    id = Column(Integer, primary_key=True, autoincrement=True)
    produto_monte_pizza_id = Column(Integer, ForeignKey('produto_monte_pizza.id'), nullable=False)
    sabor_id = Column(Integer, ForeignKey('sabores.id'), nullable=False)

    produto_rel = relationship('ProdutoMonteSuaPizza', back_populates='sabores_rel')
    sabor_rel = relationship('Sabores')
    
class ItemPedidoIngrediente(Base):
    __tablename__ = 'item_pedido_ingrediente'

    id = Column(Integer, primary_key=True, autoincrement=True)
    item_pedido_id = Column(Integer, ForeignKey('itens_pedido.id'), nullable=False)
    item_simples_id = Column(Integer, ForeignKey('itens_simples.id'), nullable=False)
    quantidade = Column(Integer, nullable=False, default=1)

    item_pedido_rel = relationship('ItemPedido', back_populates='ingredientes_rel')
    item_simples_rel = relationship('ItemSimples')

Base.metadata.create_all(db)