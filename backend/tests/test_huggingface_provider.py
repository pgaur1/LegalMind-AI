from unittest.mock import Mock

import pytest

from llm.exceptions import LLMInvalidResponseError
from llm.huggingface_provider import HuggingFaceProvider


def make_response(message: dict) -> Mock:
    response = Mock()
    response.json.return_value = {
        "choices": [{"message": message}],
    }
    return response


def test_parse_response_uses_content_when_present():
    provider = HuggingFaceProvider()

    result = provider._parse_response(
        make_response({"content": "  READY  ", "reasoning": ""})
    )

    assert result == "READY"


def test_parse_response_uses_reasoning_when_content_is_null():
    provider = HuggingFaceProvider()

    result = provider._parse_response(
        make_response({"content": None, "reasoning": "  READY  "})
    )

    assert result == "READY"


def test_parse_response_reports_empty_content_and_reasoning():
    provider = HuggingFaceProvider()

    with pytest.raises(LLMInvalidResponseError, match="empty response"):
        provider._parse_response(make_response({"content": None, "reasoning": None}))


def test_generate_stream_yields_huggingface_content_deltas(monkeypatch):
    monkeypatch.setenv("HF_TOKEN", "test-token")
    provider = HuggingFaceProvider()
    response = Mock()
    response.ok = True
    response.iter_lines.return_value = [
        b'data: {"choices":[{"delta":{"content":"Hello"}}]}',
        b'data: {"choices":[{"delta":{"content":" world"}}]}',
        b'data: [DONE]',
    ]
    post = Mock(return_value=response)
    monkeypatch.setattr("llm.huggingface_provider.requests.post", post)

    chunks = list(provider.generate_stream("Say hello"))

    assert chunks == ["Hello", " world"]
    assert response.close.called
    assert post.call_args.kwargs["json"]["stream"] is True
