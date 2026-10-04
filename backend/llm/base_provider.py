"""Base LLM Provider Interface"""
from abc import ABC, abstractmethod
from typing import Iterator, Optional


class BaseLLMProvider(ABC):
    """Abstract base class for LLM providers"""

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """
        Generate text from prompt

        Args:
            prompt: User prompt
            system_prompt: System prompt (optional)
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature

        Returns:
            Generated text
        """
        pass

    def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> Iterator[str]:
        """Yield generated text chunks; providers may override with true streaming."""
        yield self.generate(prompt, system_prompt, max_tokens, temperature)

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider is available and configured"""
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """Get the model name being used"""
        pass
