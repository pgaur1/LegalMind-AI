"""Bridge blocking generation calls and their token callbacks to async API streams."""

import asyncio
from typing import Any, Callable, AsyncIterator, Tuple


async def stream_sync_call(
    function: Callable[[Callable[[str], None]], Any],
) -> AsyncIterator[Tuple[str, Any]]:
    """Yield token events and then one result/error event from a worker thread."""
    loop = asyncio.get_running_loop()
    queue: asyncio.Queue[Tuple[str, Any]] = asyncio.Queue()

    def publish(kind: str, value: Any) -> None:
        loop.call_soon_threadsafe(queue.put_nowait, (kind, value))

    def worker() -> None:
        try:
            result = function(lambda chunk: publish("token", chunk))
            publish("result", result)
        except Exception as error:
            publish("error", error)

    task = asyncio.create_task(asyncio.to_thread(worker))
    while True:
        kind, value = await queue.get()
        yield kind, value
        if kind in {"result", "error"}:
            await task
            break
