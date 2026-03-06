from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from auth_routes import auth_router
from order_routes import order_router

from fastapi.responses import RedirectResponse

app = FastAPI(title="Pizzaria API", description="API back end para autenticar pedidos", version="1.0.0")

@app.get("/", include_in_schema=False)
async def root():
    return RedirectResponse(url="/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(order_router)

