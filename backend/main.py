"""
LegalMind AI - Main FastAPI Application
Entry point for the backend server
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
import json
from loguru import logger

from config.config import settings, ensure_directories, validate_settings

# ============================================================================
# LIFESPAN EVENT HANDLER
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan event handler for startup and shutdown
    """
    # STARTUP
    logger.info("=" * 70)
    logger.info(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    logger.info("=" * 70)

    # Ensure directories exist
    logger.info("Ensuring directories...")
    ensure_directories()

    # Validate settings
    logger.info("Validating configuration...")
    validation_results = validate_settings()
    for result in validation_results:
        logger.info(f"  {result}")

    # Initialize database (will be implemented later)
    logger.info("Database initialization...")
    # await init_db()

    # Load LLM model (will be implemented later)
    logger.info("Loading LLM model...")
    # await load_llm_model()

    # Load vector store (will be implemented later)
    logger.info("Loading vector store...")
    # await load_vector_store()

    logger.info("=" * 70)
    logger.info("Application startup complete!")
    logger.info(f"Server running at http://{settings.HOST}:{settings.PORT}")
    logger.info(f"API docs at http://{settings.HOST}:{settings.PORT}/docs")
    logger.info("=" * 70)

    yield

    # SHUTDOWN
    logger.info("=" * 70)
    logger.info("Shutting down application...")
    logger.info("=" * 70)

    # Cleanup resources
    logger.info("Cleaning up resources...")
    # await cleanup_resources()

    logger.info("Shutdown complete!")


# ============================================================================
# FASTAPI APP INITIALIZATION
# ============================================================================
app = FastAPI(
    title=settings.APP_NAME,
    description=settings.APP_DESCRIPTION,
    version=settings.APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ============================================================================
# MIDDLEWARE
# ============================================================================

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_CREDENTIALS,
    allow_methods=settings.CORS_METHODS,
    allow_headers=settings.CORS_HEADERS,
)


# Request Timing Middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers"""
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(round(process_time, 3))
    return response


# Logging Middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests"""
    logger.info(f"REQUEST: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"RESPONSE: {request.method} {request.url.path} - Status: {response.status_code}")
    return response


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    logger.error(f"ERROR: Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if settings.DEBUG else "An error occurred",
            "path": str(request.url.path),
        },
    )


# ============================================================================
# ROOT ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": settings.APP_DESCRIPTION,
        "status": "running",
        "demo_mode": settings.DEMO_MODE,
        "docs": f"http://{settings.HOST}:{settings.PORT}/docs",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": time.time(),
    }


@app.get("/readiness")
async def readiness_check():
    """Check that the persisted vector index and metadata are usable."""
    try:
        import faiss
    except ImportError as exc:
        logger.error(f"Readiness check unavailable: FAISS could not be imported: {exc}")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "detail": "FAISS is not available"},
        )

    if not settings.FAISS_INDEX_PATH.is_file() or not settings.FAISS_METADATA_PATH.is_file():
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "detail": "Vector index or metadata file is missing"},
        )

    try:
        index = faiss.read_index(str(settings.FAISS_INDEX_PATH))
        with settings.FAISS_METADATA_PATH.open(encoding="utf-8") as metadata_file:
            metadata = json.load(metadata_file)
    except (OSError, RuntimeError, ValueError, json.JSONDecodeError) as exc:
        logger.error(f"Readiness check failed to load vector data: {exc}")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "detail": "Vector index or metadata could not be loaded"},
        )

    if not isinstance(metadata, list) or index.ntotal != len(metadata):
        return JSONResponse(
            status_code=503,
            content={
                "status": "not_ready",
                "detail": "Vector index and metadata counts do not match",
                "index_vectors": index.ntotal,
                "metadata_vectors": len(metadata) if isinstance(metadata, list) else None,
            },
        )

    return {
        "status": "ready",
        "vector_count": index.ntotal,
    }


@app.get("/api/v1/status")
async def api_status():
    """API status with detailed information"""
    return {
        "api_version": "v1",
        "app_name": settings.APP_NAME,
        "app_version": settings.APP_VERSION,
        "demo_mode": settings.DEMO_MODE,
        "features": {
            "research": "active",
            "draft_generation": "active",
            "precedent_search": "active",
            "order_tracking": "active",
            "dashboard": "active",
        },
        "endpoints": {
            "research": "/api/v1/research/chat",
            "drafts": "/api/v1/drafts/generate",
            "precedents": "/api/v1/precedents/search",
            "orders": "/api/v1/orders/",
            "dashboard": "/api/v1/dashboard/",
        },
        "agents": {
            "planner": settings.PLANNER_AGENT_ENABLED,
            "research": settings.RESEARCH_USE_RAG,
            "draft": True,
            "precedent": True,
            "tracking": True,
        },
        "llm": {
            "provider": settings.LLM_PROVIDER,
            "model": (
                settings.GROQ_MODEL
                if settings.LLM_PROVIDER == "groq"
                else settings.HF_MODEL
            ),
            "max_tokens": settings.LLM_MAX_TOKENS,
            "temperature": settings.LLM_TEMPERATURE,
        },
    }


# ============================================================================
# API ROUTERS
# ============================================================================

# Import and register all routers. Import failures should prevent the service
# from starting instead of leaving a partially available API.
logger.info("Loading API routers...")

from api import dashboard, drafts, orders, precedents, research

for router_module in (research, drafts, precedents, orders, dashboard):
    app.include_router(router_module.router, prefix="/api/v1")
    logger.success(f"✓ {router_module.__name__.rsplit('.', maxsplit=1)[-1].title()} API router registered")

logger.success("=" * 70)
logger.success("ALL 5 API ROUTERS LOADED!")
logger.success("=" * 70)


# ============================================================================
# RUN SERVER (Development)
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    logger.info("Starting development server...")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"Reload: {settings.RELOAD}")

    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )
