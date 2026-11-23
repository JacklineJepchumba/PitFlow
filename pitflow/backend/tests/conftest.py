import os

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Use the configured DB; tests that need DB will skip if unreachable.
os.environ.setdefault(
    "DATABASE_URL",
    "postgresql+psycopg2://pitflow:pitflow@localhost:5432/pitflow",
)


@pytest.fixture(scope="session")
def db_available():
    from app.config import settings

    engine = create_engine(settings.database_url, pool_pre_ping=True)
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        engine.dispose()


@pytest.fixture
def client():
    from app.main import app

    return TestClient(app)
