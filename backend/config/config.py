"""
LegalMind AI - Configuration Settings
"""

from pydantic_settings import BaseSettings
from pathlib import Path
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings with environment variable support"""

    # ========================================================================
    # APPLICATION SETTINGS
    # ========================================================================
    APP_NAME: str = "LegalMind AI"
    APP_VERSION: str = "1.0.0"
    APP_DESCRIPTION: str = "Agentic AI for Legal Operations"
    DEBUG: bool = True

    # ========================================================================
    # SERVER SETTINGS
    # ========================================================================
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True

    # ========================================================================
    # CORS SETTINGS
    # ========================================================================
    CORS_ORIGINS: list = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server (alternate port)
        "http://localhost:3000",  # Alternative frontend
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:3000",
    ]
    CORS_CREDENTIALS: bool = True
    CORS_METHODS: list = ["*"]
    CORS_HEADERS: list = ["*"]

    # ========================================================================
    # PATH SETTINGS (New deployment structure)
    # ========================================================================
    BASE_DIR: Path = Path(__file__).parent.parent  # backend/
    ROOT_DIR: Path = BASE_DIR.parent  # LegalMind-AI/
    VECTOR_STORE_DIR: Path = ROOT_DIR / "vector_store"
    GRAPH_DB_DIR: Path = ROOT_DIR / "knowledge_graph"

    # Legacy paths (for compatibility)
    DATA_DIR: Path = ROOT_DIR / "data"
    RAW_DOCUMENTS_DIR: Path = DATA_DIR / "raw_documents"
    PROCESSED_DIR: Path = DATA_DIR / "processed"
    MOCK_DATA_DIR: Path = DATA_DIR / "mock_data"

    # ========================================================================
    # DATABASE SETTINGS
    # ========================================================================
    DATABASE_URL: str = f"sqlite+aiosqlite:///{BASE_DIR}/data/legalmind.db"
    DATABASE_ECHO: bool = True  # Set False in production

    # ========================================================================
    # LLM SETTINGS (HuggingFace)
    # ========================================================================
    # Provider configuration (only 'huggingface' supported)
    LLM_PROVIDER: str = os.getenv('LLM_PROVIDER', 'huggingface')

    # HuggingFace Inference API settings
    HF_TOKEN: str = os.getenv('HF_TOKEN', '')  # Required!
    HF_MODEL: str = os.getenv('HF_MODEL', 'zai-org/GLM-5.2')
    HF_API_URL: str = os.getenv(
        'HF_API_URL',
        'https://router.huggingface.co/v1/chat/completions'
    )

    # Request configuration
    HF_REQUEST_TIMEOUT_SECONDS: int = int(os.getenv('HF_REQUEST_TIMEOUT_SECONDS', '120'))
    HF_MAX_RETRIES: int = int(os.getenv('HF_MAX_RETRIES', '3'))

    # Generation parameters (defaults, can be overridden per request)
    HF_MAX_TOKENS: int = int(os.getenv('HF_MAX_TOKENS', '1000'))
    HF_TEMPERATURE: float = float(os.getenv('HF_TEMPERATURE', '0.1'))

    # Legacy settings (for backward compatibility with existing code)
    LLM_MAX_TOKENS: int = HF_MAX_TOKENS
    LLM_TEMPERATURE: float = HF_TEMPERATURE

    # ========================================================================
    # EMBEDDING SETTINGS
    # ========================================================================
    # Use local embedding model (downloaded to bypass corporate firewall)
    EMBEDDING_MODEL_PATH: str = r"C:\Users\prgaur\OneDrive - Capgemini\PMI CA\Codebase\llm_models\embedding_model\all-MiniLM-L6-v2.pt"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"  # Fallback
    EMBEDDING_DIMENSION: int = 384
    EMBEDDING_BATCH_SIZE: int = 32
    USE_LOCAL_EMBEDDING: bool = True  # Use local model instead of downloading

    # ========================================================================
    # VECTOR STORE SETTINGS (FAISS)
    # ========================================================================
    FAISS_INDEX_TYPE: str = "IndexFlatL2"  # Simple for < 1M vectors
    FAISS_TOP_K: int = 5  # Top K results to retrieve
    FAISS_INDEX_PATH: Path = VECTOR_STORE_DIR / "faiss_index.bin"
    FAISS_METADATA_PATH: Path = VECTOR_STORE_DIR / "metadata.json"

    # ========================================================================
    # DOCUMENT PROCESSING SETTINGS
    # ========================================================================
    CHUNK_SIZE: int = 500  # Tokens per chunk
    CHUNK_OVERLAP: int = 50  # Token overlap between chunks
    MAX_FILE_SIZE_MB: int = 50
    ALLOWED_FILE_TYPES: list = [".pdf", ".docx", ".txt", ".html", ".rtf"]

    # ========================================================================
    # AGENT SETTINGS
    # ========================================================================
    # Planner Agent
    PLANNER_AGENT_ENABLED: bool = True
    PLANNER_CONTEXT_THRESHOLD: int = 3  # Min messages for context

    # Research Agent
    RESEARCH_AGENT_MAX_SOURCES: int = 5
    RESEARCH_AGENT_TIMEOUT: int = 30  # seconds
    RESEARCH_USE_RAG: bool = True
    RESEARCH_USE_GRAPH: bool = True
    RESEARCH_USE_WEB: bool = True  # Enable web scraping for demo

    # Draft Agent
    DRAFT_AGENT_MIN_WORDS: int = 200
    DRAFT_AGENT_MAX_WORDS: int = 2000
    DRAFT_AGENT_TEMPLATE_DIR: Path = RAW_DOCUMENTS_DIR / "templates"

    # Precedent Agent
    PRECEDENT_AGENT_MIN_RESULTS: int = 3
    PRECEDENT_AGENT_MAX_RESULTS: int = 10
    PRECEDENT_SEARCH_TIMEOUT: int = 20

    # Tracking Agent
    TRACKING_AGENT_CHECK_INTERVAL: int = 3600  # 1 hour
    TRACKING_REMINDER_DAYS: list = [7, 3, 1]  # Days before deadline

    # ========================================================================
    # WEB SCRAPING SETTINGS
    # ========================================================================
    SCRAPING_ENABLED: bool = True  # Enable for demo (uses mock data fallback)
    SCRAPING_TIMEOUT: int = 30
    SCRAPING_USER_AGENT: str = "LegalMind-Bot/1.0"
    SCRAPING_DELAY: float = 1.0  # Seconds between requests

    # Indian Kanoon
    INDIAN_KANOON_URL: str = "https://indiankanoon.org/"
    INDIAN_KANOON_SEARCH_URL: str = "https://indiankanoon.org/search/"

    # Supreme Court
    SUPREME_COURT_URL: str = "https://main.sci.gov.in/"

    # ========================================================================
    # GRAPH DATABASE SETTINGS (Graphify)
    # ========================================================================
    GRAPH_DB_ENABLED: bool = True
    GRAPH_MAX_DEPTH: int = 3
    GRAPH_MAX_NODES: int = 100

    # ========================================================================
    # AUTHENTICATION SETTINGS
    # ========================================================================
    SECRET_KEY: str = "your-secret-key-change-in-production"  # Change this!
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # ========================================================================
    # LOGGING SETTINGS
    # ========================================================================
    LOG_LEVEL: str = "INFO"  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    LOG_FILE: Path = BASE_DIR / "logs" / "app.log"
    LOG_ROTATION: str = "500 MB"
    LOG_RETENTION: str = "10 days"

    # ========================================================================
    # PERFORMANCE SETTINGS
    # ========================================================================
    MAX_WORKERS: int = 4
    REQUEST_TIMEOUT: int = 300  # 5 minutes
    MAX_CONCURRENT_REQUESTS: int = 10

    # ========================================================================
    # DEMO SETTINGS
    # ========================================================================
    DEMO_MODE: bool = True
    USE_MOCK_DATA: bool = True  # Use mock data initially
    DEMO_USER_ID: str = "user_001"
    DEMO_USER_NAME: str = "John Doe"

    class Config:
        env_file = ".env"
        case_sensitive = True


# ============================================================================
# SINGLETON INSTANCE
# ============================================================================
settings = Settings()


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================
def ensure_directories():
    """Create necessary directories if they don't exist"""
    directories = [
        settings.DATA_DIR,
        settings.RAW_DOCUMENTS_DIR,
        settings.PROCESSED_DIR,
        settings.VECTOR_STORE_DIR,
        settings.GRAPH_DB_DIR,
        settings.MOCK_DATA_DIR,
        settings.BASE_DIR / "logs",
    ]

    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"Directory ensured: {directory}")


def get_model_info():
    """Get LLM model information"""
    model_path = Path(settings.LLM_MODEL_PATH)
    if model_path.exists():
        size_gb = model_path.stat().st_size / (1024**3)
        return {
            "path": str(model_path),
            "exists": True,
            "size_gb": round(size_gb, 2),
            "context_length": settings.LLM_CONTEXT_LENGTH,
        }
    else:
        return {
            "path": str(model_path),
            "exists": False,
            "error": "Model file not found"
        }


def validate_settings():
    """Validate critical settings"""
    issues = []

    # Check model file
    if not Path(settings.LLM_MODEL_PATH).exists():
        issues.append(f"ERROR: LLM model not found: {settings.LLM_MODEL_PATH}")
    else:
        issues.append(f"SUCCESS: LLM model found: {settings.LLM_MODEL_PATH}")

    # Check directories
    ensure_directories()

    # Check database
    if settings.DATABASE_URL:
        issues.append(f"SUCCESS: Database configured: {settings.DATABASE_URL}")

    return issues


if __name__ == "__main__":
    """Test configuration"""
    print("=" * 70)
    print("LEGALMIND AI - CONFIGURATION CHECK")
    print("=" * 70)

    print("\nApplication Settings:")
    print(f"  - Name: {settings.APP_NAME}")
    print(f"  - Version: {settings.APP_VERSION}")
    print(f"  - Debug: {settings.DEBUG}")
    print(f"  - Demo Mode: {settings.DEMO_MODE}")

    print("\nServer Settings:")
    print(f"  - Host: {settings.HOST}")
    print(f"  - Port: {settings.PORT}")

    print("\nLLM Settings:")
    model_info = get_model_info()
    if model_info['exists']:
        print(f"  - Model: Found")
        print(f"  - Size: {model_info['size_gb']} GB")
        print(f"  - Context: {model_info['context_length']:,} tokens")
    else:
        print(f"  - Model: Not Found")
        print(f"  - Path: {model_info['path']}")

    print("\nPaths:")
    print(f"  - Base: {settings.BASE_DIR}")
    print(f"  - Data: {settings.DATA_DIR}")
    print(f"  - Documents: {settings.RAW_DOCUMENTS_DIR}")

    print("\nValidation:")
    for issue in validate_settings():
        print(f"  {issue}")

    print("\n" + "=" * 70)
    print("Configuration loaded successfully!")
    print("=" * 70)
