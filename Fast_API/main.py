from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi import _rate_limit_exceeded_handler
from core.limiter import limiter
from database import pool
from auth_routes import auth_router
from order_routes import order_router
from area_admin import area_admin
from cardapio_routes import cardapio_routes
from enderecos_routes import enderecos_router
from produto_routes import produto_routes
from item_simples_routes import item_simples_routes
from monte_pizza_routes import monte_pizza_routes
from formas_pagamento_routes import formas_pagamento_routes
from finalizar_pedido import finalizar_pagamento
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool.open()
    yield
    pool.close()


app = FastAPI(title="Pizzaria API", description="WebSite Pizzaria", version="1.0.0", lifespan=lifespan)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Accept", "Authorization", "Content-Type", "X-Requested-With"],
)

app.include_router(auth_router)
app.include_router(order_router)
app.include_router(area_admin)
app.include_router(cardapio_routes)
app.include_router(enderecos_router)
app.include_router(produto_routes)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.include_router(item_simples_routes)
app.include_router(monte_pizza_routes)
app.include_router(formas_pagamento_routes)
app.include_router(finalizar_pagamento)