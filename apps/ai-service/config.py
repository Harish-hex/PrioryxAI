"""
Centralized settings for ai-service. Fails fast with a descriptive error
if a required var is missing, rather than failing confusingly deep inside
a Supabase or Anthropic client call.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: str
    supabase_service_role_key: str
    anthropic_api_key: str
    ai_service_secret: str

    # Verified current model id (see CLAUDE.md system context) - the
    # original spec's "claude-sonnet-4-6" string is stale and would fail
    # at the Anthropic API, not at build time, so it is not used here.
    claude_model: str = "claude-sonnet-5"


def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
