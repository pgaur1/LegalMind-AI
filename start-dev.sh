#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
BACKEND_PORT="${PORT:-8000}"
FRONTEND_PORT="${FRONTEND_PORT:-5173}"
VENV_PYTHON="$BACKEND_DIR/.venv/bin/python"

if [[ -n "${BACKEND_PYTHON:-}" ]]; then
    PYTHON="$BACKEND_PYTHON"
elif [[ -x "$VENV_PYTHON" ]]; then
    PYTHON="$VENV_PYTHON"
else
    PYTHON="$(command -v python3 || true)"
    if [[ -z "$PYTHON" ]]; then
        echo "ERROR: Python 3 is required to start the backend."
        exit 1
    fi

    echo "Creating backend virtual environment..."
    "$PYTHON" -m venv "$BACKEND_DIR/.venv"
    PYTHON="$VENV_PYTHON"
fi

if ! "$PYTHON" -c "import fastapi, uvicorn, pydantic_settings, loguru, requests" >/dev/null 2>&1; then
    echo "Installing backend dependencies (first run only)..."
    "$PYTHON" -m pip install -r "$BACKEND_DIR/requirements.txt"
fi

if [[ ! -x "$FRONTEND_DIR/node_modules/.bin/vite" ]]; then
    echo "Installing frontend dependencies (first run only)..."
    (cd "$FRONTEND_DIR" && npm install --no-package-lock)
fi

if [[ -n "${CODESPACE_NAME:-}" && -n "${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN:-}" ]]; then
    VITE_API_BASE_URL="https://${CODESPACE_NAME}-${FRONTEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}"
    UI_URL="$VITE_API_BASE_URL"
    API_DOCS_URL="https://${CODESPACE_NAME}-${BACKEND_PORT}.${GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}/docs"
else
    VITE_API_BASE_URL="http://localhost:${BACKEND_PORT}"
    UI_URL="http://localhost:${FRONTEND_PORT}"
    API_DOCS_URL="http://localhost:${BACKEND_PORT}/docs"
fi

for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    if "$PYTHON" -c '
import socket
import sys

with socket.socket() as sock:
    sys.exit(0 if sock.connect_ex(("127.0.0.1", int(sys.argv[1]))) == 0 else 1)
' "$port"; then
        echo "ERROR: Port $port is already in use. Stop the existing server and retry."
        exit 1
    fi
done

backend_pid=""
frontend_pid=""

cleanup() {
    trap - EXIT INT TERM
    for pid in "$frontend_pid" "$backend_pid"; do
        if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    for pid in "$frontend_pid" "$backend_pid"; do
        if [[ -n "$pid" ]]; then
            wait "$pid" 2>/dev/null || true
        fi
    done
}

trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

(
    cd "$BACKEND_DIR"
    exec "$PYTHON" -m uvicorn main:app \
        --host 0.0.0.0 \
        --port "$BACKEND_PORT" \
        --timeout-keep-alive 120
) &
backend_pid=$!

(
    cd "$FRONTEND_DIR"
    export VITE_API_BASE_URL
    exec "$FRONTEND_DIR/node_modules/.bin/vite" \
        --host 0.0.0.0 \
        --port "$FRONTEND_PORT" \
        --strictPort
) &
frontend_pid=$!

echo
echo "LegalMind AI is starting..."
echo "UI:        $UI_URL"
echo "API docs:  $API_DOCS_URL"
echo "Press Ctrl+C to stop both servers."

wait -n "$backend_pid" "$frontend_pid"
