"""Smoke-test the running LegalMind API using only the Python standard library."""

import json
import os
import statistics
import sys
import time
from urllib.error import HTTPError, URLError
from urllib.request import urlopen


BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000").rstrip("/")
EXPECTED_VECTORS = 4986
HEALTH_REQUESTS = 10
HEALTH_AVERAGE_LIMIT_MS = 100


def get_json(path: str, timeout: float = 15) -> tuple[int, dict | list, float]:
    started = time.perf_counter()
    try:
        with urlopen(f"{BASE_URL}{path}", timeout=timeout) as response:
            status = response.status
            payload = json.loads(response.read())
    except HTTPError as error:
        payload = error.read().decode("utf-8", errors="replace")
        raise AssertionError(f"{path} returned HTTP {error.code}: {payload}") from error
    except URLError as error:
        raise AssertionError(f"Could not reach {BASE_URL}: {error.reason}") from error

    elapsed_ms = (time.perf_counter() - started) * 1000
    return status, payload, elapsed_ms


def run_check(name: str, check) -> bool:
    print(f"\nTesting: {name}")
    try:
        check()
    except Exception as error:
        print(f"FAIL: {error}")
        return False
    print("PASS")
    return True


def test_root() -> None:
    status, payload, elapsed = get_json("/")
    assert status == 200
    assert payload.get("app") == "LegalMind AI"
    assert payload.get("status") == "running"
    assert payload.get("version")
    assert payload.get("demo_mode") is True
    print(f"HTTP {status}, {elapsed:.2f} ms")


def test_health() -> None:
    status, payload, elapsed = get_json("/health")
    assert status == 200
    assert payload.get("status") == "healthy"
    print(f"HTTP {status}, {elapsed:.2f} ms")


def test_readiness() -> None:
    status, payload, elapsed = get_json("/readiness")
    assert status == 200
    assert payload.get("status") == "ready"
    assert payload.get("vector_count") == EXPECTED_VECTORS
    print(f"HTTP {status}, {elapsed:.2f} ms, {payload['vector_count']} vectors")


def test_api_status() -> None:
    status, payload, elapsed = get_json("/api/v1/status")
    assert status == 200
    assert payload.get("llm", {}).get("provider") == "huggingface"
    assert payload.get("llm", {}).get("model")
    print(f"HTTP {status}, {elapsed:.2f} ms, model configured")


def test_openapi_and_routes() -> None:
    status, payload, elapsed = get_json("/openapi.json")
    assert status == 200
    assert payload.get("openapi")
    paths = payload.get("paths", {})
    expected_paths = {
        "/api/v1/research/chat",
        "/api/v1/drafts/generate",
        "/api/v1/precedents/search",
        "/api/v1/orders/",
        "/api/v1/dashboard/",
    }
    missing = expected_paths.difference(paths)
    assert not missing, f"API routes missing from OpenAPI: {sorted(missing)}"
    print(f"HTTP {status}, {elapsed:.2f} ms, all required routes registered")


def test_health_performance() -> None:
    latencies = []
    for request_number in range(1, HEALTH_REQUESTS + 1):
        status, payload, elapsed = get_json("/health")
        assert status == 200 and payload.get("status") == "healthy"
        latencies.append(elapsed)
        print(f"Request {request_number}/{HEALTH_REQUESTS}: {elapsed:.2f} ms")

    average = statistics.mean(latencies)
    print(
        f"Average: {average:.2f} ms; min: {min(latencies):.2f} ms; "
        f"max: {max(latencies):.2f} ms; success: {len(latencies)}/{HEALTH_REQUESTS}"
    )
    assert average < HEALTH_AVERAGE_LIMIT_MS, (
        f"Average health response {average:.2f} ms exceeded "
        f"{HEALTH_AVERAGE_LIMIT_MS} ms"
    )


def main() -> int:
    print("=" * 60)
    print("LEGALMIND AI - LOCAL API TEST SUITE")
    print("=" * 60)
    print(f"Testing backend at: {BASE_URL}")

    checks = [
        ("Test 1: Root endpoint", test_root),
        ("Test 2: Health endpoint", test_health),
        ("Test 3: Readiness endpoint", test_readiness),
        ("Test 4: API status and Hugging Face configuration", test_api_status),
        ("Test 5: OpenAPI and API route registration", test_openapi_and_routes),
        ("Test 6: Health response performance", test_health_performance),
    ]
    results = [(name, run_check(name, check)) for name, check in checks]
    passed = sum(result for _, result in results)

    print("\n" + "=" * 60)
    print(f"Tests Passed: {passed}/{len(results)}")
    print(f"Success Rate: {passed / len(results):.1%}")
    for name, result in results:
        print(f"{'PASS' if result else 'FAIL'}: {name}")
    print("=" * 60)
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
