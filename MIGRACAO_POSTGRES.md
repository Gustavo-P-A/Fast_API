# Migração: SQLAlchemy + SQLite + Alembic → SQL puro + PostgreSQL

Resumo de tudo que mudou no backend e como rodar o projeto agora.

## Como rodar localmente

```bash
# 1. Sobe o Postgres (fica em localhost:5432, dados persistem no volume)
docker compose up -d

# 2. Cria o banco de dev (o schema já é aplicado sozinho pelo compose
#    na primeira vez que o volume é criado, via docker-entrypoint-initdb.d)

# 3. Instala as dependências
cd Fast_API
pip install -r requirements.txt

# 4. Copia o .env.example pra .env e ajusta se precisar (os valores
#    default já batem com o docker-compose.yml)
cp .env.example .env

# 5. Roda a API normalmente
uvicorn main:app --reload
```

### Banco de teste (pytest)

Os testes rodam contra um banco Postgres separado (`pizzaria_test`), nunca
contra o banco de dev. Crie-o uma vez:

```bash
docker compose exec db createdb -U pizzaria_app pizzaria_test
```

`tests/conftest.py` recria as tabelas do zero (a partir de `sql/schema.sql`)
uma vez por sessão de pytest, e isola cada teste com `ROLLBACK` -- não
precisa recriar nada entre testes individuais.

### Resetar o banco de dev do zero

```bash
docker compose down -v   # apaga o volume -- reaplica sql/schema.sql do zero
docker compose up -d
python seed_dados.py     # popular com dados de exemplo (continua funcionando sem mudanças)
```

## O que mudou, arquivo por arquivo

| Antes | Depois |
|---|---|
| `models.py` (engine + 18 classes ORM) | removido |
| `models.py` (3 enums puros) | `enums.py` |
| `dependencies.py` (`pegar_sessao`) | pasta em `database.py` (`pegar_conexao`) |
| `alembic/`, `alembic.ini` | removidos -- schema único em `sql/schema.sql` |
| `banco.db` (SQLite) | Postgres (`docker-compose.yml`) |
| métodos de preço em `models.py` (`calcular_preco`, `preco_total`...) | `calculos.py` |
| — | `database.py`: pool de conexões (`psycopg_pool`) + `fetch_one`/`fetch_all`/`execute` |

Todas as rotas (`*_routes.py`, `area_admin.py`, `core/security.py`,
`dependsadm.py`) foram reescritas para montar SQL parametrizado direto
(`fetch_one`/`fetch_all`/`execute` de `database.py`) em vez de usar o ORM.
`schemas.py` (Pydantic) não precisou mudar nada.

## Decisões técnicas

- **psycopg 3, síncrono.** Mais simples e mais parecido com o padrão que já
  existia (SQLAlchemy síncrono) do que ir pra `asyncpg`. Se um dia quiser
  migrar pra assíncrono de verdade, psycopg 3 já suporta os dois modos com a
  mesma API.
- **Pool de conexões** (`psycopg_pool.ConnectionPool`), aberto/fechado no
  `lifespan` do FastAPI (`main.py`). `pegar_conexao` empresta uma conexão
  por requisição.
- **`ConnCommitRoute` (`database.py`) faz o commit/rollback, não o
  cleanup do `yield`.** Descoberto rodando a API de verdade (não só os
  testes com `TestClient`) sob carga: nesta versão do FastAPI, o código
  depois do `yield` numa dependência roda *depois* da resposta HTTP já
  ter sido enviada. Se o commit dependesse só disso, existe uma janela de
  corrida real -- o cliente recebe "200 OK" e já manda a próxima
  requisição antes do commit anterior terminar, então uma leitura logo
  em seguida podia não ver o que acabou de ser escrito (intermitente,
  difícil de notar, mais difícil ainda de debugar depois). Todo router
  usa `route_class=ConnCommitRoute`, que commita (ou desfaz, se o status
  for >= 400 ou a rota estourar exceção) assim que a função da rota
  termina, antes da resposta ser enviada. Testado com 80 repetições de
  "criar -> listar imediatamente" sem nenhuma divergência.
- **`ON DELETE CASCADE`** no schema em todo FK onde o `models.py` original
  tinha `cascade='all, delete'` no relationship (itens de pedido, sabores
  de monte-sua-pizza etc.). Onde o original não tinha cascade nenhum,
  o schema novo também não tem.

## Comportamentos que mudaram (ou ficaram expostos) com o Postgres

1. **Foreign keys agora são validadas de verdade.** O SQLite nunca teve
   `PRAGMA foreign_keys=ON` ligado, então FKs "quebradas" (linha referenciando
   um id que não existe mais) nunca davam erro -- só ficavam órfãs
   silenciosamente. No Postgres isso passa a ser validado. Na prática:
   - Excluir um **sabor** já usado em algum pedido ou vinculado a um
     Monte Sua Pizza agora devolve **409** com uma mensagem clara, em vez de
     travar com erro 500 cru (ou, no SQLite, "funcionar" e deixar lixo
     órfão no banco).
   - O mesmo foi adicionado para excluir um **item simples** (bebida/ingrediente)
     e um **tamanho**.
   - `deletar_grade`/`deletar_categoria` já tinham checagem própria contra
     sabor/monte-pizza; adicionei uma rede de segurança pro caso de
     `itens_simples` (bebida/ingrediente) vinculado, que o código original
     não checava.
2. **`usuarios.adm` continua nascendo com `DEFAULT TRUE`**, exatamente como
   estava em `models.py` (`adm = Column(Boolean, default=True)`). Preservei
   o comportamento tal como estava, mas quase certamente é um bug --
   todo usuário novo nasce administrador. Vale corrigir separadamente pra
   `DEFAULT FALSE` quando fizer sentido pra vocês (não fiz aqui pra não
   misturar "trocar de banco" com "mudar regra de negócio").
3. **Respostas de `order_routes.py` mais consistentes.** Endpoints como
   cancelar/finalizar/remover item/remover adicional/marcar como entregue
   devolviam o objeto `Pedidos` do SQLAlchemy "como estava" na sessão --
   o formato real dependia de quais relationships já tinham sido carregadas
   antes no mesmo request. Agora todos devolvem o pedido completo e no
   mesmo formato usado por `GET /order/pedido/{id}` (itens, sabores,
   adicionais, ingredientes, bebidas). Estritamente mais informação, não
   deve quebrar nada que já lia só `pedido.id`/`pedido.status`.
4. **`GET /admin/listar/item-simples?tipo=...` com um `tipo` inválido**
   agora devolve lista vazia em vez de erro 500 (antes estourava `KeyError`
   ao tentar converter pro enum do Python).

## Preço como `DOUBLE PRECISION` (float), não `NUMERIC`

Mantive o mesmo tipo que já existia (`Float` no SQLAlchemy) pra não
introduzir divergência de arredondamento entre banco e o `preco: float`
que já está espalhado pelos schemas Pydantic e pelo frontend. O ideal pra
dinheiro é `NUMERIC(10,2)`, mas essa troca mexe em serialização e contas já
escritas em Python -- avisem se quiserem fazer essa migração à parte.

## O que NÃO mudou

Autenticação (JWT, cookies, argon2), regras de autorização (dono/admin),
regras de preço/borda/ingrediente, contrato de cada endpoint (mesmas rotas,
mesmos parâmetros, mesmos schemas Pydantic de request), `seed_dados.py`
(continua populando via chamadas HTTP à própria API, não toca no banco
diretamente) e o frontend (nenhuma mudança necessária).
