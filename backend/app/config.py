import os


def _split_origins(raw: str) -> list[str]:
    return [o.strip() for o in raw.split(",") if o.strip()]


class Settings:
    """Central place for anything that differs between local dev and a
    deployed environment (Render, etc). Everything here is read from
    environment variables so no code changes are needed to deploy."""

    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sentinel.db")

    # Comma-separated list, e.g. "https://my-app.vercel.app,http://localhost:5173"
    # Defaults to "*" for local development convenience.
    CORS_ORIGINS: list[str] = _split_origins(os.getenv("CORS_ORIGINS", "*"))

    SWEEP_INTERVAL_SECONDS: int = int(os.getenv("SWEEP_INTERVAL_SECONDS", "60"))
    REQUEST_TIMEOUT_SECONDS: int = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "10"))


settings = Settings()
