"""
AWS Bedrock LLM Wrapper with Auto-Authentication
Handles SSO login, token refresh, and provides simple LLM interface

One-time setup for demo - authentication refreshes automatically every 40 min
"""
import boto3
import json
import os
import subprocess
import time
from datetime import datetime, timedelta
from botocore.exceptions import ClientError, TokenRetrievalError

# Configuration
AWS_PROFILE = 'pmi-dev-pgaur'
AWS_REGION = 'eu-west-1'
MODEL_ID = 'eu.anthropic.claude-sonnet-4-5-20250929-v1:0'
TOKEN_REFRESH_INTERVAL = 40 * 60  # 40 minutes in seconds

# Global state
_bedrock_client = None
_session = None
_last_auth_time = None
_chrome_path = None

def find_chrome():
    """Find Chrome executable"""
    global _chrome_path

    if _chrome_path:
        return _chrome_path

    chrome_paths = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
    ]

    for path in chrome_paths:
        if os.path.exists(path):
            _chrome_path = path
            return path

    return None

def check_authentication():
    """
    Check if AWS credentials are valid
    Returns: True if authenticated, False if expired
    """
    try:
        # Try to make a simple AWS call
        session = boto3.Session(
            profile_name=AWS_PROFILE,
            region_name=AWS_REGION
        )
        sts = session.client('sts')
        sts.get_caller_identity()
        return True
    except (ClientError, TokenRetrievalError, Exception):
        return False

def authenticate():
    """
    Authenticate with AWS SSO using Chrome
    Opens Chrome automatically for user approval
    """
    global _last_auth_time

    print("="*70)
    print("AWS SSO AUTHENTICATION")
    print("="*70)
    print("\nAuthentication required for AWS Bedrock access...")

    # Find Chrome
    chrome_path = find_chrome()

    if chrome_path:
        print(f"Found Chrome: {chrome_path}")
        # Set Chrome as default browser for this process
        os.environ['BROWSER'] = chrome_path

    print("\nOpening Chrome for authentication...")
    print("Please complete the authentication in the browser window.")
    print()

    try:
        # Run aws sso login
        result = subprocess.run(
            ["aws", "sso", "login", "--profile", AWS_PROFILE],
            capture_output=True,
            text=True,
            timeout=120  # 2 minute timeout
        )

        output = result.stdout + result.stderr

        if "Successfully logged into" in output:
            _last_auth_time = datetime.now()
            print("\n" + "="*70)
            print("AUTHENTICATION SUCCESSFUL!")
            print("="*70)
            print(f"Session valid for: ~60 minutes")
            print(f"Auto-refresh will happen at: {(_last_auth_time + timedelta(minutes=40)).strftime('%H:%M:%S')}")
            return True
        else:
            print("\nAuthentication may have failed. Output:")
            print(output)
            return False

    except subprocess.TimeoutExpired:
        print("\nAuthentication timeout. Please complete it manually:")
        print("  aws sso login --profile pmi-dev-pgaur")
        return False
    except Exception as e:
        print(f"\nError during authentication: {e}")
        return False

def ensure_authenticated():
    """
    Ensure AWS credentials are valid
    Auto-refreshes if token is about to expire (40 min mark)
    """
    global _last_auth_time

    # Check if we need to refresh
    if _last_auth_time:
        time_since_auth = (datetime.now() - _last_auth_time).total_seconds()
        if time_since_auth >= TOKEN_REFRESH_INTERVAL:
            print("\n[INFO] Token approaching expiration (40 min), refreshing...")
            return authenticate()

    # Check if credentials are valid
    if not check_authentication():
        print("\n[INFO] AWS credentials expired or invalid, authenticating...")
        return authenticate()

    return True

def initialize():
    """
    Initialize Bedrock client with auto-authentication
    Call this once at app startup
    """
    global _bedrock_client, _session, _last_auth_time

    print("="*70)
    print("AWS BEDROCK LLM - INITIALIZING")
    print("="*70)

    # Ensure authenticated
    if not ensure_authenticated():
        raise Exception("Failed to authenticate with AWS")

    # Create Bedrock client
    print("\nCreating Bedrock client...")
    _session = boto3.Session(
        profile_name=AWS_PROFILE,
        region_name=AWS_REGION
    )
    _bedrock_client = _session.client('bedrock-runtime')

    print(f"Bedrock client ready!")
    print(f"Model: Claude Sonnet 4.5")
    print(f"Region: {AWS_REGION}")

    if not _last_auth_time:
        _last_auth_time = datetime.now()

    print("="*70)
    print("READY FOR LLM CALLS")
    print("="*70)
    print("\nAuthentication will auto-refresh every 40 minutes")
    print("You can now make unlimited LLM calls without manual auth!\n")

def generate(prompt,
             max_tokens=300,
             temperature=0.7,
             top_p=0.9,
             top_k=None,
             stop_sequences=None,
             system_prompt=None):
    """
    Generate LLM response with full parameter control

    Args:
        prompt: Your question/prompt
        max_tokens: Max response length (default: 300)
        temperature: Creativity 0-1 (default: 0.7)
                    0 = focused/deterministic
                    1 = creative/random
        top_p: Nucleus sampling 0-1 (default: 0.9)
               Lower = more focused, Higher = more diverse
        top_k: Top-K sampling (default: None)
               Limits to top K tokens
        stop_sequences: List of strings to stop generation (default: None)
                       e.g., ["\n\n", "END", "###"]
        system_prompt: System message to set behavior (default: None)
                      e.g., "You are a legal expert..."

    Returns:
        str: Generated response

    Examples:
        # Basic
        response = generate("What is RERA?")

        # Focused/deterministic
        response = generate("What is RERA?", temperature=0.1)

        # Creative
        response = generate("Explain RERA creatively", temperature=0.9)

        # With system prompt
        response = generate(
            "What is RERA?",
            system_prompt="You are a legal expert specializing in Indian law."
        )

        # With stop sequences
        response = generate(
            "List RERA sections",
            stop_sequences=["Section 5:", "\n\n"]
        )
    """
    global _bedrock_client, _session

    # Auto-refresh if needed
    if not ensure_authenticated():
        raise Exception("Authentication failed")

    # Ensure client is initialized
    if _bedrock_client is None:
        initialize()

    # Build request body
    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "messages": [
            {"role": "user", "content": prompt}
        ]
    }

    # Add sampling parameters (temperature OR top_p, not both)
    # Temperature takes precedence if specified
    if temperature is not None and temperature != 0.7:
        request_body["temperature"] = temperature
    elif top_p is not None and top_p != 0.9:
        request_body["top_p"] = top_p
    else:
        # Default: use temperature
        request_body["temperature"] = temperature

    # Add optional parameters
    if top_k is not None:
        request_body["top_k"] = top_k

    if stop_sequences:
        request_body["stop_sequences"] = stop_sequences

    if system_prompt:
        request_body["system"] = system_prompt

    body = json.dumps(request_body)

    # Call Bedrock
    try:
        response = _bedrock_client.invoke_model(
            modelId=MODEL_ID,
            body=body
        )

        result = json.loads(response['body'].read())
        return result['content'][0]['text']

    except (ClientError, TokenRetrievalError) as e:
        # Token might have expired, try to re-auth
        print("\n[WARNING] Token expired during call, re-authenticating...")
        if authenticate():
            _bedrock_client = _session.client('bedrock-runtime')
            # Retry the call
            response = _bedrock_client.invoke_model(
                modelId=MODEL_ID,
                body=body
            )
            result = json.loads(response['body'].read())
            return result['content'][0]['text']
        else:
            raise Exception("Failed to re-authenticate")

def ask(question,
        context="",
        max_tokens=300,
        temperature=0.7,
        system_prompt=None,
        stop_sequences=None):
    """
    Convenience method for Q&A with optional context and parameters

    Args:
        question: User's question
        context: Optional context (e.g., from RAG)
        max_tokens: Max response length (default: 300)
        temperature: Creativity 0-1 (default: 0.7)
        system_prompt: System message (default: None)
        stop_sequences: Stop generation at these strings (default: None)

    Returns:
        str: Generated answer

    Examples:
        # Basic Q&A
        answer = ask("What is RERA Section 18?")

        # With context (RAG)
        answer = ask(
            question="What is RERA Section 18?",
            context="Retrieved legal context..."
        )

        # Focused response (low temperature)
        answer = ask(
            question="List RERA penalties",
            temperature=0.2
        )

        # With system prompt
        answer = ask(
            question="Explain RERA",
            system_prompt="You are a legal expert. Be concise and cite sources."
        )

        # Limit response length
        answer = ask(
            question="What is RERA?",
            max_tokens=100,
            stop_sequences=["\n\n"]
        )
    """
    # Build prompt with context if provided
    if context:
        prompt = f"""Based on the following context, answer the question.

CONTEXT:
{context}

QUESTION: {question}

Provide a detailed answer with citations."""
    else:
        prompt = question

    # Use default system prompt for legal context if not provided
    if system_prompt is None and context:
        system_prompt = "You are a legal research assistant specializing in Indian law. Provide accurate answers based on the given context and cite your sources."

    return generate(
        prompt=prompt,
        max_tokens=max_tokens,
        temperature=temperature,
        system_prompt=system_prompt,
        stop_sequences=stop_sequences
    )

def is_ready():
    """Check if LLM wrapper is initialized and ready"""
    return _bedrock_client is not None and check_authentication()

def get_session_info():
    """Get current session information"""
    if _last_auth_time:
        time_since_auth = (datetime.now() - _last_auth_time).total_seconds()
        time_until_refresh = TOKEN_REFRESH_INTERVAL - time_since_auth

        return {
            'authenticated': check_authentication(),
            'last_auth': _last_auth_time.strftime('%H:%M:%S'),
            'time_since_auth_min': int(time_since_auth / 60),
            'time_until_refresh_min': int(time_until_refresh / 60) if time_until_refresh > 0 else 0,
            'model': MODEL_ID,
            'region': AWS_REGION
        }
    return {'authenticated': False}

# Test and demo
if __name__ == "__main__":
    print("="*70)
    print("AWS LLM WRAPPER - DEMO")
    print("="*70)

    try:
        # Initialize (handles auth automatically)
        initialize()

        # Test query
        print("\n" + "="*70)
        print("TEST QUERY")
        print("="*70)

        question = "What is RERA Section 18? Answer in 2 sentences."
        print(f"\nQuestion: {question}")
        print("\nGenerating response...")

        start = time.time()
        answer = generate(question, max_tokens=150)
        elapsed = time.time() - start

        print(f"\nResponse (in {elapsed:.2f}s):")
        print("-"*70)
        print(answer)
        print("-"*70)

        # Show session info
        print("\n" + "="*70)
        print("SESSION INFO")
        print("="*70)
        info = get_session_info()
        for key, value in info.items():
            print(f"  {key}: {value}")

        print("\n" + "="*70)
        print("WRAPPER READY FOR YOUR APP!")
        print("="*70)
        print("\nUsage in your application:")
        print("""
import aws_llm_wrapper

# Initialize once at app startup (handles auth)
aws_llm_wrapper.initialize()

# Use unlimited times (auto-refreshes)
answer = aws_llm_wrapper.ask(
    question="Your question",
    context="Optional context"
)

print(answer)
        """)

    except Exception as e:
        print(f"\nError: {e}")
        print("\nTroubleshooting:")
        print("  1. Make sure Chrome is installed")
        print("  2. Check AWS CLI is installed")
        print("  3. Complete authentication in browser when prompted")
