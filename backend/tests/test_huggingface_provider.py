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
