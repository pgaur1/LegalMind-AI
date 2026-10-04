"""HuggingFace Inference API Provider - Chat Completions"""
import os
import time
import json
import requests
from typing import Iterator, Optional, Dict, Any
from loguru import logger
from config.config import settings
from .base_provider import BaseLLMProvider
from .exceptions import (
    LLMAuthenticationError,
    LLMBillingError,
    LLMPermissionError,
    LLMNotFoundError,
    LLMRateLimitError,
    LLMServerError,
    LLMTimeoutError,
    LLMInvalidResponseError
)


class HuggingFaceProvider(BaseLLMProvider):
    """
    HuggingFace Inference API provider using Chat Completions

    Uses HuggingFace Router endpoint (OpenAI-compatible):
    https://router.huggingface.co/v1/chat/completions

    Environment Variables:
        HF_TOKEN: HuggingFace API token (required)
        HF_MODEL: Model name (default: zai-org/GLM-5.2)
        HF_API_URL: API endpoint (default: router endpoint)
        HF_REQUEST_TIMEOUT_SECONDS: Request timeout (default: 120)
        HF_MAX_RETRIES: Max retry attempts (default: 3)
        HF_MAX_TOKENS: Default max tokens (default: 1000)
        HF_TEMPERATURE: Default temperature (default: 0.1)
    """

    def __init__(self):
        # Load configuration from environment
        self.api_token = os.getenv('HF_TOKEN') or settings.HF_TOKEN
        self.model_name = os.getenv('HF_MODEL') or settings.HF_MODEL
        self.api_url = os.getenv(
            'HF_API_URL',
            settings.HF_API_URL
        )
        self.timeout = int(
            os.getenv(
                'HF_REQUEST_TIMEOUT_SECONDS',
                str(settings.HF_REQUEST_TIMEOUT_SECONDS)
            )
        )
        self.max_retries = int(
            os.getenv('HF_MAX_RETRIES', str(settings.HF_MAX_RETRIES))
        )
        self.default_max_tokens = int(
            os.getenv('HF_MAX_TOKENS', str(settings.HF_MAX_TOKENS))
        )
        self.default_temperature = float(
            os.getenv('HF_TEMPERATURE', str(settings.HF_TEMPERATURE))
        )

        # Request headers
        self.headers = {
            "Authorization": f"Bearer {self.api_token}",
            "Content-Type": "application/json"
        }

        logger.info(f"HuggingFace Provider initialized: {self.model_name}")

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None
    ) -> str:
        """
        Generate text using HuggingFace Chat Completions API

        Args:
            prompt: User prompt
            system_prompt: System prompt (optional)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature

        Returns:
            Generated text

        Raises:
            LLMProviderError: On non-retryable errors
        """
        if not self.is_available():
            error_msg = "HuggingFace provider not configured. Please set HF_TOKEN environment variable."
            logger.error(error_msg)
            return f"ERROR: {error_msg}"

        # Use defaults if not specified
        max_tokens = max_tokens or self.default_max_tokens
        temperature = temperature if temperature is not None else self.default_temperature

        # Build messages for chat completions
        messages = []
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        messages.append({
            "role": "user",
            "content": prompt
        })

        # Build request payload
        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature
        }

        # Attempt with retries
        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(
                    f"HuggingFace API call (attempt {attempt}/{self.max_retries}): "
                    f"model={self.model_name}, max_tokens={max_tokens}, temp={temperature}"
                )

                response = self._make_request(payload)
                result = self._parse_response(response)

                logger.info(f"HuggingFace API success: {len(result)} chars generated")
                return result

            except (LLMRateLimitError, LLMServerError, LLMTimeoutError) as e:
                # Retryable errors
                if attempt < self.max_retries:
                    retry_after = getattr(e, 'retry_after', None)
                    wait_time = retry_after if retry_after else (2 ** attempt)  # Exponential backoff
                    logger.warning(
                        f"Retryable error on attempt {attempt}: {e}. "
                        f"Retrying in {wait_time}s..."
                    )
                    time.sleep(wait_time)
                    continue
                else:
                    logger.error(f"Max retries exceeded: {e}")
                    return f"ERROR: {str(e)}"

            except (LLMAuthenticationError, LLMBillingError, LLMPermissionError,
                    LLMNotFoundError, LLMInvalidResponseError) as e:
                # Non-retryable errors
                logger.error(f"Non-retryable error: {e}")
                return f"ERROR: {str(e)}"

            except Exception as e:
                logger.error(f"Unexpected error: {e}", exc_info=True)
                return f"ERROR: Unexpected error - {str(e)}"

        return "ERROR: Maximum retry attempts exceeded"

    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
    ) -> Iterator[str]:
        if not self.is_available():
            raise LLMAuthenticationError(
                "HuggingFace provider not configured. Please set HF_TOKEN."
            )

        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        payload = {
            "model": self.model_name,
            "messages": messages,
            "max_tokens": max_tokens or self.default_max_tokens,
            "temperature": temperature if temperature is not None else self.default_temperature,
            "stream": True,
        }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=self.timeout,
                stream=True,
            )
        except requests.exceptions.Timeout as exc:
            raise LLMTimeoutError(
                f"Request timed out after {self.timeout} seconds"
            ) from exc
        except requests.exceptions.RequestException as exc:
            raise LLMServerError(f"Request failed: {exc}") from exc

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
                        "HuggingFace returned an invalid streaming event."
                    ) from exc

                if event.get("error"):
                    raise LLMServerError("HuggingFace streaming generation failed.")
                choices = event.get("choices", [])
                if not choices:
                    continue
                content = choices[0].get("delta", {}).get("content")
                if isinstance(content, str) and content:
                    received_content = True
                    yield content

            if not received_content:
                raise LLMInvalidResponseError(
                    "HuggingFace returned an empty streamed response."
                )
        finally:
            response.close()

    def _make_request(self, payload: Dict[str, Any]) -> requests.Response:
        """
        Make HTTP request to HuggingFace API

        Args:
            payload: Request payload

        Returns:
            Response object

        Raises:
            LLMProviderError: On error
        """
        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=self.timeout
            )

            # Check for errors
            self._check_response_status(response)

            return response

        except requests.exceptions.Timeout:
            raise LLMTimeoutError(
                f"Request timed out after {self.timeout} seconds"
            )
        except requests.exceptions.ConnectionError as e:
            raise LLMServerError(f"Connection error: {str(e)}")
        except requests.exceptions.RequestException as e:
            raise LLMServerError(f"Request failed: {str(e)}")

    def _check_response_status(self, response: requests.Response) -> None:
        """
        Check HTTP response status and raise appropriate exception

        Args:
            response: Response object

        Raises:
            LLMProviderError: On error status codes
        """
        if response.ok:
            return

        status = response.status_code

        # Get request ID for logging
        request_id = response.headers.get('x-request-id', 'unknown')

        # Parse error message
        try:
            error_data = response.json()
            error_msg = error_data.get('error', {}).get('message', response.text)
        except:
            error_msg = response.text

        logger.error(
            f"HuggingFace API error: status={status}, "
            f"request_id={request_id}, error={error_msg[:200]}"
        )

        # Authentication errors
        if status == 401:
            raise LLMAuthenticationError(
                "Invalid or missing HF_TOKEN. Please check your HuggingFace API token."
            )

        # Billing errors
        if status == 402:
            raise LLMBillingError(
                "Insufficient credits or billing required. "
                "Your HuggingFace account may have exhausted free credits."
            )

        # Permission errors
        if status == 403:
            raise LLMPermissionError(
                f"Access denied to model '{self.model_name}'. "
                "Check if the model is available or if your account has access."
            )

        # Not found errors
        if status == 404:
            raise LLMNotFoundError(
                f"Model '{self.model_name}' or endpoint not found. "
                "Please verify the model name and API URL."
            )

        # Rate limit errors
        if status == 429:
            retry_after = response.headers.get('retry-after')
            retry_seconds = int(retry_after) if retry_after else None
            raise LLMRateLimitError(
                "Rate limit exceeded or provider capacity full. Please try again later.",
                retry_after=retry_seconds
            )

        # Server errors (retryable)
        if status in (500, 502, 503, 504):
            raise LLMServerError(
                f"HuggingFace server error ({status}). This is temporary, retrying..."
            )

        # Other errors
        raise LLMServerError(f"HTTP {status}: {error_msg}")

    def _parse_response(self, response: requests.Response) -> str:
        """
        Parse chat completion response

        Args:
            response: Response object

        Returns:
            Generated text

        Raises:
            LLMInvalidResponseError: On invalid response
        """
        try:
            result = response.json()
        except ValueError:
            raise LLMInvalidResponseError(
                "Response is not valid JSON"
            )

        # Extract choices
        choices = result.get('choices', [])
        if not choices:
            raise LLMInvalidResponseError(
                "No choices returned in response"
            )

        # Get first choice
        first_choice = choices[0]
        message = first_choice.get('message', {})

        # Get content
        content = (message.get('content') or '').strip()

        # GLM models may include reasoning
        reasoning = (message.get('reasoning') or '').strip()

        if content:
            return content
        elif reasoning:
            # Some models return only reasoning
            logger.warning("Model returned only reasoning, no visible answer")
            return reasoning
        else:
            raise LLMInvalidResponseError(
                "Model returned empty response"
            )

    def is_available(self) -> bool:
        """Check if HuggingFace provider is configured"""
        return bool(self.api_token)

    def get_model_name(self) -> str:
        """Get model name"""
        return self.model_name
