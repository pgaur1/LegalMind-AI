"""
LegalMind AI - Main FastAPI Application
Entry point for the backend server
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import time
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
            "model": "AWS Claude Sonnet 4.5",
            "context_length": settings.LLM_CONTEXT_LENGTH,
            "max_tokens": settings.LLM_MAX_TOKENS,
        },
    }


# ============================================================================
# API ROUTERS
# ============================================================================

# Import and register ALL routers
logger.info("Loading API routers...")

try:
    from api import research
    app.include_router(research.router, prefix="/api/v1")
    logger.success("✓ Research API router registered")
except Exception as e:
    logger.error(f"✗ Research API failed: {e}")

try:
    from api import drafts
    app.include_router(drafts.router, prefix="/api/v1")
    logger.success("✓ Drafts API router registered")
except Exception as e:
    logger.error(f"✗ Drafts API failed: {e}")

try:
    from api import precedents
    app.include_router(precedents.router, prefix="/api/v1")
    logger.success("✓ Precedents API router registered")
except Exception as e:
    logger.error(f"✗ Precedents API failed: {e}")

try:
    from api import orders
    app.include_router(orders.router, prefix="/api/v1")
    logger.success("✓ Orders API router registered")
except Exception as e:
    logger.error(f"✗ Orders API failed: {e}")

try:
    from api import dashboard
    app.include_router(dashboard.router, prefix="/api/v1")
    logger.success("✓ Dashboard API router registered")
except Exception as e:
    logger.error(f"✗ Dashboard API failed: {e}")

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
