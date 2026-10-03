"""LLM Provider Factory"""
import os
from loguru import logger
from .base_provider import BaseLLMProvider
from .huggingface_provider import HuggingFaceProvider


def get_llm_provider() -> BaseLLMProvider:
    """
    Get LLM provider based on environment configuration

    Environment Variables:
        LLM_PROVIDER: Must be 'huggingface' (default: 'huggingface')
        HF_TOKEN: HuggingFace API token (required)
        HF_MODEL: Model name (default: 'zai-org/GLM-5.2')
        HF_API_URL: API endpoint (default: router endpoint)
        HF_REQUEST_TIMEOUT_SECONDS: Request timeout (default: 120)
        HF_MAX_RETRIES: Max retry attempts (default: 3)
        HF_MAX_TOKENS: Default max tokens (default: 1000)
        HF_TEMPERATURE: Default temperature (default: 0.1)

    Returns:
        Configured HuggingFace provider instance

    Raises:
        ValueError: If provider not configured or token missing
    """
    provider_name = os.getenv('LLM_PROVIDER', 'huggingface').lower()

    if provider_name != 'huggingface':
        logger.warning(
            f"Unknown LLM_PROVIDER '{provider_name}'. "
            "Only 'huggingface' is supported. Using HuggingFace."
        )

    # Initialize HuggingFace provider
    provider = HuggingFaceProvider()

    if not provider.is_available():
        error_msg = (
            "HuggingFace provider not configured. "
            "Please set HF_TOKEN environment variable with your HuggingFace API token. "
            "Get one at: https://huggingface.co/settings/tokens"
        )
        logger.error(error_msg)
        raise ValueError(error_msg)

    logger.success(f"✅ LLM Provider: HuggingFace ({provider.get_model_name()})")
    return provider
