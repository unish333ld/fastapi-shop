from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .routes import cart_router, categories_router, products_router
from .database import init_db
from .config import settings

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=settings.static_dir), name="static")
app.include_router(cart_router)
app.include_router(categories_router)
app.include_router(products_router)

@app.on_event("startup")
def on_event():
    init_db()
    

@app.get("/")
def root():
    return {
        "message": "Welcome to our shop!",
        "docs": "/api/docs",
    }
    
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
    }
