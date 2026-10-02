"""AWS Bedrock Provider (Claude)"""
import os
import sys
from typing import Optional
from .base_provider import BaseLLMProvider

# Try to import AWS Bedrock wrapper
try:
    # Add parent directory to path to import aws_llm_wrapper
    parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if parent_dir not in sys.path:
        sys.path.insert(0, parent_dir)

    from aws_llm_wrapper import get_aws_llm
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False
    get_aws_llm = None


class BedrockProvider(BaseLLMProvider):
    """AWS Bedrock Claude provider"""

    def __init__(self):
        self.model = None
        if AWS_AVAILABLE:
            try:
                self.model = get_aws_llm()
            except Exception as e:
                print(f"Warning: Could not initialize AWS Bedrock: {e}")
                self.model = None

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """Generate text using AWS Bedrock Claude"""

        if not self.is_available():
            return "ERROR: AWS Bedrock not available"

        try:
            # Build messages
            messages = [{"role": "user", "content": prompt}]

            # Prepare kwargs
            kwargs = {
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": temperature
            }

            if system_prompt:
                kwargs["system"] = system_prompt

            # Call model
            response = self.model.invoke(**kwargs)

            # Extract content
            if hasattr(response, 'content'):
                if isinstance(response.content, list):
                    return response.content[0].text if response.content else ""
                return str(response.content)

            return str(response)

        except Exception as e:
            return f"ERROR: AWS Bedrock error - {str(e)}"

    def is_available(self) -> bool:
        """Check if AWS Bedrock is available"""
        return AWS_AVAILABLE and self.model is not None

    def get_model_name(self) -> str:
        """Get model name"""
        return "AWS Bedrock Claude Sonnet 4.5"
