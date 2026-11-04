from tests.conftest import FakeSession


def test_error_inesperado_responde_500_sin_detalles_internos(make_client):
    session = FakeSession(RuntimeError("detalle interno que no debe filtrarse"))

    response = make_client(session).get("/api/health")

    assert response.status_code == 500
    assert response.json() == {"detail": "Error interno del servidor"}
    assert "detalle interno" not in response.text
    assert "Traceback" not in response.text


def test_ruta_inexistente_responde_404_en_json(make_client):
    response = make_client(FakeSession()).get("/api/no-existe")

    assert response.status_code == 404
    assert response.json() == {"detail": "Not Found"}
