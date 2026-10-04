import os
import sys

import requests


GROQ_API_KEY = os.getenv("GROQ_API_KEY")

API_URL = "https://api.groq.com/openai/v1/chat/completions"
MODEL_NAME = "openai/gpt-oss-20b"


def ask_model(question: str) -> str:
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not available in the environment."
        )

    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": (
                    "Answer directly and concisely. "
                    "Follow the requested word count. "
                    "Return only the final answer."
                ),
            },
            {
                "role": "user",
                "content": question,
            },
        ],
        "temperature": 0.2,
        "max_completion_tokens": 6000,
        "reasoning_effort": "low",
        "reasoning_format": "hidden",
    }

    print(f"\nCalling model: {MODEL_NAME}")
    print("Please wait...")

    try:
        response = requests.post(
            API_URL,
            headers=headers,
            json=payload,
            timeout=180,
        )

    except requests.Timeout as error:
        raise RuntimeError("The request timed out.") from error

    except requests.RequestException as error:
        raise RuntimeError(
            f"Unable to connect to Groq: {error}"
        ) from error

    if not response.ok:
        raise RuntimeError(
            f"Groq request failed.\n"
            f"HTTP status: {response.status_code}\n"
            f"Response: {response.text}"
        )

    try:
        result = response.json()
    except ValueError as error:
        raise RuntimeError(
            f"Groq returned an invalid JSON response:\n{response.text}"
        ) from error

    choices = result.get("choices", [])

    if not choices:
        raise RuntimeError(
            f"The model returned no choices.\n"
            f"Response: {result}"
        )

    first_choice = choices[0]
    message = first_choice.get("message", {})

    answer = message.get("content")
    finish_reason = first_choice.get("finish_reason", "unknown")

    usage = result.get("usage", {})

    print("\nRequest information:")
    print(f"Finish reason: {finish_reason}")
    print(
        f"Prompt tokens: "
        f"{usage.get('prompt_tokens', 'not reported')}"
    )
    print(
        f"Completion tokens: "
        f"{usage.get('completion_tokens', 'not reported')}"
    )
    print(
        f"Total tokens: "
        f"{usage.get('total_tokens', 'not reported')}"
    )

    if finish_reason == "length":
        print(
            "\nWarning: The response reached the output limit "
            "and might be incomplete."
        )

    if not answer:
        raise RuntimeError(
            "The model returned no visible answer."
        )

    return answer


def main() -> None:
    print(
        f"GROQ_API_KEY configured: "
        f"{bool(GROQ_API_KEY)}"
    )

    if not GROQ_API_KEY:
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