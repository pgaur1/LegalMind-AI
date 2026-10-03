"""LLM Provider Exceptions"""


class LLMProviderError(Exception):
    """Base exception for LLM provider errors"""
    pass


class LLMAuthenticationError(LLMProviderError):
    """Authentication failed - invalid or missing token"""
    pass


class LLMBillingError(LLMProviderError):
    """Insufficient credits or billing required"""
    pass


class LLMPermissionError(LLMProviderError):
    """Access denied to model or provider"""
    pass


class LLMNotFoundError(LLMProviderError):
    """Model or endpoint not found"""
    pass


class LLMRateLimitError(LLMProviderError):
    """Rate limit or provider capacity exceeded"""
    def __init__(self, message: str, retry_after: int = None):
        super().__init__(message)
        self.retry_after = retry_after


class LLMServerError(LLMProviderError):
    """Temporary provider failure (500, 502, 503, 504)"""
    pass


class LLMTimeoutError(LLMProviderError):
    """Request timeout"""
    pass


class LLMInvalidResponseError(LLMProviderError):
    """Invalid or empty model response"""
    pass
