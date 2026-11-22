from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://pitflow:pitflow@localhost:5432/pitflow"
    at_username: str = "sandbox"
    at_api_key: str = ""


settings = Settings()
