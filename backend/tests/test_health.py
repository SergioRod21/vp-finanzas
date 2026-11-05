from sqlalchemy.exc import OperationalError

from tests.conftest import FakeSession


def test_health_ok(make_client):
    response = make_client(FakeSession()).get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_base_de_datos_caida_responde_503(make_client):
    error = OperationalError("SELECT 1", {}, Exception("connection refused"))

    response = make_client(FakeSession(error)).get("/api/health")

    assert response.status_code == 503
    assert response.json() == {"detail": "Servicio no disponible temporalmente"}
