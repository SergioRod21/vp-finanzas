"""Tests de los routers de consulta, sin base de datos.

Verifican lo que es responsabilidad de la capa HTTP: exigir sesión, traducir
"fuera de alcance" (NoEncontrado) a 404 y no exponer más campos de los que
corresponden a cada rol. Las
reglas de alcance contra datos reales se verifican en tests/integration/.
"""

from datetime import date

import pytest

from app.dependencies import get_current_user
from app.domain.errores import NoEncontrado
from app.main import app
from app.models import ColaboradorFicha, ColaboradorResumen
from app.services import organizacion_service
from tests.conftest import FakeSession
from tests.usuarios import COLABORADOR, JEFE

ENDPOINTS = [
    "/api/perfil",
    "/api/colaboradores",
    "/api/colaboradores/1",
    "/api/cargos",
    "/api/cargos/1",
]

RESUMEN = ColaboradorResumen(colaborador_id=1, nombre="Elena", apellido="Carvajal",
                             correo="elena@vpfinanzas.example", cargo="Analista")
FICHA = ColaboradorFicha(**RESUMEN.model_dump(), pais="Venezuela",
                         fecha_ingreso=date(2017, 10, 23), activo=True,
                         nivel="Senior", departamento_id=2, departamento="Tesorería")


@pytest.fixture
def client_como(make_client):
    def _client(usuario):
        cliente = make_client(FakeSession())
        app.dependency_overrides[get_current_user] = lambda: usuario
        return cliente

    return _client


@pytest.mark.parametrize("ruta", ENDPOINTS)
def test_endpoints_exigen_sesion(make_client, ruta):
    response = make_client(FakeSession()).get(ruta)

    assert response.status_code == 401


@pytest.mark.parametrize(
    "ruta, funcion, detalle",
    [
        ("/api/colaboradores?departamento_id=9", "listar_colaboradores", "Departamento no encontrado"),
        ("/api/colaboradores/9", "obtener_colaborador", "Colaborador no encontrado"),
        ("/api/cargos?departamento_id=9", "listar_cargos", "Departamento no encontrado"),
        ("/api/cargos/9", "obtener_cargo", "Cargo no encontrado"),
    ],
)
def test_fuera_de_alcance_responde_404(client_como, monkeypatch, ruta, funcion, detalle):
    def fuera_de_alcance(*args, **kwargs):
        raise NoEncontrado(detalle)

    monkeypatch.setattr(organizacion_service, funcion, fuera_de_alcance)

    response = client_como(JEFE).get(ruta)

    assert response.status_code == 404
    assert response.json() == {"detail": detalle}


def test_colaborador_recibe_solo_el_resumen(client_como, monkeypatch):
    monkeypatch.setattr(organizacion_service, "listar_colaboradores", lambda *a, **k: [RESUMEN])

    response = client_como(COLABORADOR).get("/api/colaboradores")

    assert response.status_code == 200
    assert set(response.json()[0]) == {"colaborador_id", "nombre", "apellido", "correo", "cargo"}


def test_jefe_recibe_la_ficha_completa(client_como, monkeypatch):
    monkeypatch.setattr(organizacion_service, "listar_colaboradores", lambda *a, **k: [FICHA])

    response = client_como(JEFE).get("/api/colaboradores")

    assert response.status_code == 200
    assert response.json()[0]["fecha_ingreso"] == "2017-10-23"
