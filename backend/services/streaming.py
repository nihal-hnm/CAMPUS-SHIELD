"""
Streaming service — 64 KB chunked streaming with per-chunk emergency check.
Any mid-stream emergency lockdown or revocation stops the stream immediately.
"""
from __future__ import annotations
import asyncio
from typing import AsyncGenerator

from services.access_engine import EMERGENCY_LOCKED_DOCS, REVOKED_TOKENS

CHUNK_SIZE = 65_536  # 64 KB


async def stream_document_chunks(
    document_id: str,
    token: str,
    content: bytes,
) -> AsyncGenerator[bytes, None]:
    """
    Yields 64 KB chunks of `content`.
    Before each chunk, checks:
      1. Token not revoked
      2. Document not emergency-locked
    If either check fails, raises StopAsyncIteration (stream ends immediately).
    """
    total = len(content)
    offset = 0

    while offset < total:
        # Per-chunk Zero-Trust check
        if token in REVOKED_TOKENS:
            # Stop stream silently — connection will be dropped
            return
        if document_id in EMERGENCY_LOCKED_DOCS:
            return

        chunk = content[offset : offset + CHUNK_SIZE]
        offset += CHUNK_SIZE
        yield chunk
        # Tiny yield to allow other coroutines to run (cooperative multitasking)
        await asyncio.sleep(0)
