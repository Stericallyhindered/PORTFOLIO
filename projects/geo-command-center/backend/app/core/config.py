from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    APP_NAME: str = "GEO Command Center API"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str
    REDIS_URL: str = "redis://redis:6379/0"

    JWT_SECRET: str = "change-me"
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_MINUTES: int = 60
    REFRESH_TOKEN_MINUTES: int = 60 * 24 * 30
    AUTH_ALLOW_HEADER_FALLBACK: bool = True
    DEFAULT_ORG_ID: str | None = None

    OPENAI_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    GEMINI_API_KEY: str | None = None
    GOOGLE_AI_OVERVIEWS_API_KEY: str | None = None
    PERPLEXITY_API_KEY: str | None = None


settings = Settings()
