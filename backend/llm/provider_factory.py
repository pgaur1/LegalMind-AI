"""LLM Provider Factory"""
import os
from .base_provider import BaseLLMProvider
from .huggingface_provider import HuggingFaceProvider
from .bedrock_provider import BedrockProvider


def get_llm_provider() -> BaseLLMProvider:
    """
    Get LLM provider based on environment configuration

    Environment Variables:
        LLM_PROVIDER: 'huggingface' or 'bedrock' (default: 'huggingface')
        HF_TOKEN: HuggingFace API token (for HuggingFace provider)
        HF_MODEL: HuggingFace model name (default: 'Qwen/Qwen2.5-7B-Instruct')

    Returns:
        Configured LLM provider instance
    """
    provider_name = os.getenv('LLM_PROVIDER', 'huggingface').lower()

    if provider_name == 'bedrock':
        provider = BedrockProvider()
        if provider.is_available():
            print(f"✅ LLM Provider: AWS Bedrock ({provider.get_model_name()})")
            return provider
        else:
            print("⚠️  AWS Bedrock not available, falling back to HuggingFace")
            provider_name = 'huggingface'

    if provider_name == 'huggingface':
        provider = HuggingFaceProvider()
        if provider.is_available():
            print(f"✅ LLM Provider: HuggingFace ({provider.get_model_name()})")
            return provider
        else:
            raise ValueError(
                "HuggingFace provider not configured. "
                "Please set HF_TOKEN environment variable."
            )

    raise ValueError(f"Unknown LLM provider: {provider_name}")
