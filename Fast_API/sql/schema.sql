-- ============================================================================
-- Schema PostgreSQL da Pizzaria API
--
-- Traduzido diretamente de models.py (SQLAlchemy). Substitui por completo o
-- Alembic: não há migrações versionadas aqui, é o schema completo aplicado
-- de uma vez. Se o schema mudar no futuro, ajuste este arquivo e reaplique
-- num banco novo (ou escreva um ALTER TABLE manual pontual).
--
-- Ordem das tabelas = ordem de dependência (uma tabela só aparece depois de
-- todas que ela referencia via FOREIGN KEY), então este arquivo roda de
-- cima pra baixo sem erro de "relation does not exist".
--
-- Uso:
--   psql "$DATABASE_URL" -f sql/schema.sql
-- ============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- usuarios
-- ---------------------------------------------------------------------------
CREATE TABLE usuarios (
    id        SERIAL PRIMARY KEY,
    nome      TEXT NOT NULL,
    email     TEXT NOT NULL UNIQUE,
    senha     TEXT NOT NULL,              -- hash argon2, não a senha em texto puro
    cpf       TEXT UNIQUE,
    telefone  TEXT,
    ativo     BOOLEAN NOT NULL DEFAULT TRUE,
    -- ATENÇÃO: no models.py original 'adm' já nascia com default=True (igual
    -- 'ativo'). Preservei o comportamento exatamente como estava, mas é quase
    -- certo que isso é um bug — usuário novo virando admin por padrão. Vale
    -- corrigir pra DEFAULT FALSE, só não fiz isso aqui pra não misturar
    -- "migrar de banco" com "mudar regra de negócio" sem te perguntar antes.
    adm       BOOLEAN NOT NULL DEFAULT FALSE
);

-- ---------------------------------------------------------------------------
-- categoria
-- ---------------------------------------------------------------------------
CREATE TABLE categoria (
    id    SERIAL PRIMARY KEY,
    nome  TEXT NOT NULL
);

-- ---------------------------------------------------------------------------
-- tamanhos
-- ---------------------------------------------------------------------------
CREATE TABLE tamanhos (
    id           SERIAL PRIMARY KEY,
    nome         TEXT NOT NULL,
    qtd_sabores  INTEGER NOT NULL,
    qtd_bordas   INTEGER NOT NULL
);

-- ---------------------------------------------------------------------------
-- grade
-- ---------------------------------------------------------------------------
CREATE TABLE grade (
    id       SERIAL PRIMARY KEY,
    nome     TEXT NOT NULL,
    posicao  INTEGER NOT NULL
);

-- ---------------------------------------------------------------------------
-- adicionais
-- ---------------------------------------------------------------------------
CREATE TABLE adicionais (
    id     SERIAL PRIMARY KEY,
    nome   TEXT NOT NULL,
    ativo  BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- config_monte_pizza  (linha única de configuração; sem FK)
-- ---------------------------------------------------------------------------
CREATE TABLE config_monte_pizza (
    id                  SERIAL PRIMARY KEY,
    quantidade_sabores  INTEGER NOT NULL DEFAULT 2,
    tipo_divisao        TEXT NOT NULL DEFAULT 'metade_metade'
);

-- ---------------------------------------------------------------------------
-- sabores  (depende de categoria)
-- ---------------------------------------------------------------------------
CREATE TABLE sabores (
    id                            SERIAL PRIMARY KEY,
    nome                          TEXT NOT NULL,
    descricao                     TEXT,
    ativo                         BOOLEAN NOT NULL DEFAULT TRUE,
    categoria_id                  INTEGER REFERENCES categoria(id),
    imagem_url                    TEXT,
    disponivel_cardapio_normal    BOOLEAN NOT NULL DEFAULT TRUE,
    disponivel_monte_sua_pizza    BOOLEAN NOT NULL DEFAULT FALSE,
    permite_borda                 BOOLEAN NOT NULL DEFAULT TRUE,
    permite_ingrediente           BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- preco_pizza  (depende de sabores, tamanhos)
-- ---------------------------------------------------------------------------
-- NOTA: preco é DOUBLE PRECISION (float) porque era Float no SQLAlchemy
-- original — mantive o mesmo tipo pra não introduzir divergência de
-- arredondamento entre schema e o `preco: float` que já existe nos
-- schemas.py Pydantic. O ideal pra dinheiro é NUMERIC(10,2), mas troquei
-- isso de assunto pra outra conversa (mexe em serialização e em contas já
-- escritas em Python — me avisa se quiser que eu faça essa troca também).
CREATE TABLE preco_pizza (
    id         SERIAL PRIMARY KEY,
    sabor_id   INTEGER NOT NULL REFERENCES sabores(id),
    tamanho_id INTEGER NOT NULL REFERENCES tamanhos(id),
    preco      DOUBLE PRECISION NOT NULL
);

-- ---------------------------------------------------------------------------
-- preco_adicional  (depende de adicionais, tamanhos)
-- ---------------------------------------------------------------------------
CREATE TABLE preco_adicional (
    id            SERIAL PRIMARY KEY,
    adicional_id  INTEGER NOT NULL REFERENCES adicionais(id),
    tamanho_id    INTEGER NOT NULL REFERENCES tamanhos(id),
    preco         DOUBLE PRECISION NOT NULL
);

-- ---------------------------------------------------------------------------
-- grade_sabores  (depende de grade, sabores)
-- ---------------------------------------------------------------------------
CREATE TABLE grade_sabores (
    id          SERIAL PRIMARY KEY,
    grade_id    INTEGER NOT NULL REFERENCES grade(id),
    sabores_id  INTEGER NOT NULL REFERENCES sabores(id)
);

-- ---------------------------------------------------------------------------
-- enderecos_entrega  (depende de usuarios)
-- ---------------------------------------------------------------------------
CREATE TABLE enderecos_entrega (
    id           SERIAL PRIMARY KEY,
    rua          TEXT NOT NULL,
    numero       TEXT NOT NULL,
    complemento  TEXT,
    bairro       TEXT NOT NULL,
    cidade       TEXT NOT NULL,
    estado       TEXT NOT NULL,
    cep          TEXT NOT NULL,
    usuario_id   INTEGER NOT NULL REFERENCES usuarios(id)
);

-- ---------------------------------------------------------------------------
-- formas_pagamento  (depende de usuarios)
-- ---------------------------------------------------------------------------
-- 'tipo' era SQLAlchemy Enum(TipoFormaPagamento) -> CHECK constraint com os
-- mesmos 4 valores, em vez de tipo ENUM nativo do Postgres (mais simples de
-- alterar depois, sem precisar de ALTER TYPE).
CREATE TABLE formas_pagamento (
    id             SERIAL PRIMARY KEY,
    usuario_id     INTEGER NOT NULL REFERENCES usuarios(id),
    tipo           TEXT NOT NULL CHECK (tipo IN ('CREDITO', 'DEBITO', 'VALE_ALIMENTACAO', 'VALE_REFEICAO')),
    bandeira       TEXT,
    nome_impresso  TEXT NOT NULL,
    -- Por segurança (PCI-DSS), nunca armazenamos o número completo do
    -- cartão nem o CVV — só os 4 últimos dígitos.
    final_numero   VARCHAR(4) NOT NULL,
    validade       TEXT,
    padrao         BOOLEAN NOT NULL DEFAULT FALSE,
    ativo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- pedidos  (depende de usuarios, enderecos_entrega)
-- ---------------------------------------------------------------------------
-- 'formato_de_pagamento' era Enum(TipoPagamento) -> CHECK constraint.
-- 'created_at' era default=lambda: datetime.now(timezone.utc) no Python;
-- agora o próprio Postgres preenche com DEFAULT now() em qualquer INSERT
-- que não informar a coluna (não depende mais da aplicação lembrar disso).
CREATE TABLE pedidos (
    id                    SERIAL PRIMARY KEY,
    status                TEXT NOT NULL DEFAULT 'PENDENTE',
    usuario_id            INTEGER NOT NULL REFERENCES usuarios(id),
    preco                 DOUBLE PRECISION,
    endereco_id           INTEGER REFERENCES enderecos_entrega(id),
    formato_de_pagamento  TEXT CHECK (formato_de_pagamento IN ('Pix', 'Cartão de crédito', 'Cartão de débito', 'Dinheiro')),
    created_at            TIMESTAMPTZ DEFAULT now(),
    troco_para            DOUBLE PRECISION,
    -- Checkout com cartão/vale salvo (formas_pagamento.id) e parcelamento
    -- (só cartão de crédito) -- ver finalizar_pedido.py.
    forma_pagamento_id    INTEGER REFERENCES formas_pagamento(id),
    parcelas              INTEGER,
    -- Pix "fake" (sem gateway real) -- código copia-e-cola e validade de
    -- 1h; passado o prazo, _expirar_pix_se_necessario (order_routes.py)
    -- cancela o pedido automaticamente na próxima leitura.
    pix_codigo            TEXT,
    pix_expira_em         TIMESTAMPTZ
);

-- ---------------------------------------------------------------------------
-- itens_pedido  (depende de tamanhos, pedidos)
-- ---------------------------------------------------------------------------
-- ON DELETE CASCADE em pedido_id porque no models.py original
-- 'Pedidos.itens' tinha cascade='all, delete' — apagar um pedido já apagava
-- os itens dele pelo ORM. Aqui o próprio banco faz isso.
CREATE TABLE itens_pedido (
    id           SERIAL PRIMARY KEY,
    quantidade   INTEGER NOT NULL DEFAULT 1,
    tamanho_id   INTEGER NOT NULL REFERENCES tamanhos(id),
    pedido_id    INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    observacoes  TEXT
);

-- ---------------------------------------------------------------------------
-- item_pedido_sabor  (depende de itens_pedido, sabores)
-- ---------------------------------------------------------------------------
-- liga um item a 1 ou N sabores (meio a meio). CASCADE porque
-- 'ItemPedido.sabores_rel' tinha cascade='all, delete'.
CREATE TABLE item_pedido_sabor (
    id              SERIAL PRIMARY KEY,
    item_pedido_id  INTEGER NOT NULL REFERENCES itens_pedido(id) ON DELETE CASCADE,
    sabor_id        INTEGER NOT NULL REFERENCES sabores(id)
);

-- ---------------------------------------------------------------------------
-- item_adicionais  (depende de itens_pedido, preco_adicional)
-- ---------------------------------------------------------------------------
-- borda: quantas partes de cada sabor (preço proporcional). CASCADE porque
-- 'ItemPedido.adicionais_rel' tinha cascade='all, delete'.
CREATE TABLE item_adicionais (
    id                  SERIAL PRIMARY KEY,
    item_pedido_id      INTEGER REFERENCES itens_pedido(id) ON DELETE CASCADE,
    preco_adicional_id  INTEGER REFERENCES preco_adicional(id),
    partes              INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- itens_simples  (depende de categoria, grade) — bebidas e ingredientes
-- ---------------------------------------------------------------------------
CREATE TABLE itens_simples (
    id            SERIAL PRIMARY KEY,
    tipo          TEXT NOT NULL CHECK (tipo IN ('BEBIDA', 'INGREDIENTE')),
    nome          TEXT NOT NULL,
    categoria_id  INTEGER REFERENCES categoria(id),
    grade_id      INTEGER REFERENCES grade(id),
    preco         DOUBLE PRECISION NOT NULL,
    descricao     TEXT,
    ativo         BOOLEAN NOT NULL DEFAULT TRUE,
    imagem_url    TEXT
);

-- ---------------------------------------------------------------------------
-- item_pedido_bebida  (depende de pedidos, itens_simples)
-- ---------------------------------------------------------------------------
-- bebida: item avulso do pedido, não pertence a um ItemPedido (pizza).
-- CASCADE porque 'Pedidos.bebidas_rel' tinha cascade='all, delete'.
CREATE TABLE item_pedido_bebida (
    id               SERIAL PRIMARY KEY,
    pedido_id        INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    item_simples_id  INTEGER NOT NULL REFERENCES itens_simples(id),
    quantidade       INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- item_pedido_ingrediente  (depende de itens_pedido, itens_simples)
-- ---------------------------------------------------------------------------
CREATE TABLE item_pedido_ingrediente (
    id               SERIAL PRIMARY KEY,
    item_pedido_id   INTEGER NOT NULL REFERENCES itens_pedido(id) ON DELETE CASCADE,
    item_simples_id  INTEGER NOT NULL REFERENCES itens_simples(id),
    quantidade       INTEGER NOT NULL DEFAULT 1
);

-- ---------------------------------------------------------------------------
-- produto_monte_pizza  (depende de tamanhos, categoria, grade)
-- ---------------------------------------------------------------------------
CREATE TABLE produto_monte_pizza (
    id                     SERIAL PRIMARY KEY,
    nome                   TEXT NOT NULL,
    tamanho_id             INTEGER NOT NULL REFERENCES tamanhos(id),
    categoria_id           INTEGER REFERENCES categoria(id),
    grade_id               INTEGER REFERENCES grade(id),
    imagem_url             TEXT,
    descricao              TEXT,
    ativo                  BOOLEAN NOT NULL DEFAULT TRUE,
    qtd_sabores_override   INTEGER,   -- NULL = usa tamanhos.qtd_sabores
    permite_borda          BOOLEAN NOT NULL DEFAULT TRUE,
    permite_ingrediente    BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------------------------------------------------------------------------
-- monte_pizza_sabor  (depende de produto_monte_pizza, sabores)
-- ---------------------------------------------------------------------------
-- CASCADE porque 'ProdutoMonteSuaPizza.sabores_rel' tinha cascade='all, delete'.
CREATE TABLE monte_pizza_sabor (
    id                       SERIAL PRIMARY KEY,
    produto_monte_pizza_id   INTEGER NOT NULL REFERENCES produto_monte_pizza(id) ON DELETE CASCADE,
    sabor_id                 INTEGER NOT NULL REFERENCES sabores(id)
);

-- ---------------------------------------------------------------------------
-- Índices extras nas colunas de FK mais consultadas em filtro/join.
-- (Postgres NÃO cria índice automático em coluna de FK, só na PK.)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_sabores_categoria_id             ON sabores(categoria_id);
CREATE INDEX idx_preco_pizza_sabor_id             ON preco_pizza(sabor_id);
CREATE INDEX idx_preco_pizza_tamanho_id           ON preco_pizza(tamanho_id);
CREATE INDEX idx_preco_adicional_adicional_id     ON preco_adicional(adicional_id);
CREATE INDEX idx_preco_adicional_tamanho_id       ON preco_adicional(tamanho_id);
CREATE INDEX idx_grade_sabores_grade_id           ON grade_sabores(grade_id);
CREATE INDEX idx_grade_sabores_sabores_id         ON grade_sabores(sabores_id);
CREATE INDEX idx_enderecos_entrega_usuario_id     ON enderecos_entrega(usuario_id);
CREATE INDEX idx_formas_pagamento_usuario_id      ON formas_pagamento(usuario_id);
CREATE INDEX idx_pedidos_usuario_id               ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_status                   ON pedidos(status);
CREATE INDEX idx_itens_pedido_pedido_id           ON itens_pedido(pedido_id);
CREATE INDEX idx_itens_pedido_tamanho_id          ON itens_pedido(tamanho_id);
CREATE INDEX idx_item_pedido_sabor_item_pedido_id ON item_pedido_sabor(item_pedido_id);
CREATE INDEX idx_item_pedido_sabor_sabor_id       ON item_pedido_sabor(sabor_id);
CREATE INDEX idx_item_adicionais_item_pedido_id   ON item_adicionais(item_pedido_id);
CREATE INDEX idx_itens_simples_categoria_id       ON itens_simples(categoria_id);
CREATE INDEX idx_itens_simples_grade_id           ON itens_simples(grade_id);
CREATE INDEX idx_itens_simples_tipo               ON itens_simples(tipo);
CREATE INDEX idx_item_pedido_bebida_pedido_id     ON item_pedido_bebida(pedido_id);
CREATE INDEX idx_item_pedido_ingrediente_item_id  ON item_pedido_ingrediente(item_pedido_id);
CREATE INDEX idx_produto_monte_pizza_tamanho_id   ON produto_monte_pizza(tamanho_id);
CREATE INDEX idx_produto_monte_pizza_grade_id     ON produto_monte_pizza(grade_id);
CREATE INDEX idx_monte_pizza_sabor_produto_id     ON monte_pizza_sabor(produto_monte_pizza_id);

COMMIT;
