"""Groq API provider using its OpenAI-compatible chat completions endpoint."""

import os
import json
from typing import Iterator, Optional

import requests
from loguru import logger

from config.config import settings
from .base_provider import BaseLLMProvider
from .exceptions import (
    LLMBillingError,
    LLMAuthenticationError,
    LLMInvalidResponseError,
    LLMNotFoundError,
    LLMPermissionError,
    LLMProviderError,
    LLMRateLimitError,
    LLMServerError,
    LLMTimeoutError,
)


class GroqProvider(BaseLLMProvider):
    """Generate text through Groq's chat completions API."""

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY") or settings.GROQ_API_KEY
        self.model_name = os.getenv("GROQ_MODEL") or settings.GROQ_MODEL
        self.api_url = os.getenv(
            "GROQ_API_URL",
            settings.GROQ_API_URL,
        )
        self.timeout = int(
            os.getenv(
                "GROQ_REQUEST_TIMEOUT_SECONDS",
                str(settings.GROQ_REQUEST_TIMEOUT_SECONDS),
            )
        )
        self.default_max_tokens = int(
            os.getenv(
                "GROQ_MAX_COMPLETION_TOKENS",
                str(settings.GROQ_MAX_COMPLETION_TOKENS),
            )
        )
        self.default_temperature = float(
            os.getenv("GROQ_TEMPERATURE", str(settings.GROQ_TEMPERATURE))
        )
        self.reasoning_effort = os.getenv(
            "GROQ_REASONING_EFFORT", settings.GROQ_REASONING_EFFORT
        )
        self.reasoning_format = os.getenv(
            "GROQ_REASONING_FORMAT", settings.GROQ_REASONING_FORMAT
        )

        logger.info(f"Groq provider initialized: {self.model_name}")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> str:
        if not self.is_available():
            raise LLMAuthenticationError(
                "Groq provider is not configured. Set GROQ_API_KEY."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_completion_tokens": max_tokens or self.default_max_tokens,
            "temperature": (
                temperature if temperature is not None else self.default_temperature
            ),
            "reasoning_effort": self.reasoning_effort,
            "reasoning_format": self.reasoning_format,
        }

        try:
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=self.timeout,
            )
        except requests.exceptions.Timeout as exc:
            raise LLMTimeoutError(
                f"Groq request timed out after {self.timeout} seconds"
            ) from exc
        except requests.exceptions.RequestException as exc:
            raise LLMServerError(f"Groq request failed: {exc}") from exc

        self._check_response_status(response)
        return self._parse_response(response)

    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> Iterator[str]:
        if not self.is_available():
            raise LLMAuthenticationError("Groq provider is not configured. Set GROQ_API_KEY.")

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_completion_tokens": max_tokens or self.default_max_tokens,
            "temperature": temperature if temperature is not None else self.default_temperature,
            "reasoning_effort": self.reasoning_effort,
            "reasoning_format": self.reasoning_format,
            "stream": True,
        }

        try:
            response = requests.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
                timeout=self.timeout,
                stream=True,
            )
        except requests.exceptions.Timeout as exc:
            raise LLMTimeoutError(
                f"Groq request timed out after {self.timeout} seconds"
            ) from exc
        except requests.exceptions.RequestException as exc:
            raise LLMServerError(f"Groq request failed: {exc}") from exc

        try:
            self._check_response_status(response)
            received_content = False
            for line in response.iter_lines(decode_unicode=True):
                if not line:
                    continue
                if isinstance(line, bytes):
                    line = line.decode("utf-8")
                if not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    event = json.loads(data)
                except ValueError as exc:
                    raise LLMInvalidResponseError(
                        "Groq returned an invalid streaming event."
                    ) from exc

                if event.get("error"):
                    raise LLMProviderError("Groq streaming generation failed.")
                choices = event.get("choices", [])
                if not choices:
                    continue
                delta = choices[0].get("delta", {})
                content = delta.get("content")
                if isinstance(content, str) and content:
                    received_content = True
                    yield content

            if not received_content:
                raise LLMInvalidResponseError("Groq returned an empty streamed response.")
        finally:
            response.close()

    def _check_response_status(self, response: requests.Response) -> None:
        if response.ok:
            return

        status = response.status_code
        request_id = response.headers.get("x-request-id", "unknown")
        try:
            error_data = response.json()
            error = error_data.get("error", {})
            error_message = (
                error.get("message", response.text)
                if isinstance(error, dict)
                else str(error)
            )
        except ValueError:
            error_message = response.text

        logger.error(
            f"Groq API error: status={status}, request_id={request_id}, "
            f"error={error_message[:200]}"
        )

        if status == 401:
            raise LLMAuthenticationError("Groq rejected the API key.")
        if status == 402:
            raise LLMBillingError("Groq account billing or usage limit was reached.")
        if status == 403:
            raise LLMPermissionError("Groq denied access to the configured model.")
        if status == 404:
            raise LLMNotFoundError(
                f"Groq model '{self.model_name}' or API endpoint was not found."
            )
        if status == 429:
            retry_after = response.headers.get("retry-after")
            try:
                retry_seconds = int(retry_after) if retry_after else None
            except ValueError:
                retry_seconds = None
            raise LLMRateLimitError("Groq rate limit exceeded.", retry_seconds)
        if status >= 500:
            raise LLMServerError(f"Groq server returned HTTP {status}.")
        raise LLMProviderError(f"Groq API returned HTTP {status}: {error_message[:200]}")

    @staticmethod
    def _parse_response(response: requests.Response) -> str:
        try:
            result = response.json()
        except ValueError as exc:
            raise LLMInvalidResponseError(
                "Groq response is not valid JSON."
            ) from exc

        choices = result.get("choices")
        if not isinstance(choices, list) or not choices:
            raise LLMInvalidResponseError("Groq returned no completion choices.")

        message = choices[0].get("message", {})
        content = message.get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()

        raise LLMInvalidResponseError("Groq returned an empty response.")

    def is_available(self) -> bool:
        return bool(self.api_key)

    def get_model_name(self) -> str:
        return self.model_name
