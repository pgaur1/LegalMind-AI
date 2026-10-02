#!/bin/bash
# ============================================================================
# LegalMind AI - Startup Script for Backend
# ============================================================================

set -e

echo "==================================================================="
echo "LegalMind AI - Backend Startup"
echo "==================================================================="

# Check environment variables
echo "Checking environment configuration..."
if [ -z "$HF_TOKEN" ] && [ "$LLM_PROVIDER" = "huggingface" ]; then
    echo "ERROR: HF_TOKEN not set"
    exit 1
fi

echo "✓ Environment configured"
echo "  - LLM Provider: ${LLM_PROVIDER:-huggingface}"
echo "  - Port: ${PORT:-8000}"
echo "  - Debug: ${DEBUG:-false}"

# Check if data directories exist
echo ""
echo "Checking data directories..."
if [ ! -d "../vector_store" ]; then
    echo "ERROR: vector_store directory not found"
    exit 1
fi

if [ ! -d "../knowledge_graph" ]; then
    echo "ERROR: knowledge_graph directory not found"
    exit 1
fi

echo "✓ Data directories found"
echo "  - Vector Store: $(du -sh ../vector_store | cut -f1)"
echo "  - Knowledge Graph: $(du -sh ../knowledge_graph | cut -f1)"

# Start application
echo ""
echo "==================================================================="
echo "Starting FastAPI Application..."
echo "==================================================================="

exec uvicorn main:app \
    --host 0.0.0.0 \
    --port ${PORT:-8000} \
    --timeout-keep-alive 120 \
    --log-level ${LOG_LEVEL:-info}
