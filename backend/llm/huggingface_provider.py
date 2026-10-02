"""HuggingFace Inference API Provider"""
import os
import requests
from typing import Optional
from .base_provider import BaseLLMProvider


class HuggingFaceProvider(BaseLLMProvider):
    """HuggingFace Inference API provider"""

    def __init__(self):
        self.api_token = os.getenv('HF_TOKEN')
        self.model_name = os.getenv('HF_MODEL', 'Qwen/Qwen2.5-7B-Instruct')
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
        self.headers = {"Authorization": f"Bearer {self.api_token}"}

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        max_tokens: int = 1000,
        temperature: float = 0.7
    ) -> str:
        """Generate text using HuggingFace Inference API"""

        if not self.is_available():
            return "ERROR: HuggingFace provider not configured"

        # Format prompt with system message if provided
        if system_prompt:
            full_prompt = f"<|im_start|>system\n{system_prompt}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
        else:
            full_prompt = f"<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"

        payload = {
            "inputs": full_prompt,
            "parameters": {
                "max_new_tokens": max_tokens,
                "temperature": temperature,
                "top_p": 0.95,
                "do_sample": temperature > 0,
                "return_full_text": False
            }
        }

        try:
            response = requests.post(
                self.api_url,
                headers=self.headers,
                json=payload,
                timeout=120
            )
            response.raise_for_status()

            result = response.json()

            # Handle response format
            if isinstance(result, list) and len(result) > 0:
                return result[0].get('generated_text', '').strip()
            elif isinstance(result, dict):
                return result.get('generated_text', '').strip()
            else:
                return str(result)

        except requests.exceptions.Timeout:
            return "ERROR: HuggingFace API request timed out"
        except requests.exceptions.RequestException as e:
            return f"ERROR: HuggingFace API error - {str(e)}"
        except Exception as e:
            return f"ERROR: Unexpected error - {str(e)}"

    def is_available(self) -> bool:
        """Check if HuggingFace provider is configured"""
        return bool(self.api_token)

    def get_model_name(self) -> str:
        """Get model name"""
        return self.model_name
