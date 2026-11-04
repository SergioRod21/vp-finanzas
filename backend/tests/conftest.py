import os

# app.core.config exige estas variables al importarse. Los tests no se conectan a
# PostgreSQL: la sesión se reemplaza por una falsa con dependency_overrides.
os.environ.setdefault("APP_ENV", "development")
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg://test:test@localhost:5432/test")
os.environ.setdefault("JWT_SECRET", "secreto-de-tests-con-longitud-suficiente-0123456789")

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.db import get_session  # noqa: E402
from app.main import app  # noqa: E402


class FakeSession:
    """Sesión falsa: responde bien, o lanza el error indicado al ejecutar una consulta."""

    def __init__(self, error: Exception | None = None):
        self.error = error

    def exec(self, *args, **kwargs):
        if self.error:
            raise self.error


@pytest.fixture
def make_client():
    def _make(session: FakeSession) -> TestClient:
        app.dependency_overrides[get_session] = lambda: session
        # raise_server_exceptions=False: el cliente recibe la respuesta 500 en lugar de la excepción
        return TestClient(app, raise_server_exceptions=False)

    yield _make
    app.dependency_overrides.clear()
