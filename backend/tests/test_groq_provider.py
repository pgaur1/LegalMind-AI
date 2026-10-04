from unittest.mock import Mock

import pytest

from llm.exceptions import (
    LLMBillingError,
    LLMAuthenticationError,
    LLMInvalidResponseError,
)
from llm.groq_provider import GroqProvider
from llm.provider_factory import get_llm_provider


def test_generate_sends_groq_completion_request(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    provider = GroqProvider()
    response = Mock()
    response.ok = True
    response.json.return_value = {
        "choices": [{"message": {"content": "  READY  "}}],
    }
    post = Mock(return_value=response)
    monkeypatch.setattr("llm.groq_provider.requests.post", post)

    result = provider.generate(
        "Say READY",
        system_prompt="Be concise",
        max_tokens=64,
        temperature=0,
    )

    assert result == "READY"
    args, kwargs = post.call_args
    assert args[0] == "https://api.groq.com/openai/v1/chat/completions"
    assert kwargs["headers"]["Authorization"] == "Bearer test-key"
    assert kwargs["json"] == {
        "model": "openai/gpt-oss-20b",
        "messages": [
            {"role": "system", "content": "Be concise"},
            {"role": "user", "content": "Say READY"},
        ],
        "max_completion_tokens": 64,
        "temperature": 0,
        "reasoning_effort": "low",
        "reasoning_format": "hidden",
    }


def test_generate_stream_yields_groq_content_deltas(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    provider = GroqProvider()
    response = Mock()
    response.ok = True
    response.iter_lines.return_value = [
        b'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        b'data: {"choices":[{"delta":{"content":" world"}}]}',
        b'data: [DONE]',
    ]
    post = Mock(return_value=response)
    monkeypatch.setattr("llm.groq_provider.requests.post", post)

    chunks = list(provider.generate_stream("Say hello"))

    assert chunks == ["Hello", " world"]
    assert response.close.called
    assert post.call_args.kwargs["json"]["stream"] is True
    assert post.call_args.kwargs["headers"]["Authorization"] == "Bearer test-key"


def test_generate_requires_api_key(monkeypatch):
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.setattr("llm.groq_provider.settings.GROQ_API_KEY", "")

    with pytest.raises(LLMAuthenticationError, match="GROQ_API_KEY"):
        GroqProvider().generate("Say READY")


def test_provider_factory_defaults_to_groq(monkeypatch):
    monkeypatch.delenv("LLM_PROVIDER", raising=False)
    monkeypatch.setenv("GROQ_API_KEY", "test-key")

    provider = get_llm_provider()

    assert isinstance(provider, GroqProvider)
    assert provider.get_model_name() == "openai/gpt-oss-20b"


def test_provider_factory_rejects_unknown_provider(monkeypatch):
    monkeypatch.setenv("LLM_PROVIDER", "unknown")

    with pytest.raises(ValueError, match="Unsupported LLM_PROVIDER"):
        get_llm_provider()


def test_generate_maps_billing_error(monkeypatch):
    monkeypatch.setenv("GROQ_API_KEY", "test-key")
    provider = GroqProvider()
    response = Mock()
    response.ok = False
    response.status_code = 402
    response.headers = {}
    response.json.return_value = {"error": {"message": "quota reached"}}
    monkeypatch.setattr("llm.groq_provider.requests.post", Mock(return_value=response))

    with pytest.raises(LLMBillingError):
        provider.generate("Say READY")


def test_parse_response_rejects_empty_content():
    response = Mock()
    response.json.return_value = {"choices": [{"message": {"content": " "}}]}

    with pytest.raises(LLMInvalidResponseError, match="empty response"):
        GroqProvider._parse_response(response)
