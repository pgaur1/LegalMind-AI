import os
import sys

import requests


# Read the token from the Codespaces environment.
HF_TOKEN = os.getenv("HF_TOKEN")

API_URL = "https://router.huggingface.co/v1/chat/completions"
MODEL_NAME = "zai-org/GLM-5.2"


def ask_model(question: str) -> str:
    if not HF_TOKEN:
        raise RuntimeError(
            "HF_TOKEN is not available in the environment. "
            "Check the Codespaces secret and rebuild or restart the Codespace."
        )

    headers = {
        "Authorization": f"Bearer {HF_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": question,
            }
        ],
        # This allowance includes visible response tokens and any reasoning tokens.
        "max_tokens": 3000,
        "temperature": 0.2,
        "stream": False,
    }

    print(f"\nCalling model: {MODEL_NAME}")
    print("Please wait...\n")

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=300,
        )
    except requests.Timeout as exc:
        raise RuntimeError(
            "The Hugging Face request timed out."
        ) from exc
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Could not connect to Hugging Face: {exc}"
        ) from exc

    if not response.ok:
        raise RuntimeError(
            f"Hugging Face request failed.\n"
            f"HTTP status: {response.status_code}\n"
            f"Response: {response.text}"
        )

    try:
        result = response.json()
    except ValueError as exc:
        raise RuntimeError(
            f"Hugging Face returned invalid JSON:\n{response.text}"
        ) from exc

    choices = result.get("choices", [])

    if not choices:
        raise RuntimeError(
            f"No choices were returned by the model.\n"
            f"Full response: {result}"
        )

    first_choice = choices[0]
    message = first_choice.get("message", {})

    answer = message.get("content")
    reasoning = message.get("reasoning")
    finish_reason = first_choice.get("finish_reason", "unknown")

    usage = result.get("usage", {})

    print("Request details:")
    print(f"  Finish reason: {finish_reason}")
    print(f"  Prompt tokens: {usage.get('prompt_tokens', 'not reported')}")
    print(f"  Completion tokens: {usage.get('completion_tokens', 'not reported')}")
    print(f"  Total tokens: {usage.get('total_tokens', 'not reported')}")

    if finish_reason == "length":
        print(
            "\nWarning: The model reached the token limit. "
            "The answer might be incomplete."
        )

    if answer:
        return answer

    if reasoning:
        raise RuntimeError(
            "The model returned reasoning but no visible answer. "
            "Its output allowance may have been consumed by reasoning.\n\n"
            f"Reasoning returned:\n{reasoning}"
        )

    raise RuntimeError(
        "The model returned neither visible content nor reasoning."
    )


def main() -> None:
    # Confirm presence without showing the actual secret.
    print(f"HF_TOKEN configured: {bool(HF_TOKEN)}")

    if not HF_TOKEN:
        sys.exit(1)

    question = input("\nEnter your question: ").strip()

    if not question:
        print("No question was entered.")
        sys.exit(1)

    try:
        answer = ask_model(question)

        print("\nModel answer:\n")
        print(answer)

    except RuntimeError as error:
        print(f"\nError:\n{error}")
        sys.exit(1)


if __name__ == "__main__":
    main()