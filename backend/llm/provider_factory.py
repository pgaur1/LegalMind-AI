"""LLM Provider Factory"""
import os
from loguru import logger
from config.config import settings
from .base_provider import BaseLLMProvider
from .groq_provider import GroqProvider
from .huggingface_provider import HuggingFaceProvider


def get_llm_provider() -> BaseLLMProvider:
    """
    Get LLM provider based on environment configuration

    Environment Variables:
        LLM_PROVIDER: 'groq' (default) or 'huggingface'
        GROQ_API_KEY: Groq API key (required for the Groq provider)
        GROQ_MODEL: Groq model name (default: 'openai/gpt-oss-20b')
        HF_TOKEN: HuggingFace API token (required)
        HF_MODEL: Model name (default: 'zai-org/GLM-5.2')

    Returns:
        Configured LLM provider instance

    Raises:
        ValueError: If provider is unsupported or its credential is missing
    """
    provider_name = (os.getenv('LLM_PROVIDER') or settings.LLM_PROVIDER).lower()

    providers = {
        'groq': GroqProvider,
        'huggingface': HuggingFaceProvider,
    }
    provider_type = providers.get(provider_name)
    if provider_type is None:
        raise ValueError(
            f"Unsupported LLM_PROVIDER '{provider_name}'. "
            f"Choose one of: {', '.join(providers)}."
        )

    provider = provider_type()
    if not provider.is_available():
        credential = 'GROQ_API_KEY' if provider_name == 'groq' else 'HF_TOKEN'
        raise ValueError(
            f"{provider_name.title()} provider is not configured. "
            f"Set the {credential} environment variable."
        )

    logger.success(f"LLM provider: {provider_name} ({provider.get_model_name()})")
    return provider
