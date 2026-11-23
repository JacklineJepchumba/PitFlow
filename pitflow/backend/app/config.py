from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ROOT_DIR = _BACKEND_DIR.parent


def _env_files() -> tuple[str, ...]:
    """Prefer backend/.env, then pitflow/.env (repo root of the package)."""
    candidates = (_BACKEND_DIR / ".env", _ROOT_DIR / ".env")
    existing = tuple(str(p) for p in candidates if p.is_file())
    return existing or (str(_BACKEND_DIR / ".env"),)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=_env_files(),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Explicit psycopg2 driver (we ship psycopg2-binary, not psycopg v3)
    database_url: str = (
        "postgresql+psycopg2://pitflow:pitflow@localhost:5432/pitflow"
    )

    # Africa's Talking (sandbox)
    at_username: str = "sandbox"
    at_api_key: str = ""

    # M-Pesa Daraja (sandbox)
    daraja_consumer_key: str = ""
    daraja_consumer_secret: str = ""
    daraja_shortcode: str = ""
    daraja_passkey: str = ""
    daraja_payouts_enabled: bool = False

    # Comma-separated browser origins for the two Vite apps
    cors_origins: str = (
        "http://localhost:5173,http://localhost:5174,"
        "http://127.0.0.1:5173,http://127.0.0.1:5174,"
        "https://pitflow-web.fly.dev,https://pitflow-care.fly.dev"
    )

    # JWT auth (demo secret — replace for any real deploy)
    jwt_secret: str = "pitflow-demo-jwt-change-me"
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 60 * 12

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_database_url(self) -> str:
        """Normalize Fly/Heroku postgres:// URLs to psycopg2 for SQLAlchemy."""
        url = self.database_url
        if url.startswith("postgres://"):
            url = "postgresql+psycopg2://" + url[len("postgres://") :]
        elif url.startswith("postgresql://") and "+" not in url.split("://", 1)[0]:
            url = "postgresql+psycopg2://" + url[len("postgresql://") :]
        return url


settings = Settings()
