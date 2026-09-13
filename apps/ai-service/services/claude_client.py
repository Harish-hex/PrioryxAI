"""
Every Claude call in PrioryxAI must include the student's full Digital
Twin as system context - never a bare question. This wrapper is the only
place ai-service calls Anthropic, so that rule can't be bypassed by a
router calling the SDK directly.
"""

from anthropic import Anthropic

from config import get_settings
from models.career_graph import CareerGraph

SYSTEM_TEMPLATE = """You are PrioryxAI's career intelligence engine. You reason over a \
student's complete career state to generate specific, evidence-based \
recommendations. You never give generic advice. Every recommendation \
must cite specific data points from the student's profile.

You must NOT write assignments, complete homework, or generate exam \
answers. You MAY explain concepts, suggest resources, build learning \
plans, and review code the student wrote.

Student State:
{career_context}
"""

_client: Anthropic | None = None


def _get_client() -> Anthropic:
    global _client
    if _client is None:
        _client = Anthropic(api_key=get_settings().anthropic_api_key)
    return _client


def ask(career_graph: CareerGraph, question: str, max_tokens: int = 1024) -> str:
    settings = get_settings()
    system = SYSTEM_TEMPLATE.format(career_context=career_graph.to_context_string())
    response = _get_client().messages.create(
        model=settings.claude_model,
        max_tokens=max_tokens,
        system=system,
        messages=[{"role": "user", "content": question}],
    )
    return "".join(block.text for block in response.content if block.type == "text")
