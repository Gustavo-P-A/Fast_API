from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Pizzaria API", description="API back end para autenticar pedidos", version="1.0.0")

from auth_routes import auth_router
from order_routes import order_router

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(order_router, prefix="/api/v1")

