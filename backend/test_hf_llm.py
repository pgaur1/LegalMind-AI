"""
Test HuggingFace LLM Integration
Run this after deployment to verify HF API is working
"""
import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from llm import get_llm_provider


def test_provider_initialization():
    """Test that provider initializes correctly"""
    print("=" * 70)
    print("TEST 1: Provider Initialization")
    print("=" * 70)

    try:
        provider = get_llm_provider()
        print(f"✅ Provider initialized: {provider.get_model_name()}")
        print(f"✅ Token configured: {'Yes' if provider.is_available() else 'No'}")
        return True
    except Exception as e:
        print(f"❌ Provider initialization failed: {e}")
        return False


def test_simple_generation():
    """Test simple text generation"""
    print("\n" + "=" * 70)
    print("TEST 2: Simple Text Generation")
    print("=" * 70)

    try:
        provider = get_llm_provider()

        # Simple test prompt
        prompt = "What is the capital of France? Answer in one sentence."

        print(f"\nPrompt: {prompt}")
        print("\nGenerating response...")

        response = provider.generate(
            prompt=prompt,
            max_tokens=50,
            temperature=0.1
        )

        print(f"\nResponse:\n{response}\n")

        # Check if response is valid
        if response.startswith("ERROR:"):
            print(f"❌ Generation failed: {response}")
            return False
        elif len(response) < 10:
            print(f"❌ Response too short: {len(response)} chars")
            return False
        else:
            print(f"✅ Generation successful ({len(response)} chars)")
            return True

    except Exception as e:
        print(f"❌ Generation test failed: {e}")
        return False


def test_legal_generation():
    """Test legal content generation"""
    print("\n" + "=" * 70)
    print("TEST 3: Legal Content Generation")
    print("=" * 70)

    try:
        provider = get_llm_provider()

        # Legal test prompt
        system_prompt = "You are a legal assistant specializing in Indian law."
        prompt = "Explain Section 18 of RERA 2016 in 3 bullet points."

        print(f"\nSystem: {system_prompt}")
        print(f"Prompt: {prompt}")
        print("\nGenerating response...")

        response = provider.generate(
            prompt=prompt,
            system_prompt=system_prompt,
            max_tokens=200,
            temperature=0.1
        )

        print(f"\nResponse:\n{response}\n")

        # Check if response is valid
        if response.startswith("ERROR:"):
            print(f"❌ Generation failed: {response}")
            return False
        elif len(response) < 50:
            print(f"❌ Response too short: {len(response)} chars")
            return False
        else:
            print(f"✅ Legal generation successful ({len(response)} chars)")
            return True

    except Exception as e:
        print(f"❌ Legal generation test failed: {e}")
        return False


def main():
    """Run all tests"""
    print("\n" + "=" * 70)
    print("HUGGINGFACE LLM INTEGRATION TEST")
    print("=" * 70)

    # Check environment
    print("\nEnvironment Check:")
    print(f"HF_TOKEN: {'Set ✅' if os.getenv('HF_TOKEN') else 'Missing ❌'}")
    print(f"HF_MODEL: {os.getenv('HF_MODEL', 'zai-org/GLM-5.2')}")
    print(f"HF_API_URL: {os.getenv('HF_API_URL', 'https://router.huggingface.co/v1/chat/completions')}")

    if not os.getenv('HF_TOKEN'):
        print("\n❌ ERROR: HF_TOKEN environment variable not set!")
        print("Set it with: export HF_TOKEN=your_token_here")
        return

    # Run tests
    results = []

    results.append(("Provider Initialization", test_provider_initialization()))
    results.append(("Simple Generation", test_simple_generation()))
    results.append(("Legal Generation", test_legal_generation()))

    # Summary
    print("\n" + "=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)

    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} - {test_name}")

    total_passed = sum(1 for _, passed in results if passed)
    total_tests = len(results)

    print(f"\nTotal: {total_passed}/{total_tests} tests passed")

    if total_passed == total_tests:
        print("\n🎉 All tests passed! HuggingFace integration is working!")
    else:
        print("\n⚠️  Some tests failed. Check the error messages above.")

    print("=" * 70)


if __name__ == "__main__":
    main()
