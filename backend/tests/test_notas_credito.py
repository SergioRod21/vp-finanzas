"""Capa HTTP del módulo de notas de crédito, sin base de datos.

Verifica: el rol requerido por cada endpoint (403), la validación de los datos de
entrada (422) y la traducción de los errores de negocio a códigos HTTP. Las reglas
contra datos reales se verifican en tests/integration/test_notas_credito.py.
"""

from datetime import UTC, datetime
from decimal import Decimal

import pytest
from sqlalchemy.exc import IntegrityError

from app.dependencies import get_current_user
from app.domain.errores import AccesoDenegado, DatosInvalidos, NoEncontrado, TransicionInvalida
from app.main import app
from app.models.nota_credito_public import NotaCreditoPublic
from app.services import nota_credito_service
from tests.conftest import FakeSession
from tests.usuarios import ADMIN, COLABORADOR, JEFE

NOTA = NotaCreditoPublic(
    nota_credito_id=1, numero="NC-000001", monto=Decimal("1250.00"), detalle="Lote dañado",
    estado="PENDIENTE", motivo_nota_credito_id=1, motivo="Devolución de mercancía",
    departamento_id=2, departamento="Tesorería", solicitante_id=3, solicitante="Ricardo Palencia",
    resolutor_id=None, resolutor=None,
    creada_en=datetime(2026, 11, 4, tzinfo=UTC), actualizada_en=datetime(2026, 11, 4, tzinfo=UTC),
)
CREAR = {"motivo_nota_credito_id": 1, "monto": "1250.00", "detalle": "Lote dañado"}


@pytest.fixture
def client_como(make_client, monkeypatch):
    # Servicio falso: cualquier operación permitida devuelve la nota de ejemplo.
    for funcion in ("crear", "obtener", "aprobar", "rechazar", "anular"):
        monkeypatch.setattr(nota_credito_service, funcion, lambda *a, **k: NOTA)
    for funcion in ("listar", "historial", "listar_motivos"):
        monkeypatch.setattr(nota_credito_service, funcion, lambda *a, **k: [])

    def _client(usuario):
        cliente = make_client(FakeSession())
        app.dependency_overrides[get_current_user] = lambda: usuario
        return cliente

    return _client


# --- Rol requerido por endpoint (matriz S3) ----------------------------------------------

PETICIONES = {
    "motivos": ("get", "/api/motivos-nota-credito", None),
    "listar": ("get", "/api/notas-credito", None),
    "detalle": ("get", "/api/notas-credito/1", None),
    "historial": ("get", "/api/notas-credito/1/historial", None),
    "crear": ("post", "/api/notas-credito", CREAR),
    "aprobar": ("post", "/api/notas-credito/1/aprobar", {}),
    "rechazar": ("post", "/api/notas-credito/1/rechazar", {"comentario": "Fuera de plazo"}),
    "anular": ("post", "/api/notas-credito/1/anular", {}),
}

# peticion → (Administrador, Jefe, Colaborador)
ESPERADO = {
    "motivos": (200, 200, 403),
    "listar": (200, 200, 403),
    "detalle": (200, 200, 403),
    "historial": (200, 200, 403),
    "crear": (403, 201, 403),
    "aprobar": (200, 403, 403),
    "rechazar": (200, 403, 403),
    "anular": (403, 200, 403),
}


@pytest.mark.parametrize("peticion", PETICIONES)
@pytest.mark.parametrize("indice, usuario", [(0, ADMIN), (1, JEFE), (2, COLABORADOR)])
def test_rol_requerido_por_endpoint(client_como, peticion, indice, usuario):
    metodo, ruta, cuerpo = PETICIONES[peticion]
    cliente = client_como(usuario)

    response = getattr(cliente, metodo)(ruta, json=cuerpo) if cuerpo is not None \
        else getattr(cliente, metodo)(ruta)

    assert response.status_code == ESPERADO[peticion][indice]


def test_sin_sesion_responde_401(make_client):
    assert make_client(FakeSession()).get("/api/notas-credito").status_code == 401


# --- Validación de entrada -----------------------------------------------------------------

@pytest.mark.parametrize(
    "cambio",
    [
        {"monto": "0"},
        {"monto": "-10"},
        {"monto": "10.123"},          # más de 2 decimales
        {"monto": "1000000000000"},   # más de 14 dígitos en total
        {"detalle": "   "},           # solo espacios
        {"detalle": "x" * 501},
        {"motivo_nota_credito_id": "abc"},
    ],
)
def test_crear_con_datos_invalidos_responde_422(client_como, cambio):
    response = client_como(JEFE).post("/api/notas-credito", json={**CREAR, **cambio})

    assert response.status_code == 422


def test_rechazar_sin_comentario_responde_422(client_como):
    cliente = client_como(ADMIN)

    assert cliente.post("/api/notas-credito/1/rechazar", json={}).status_code == 422
    assert cliente.post("/api/notas-credito/1/rechazar", json={"comentario": "  "}).status_code == 422


def test_aprobar_y_anular_aceptan_cuerpo_vacio(client_como):
    assert client_como(ADMIN).post("/api/notas-credito/1/aprobar").status_code == 200
    assert client_como(JEFE).post("/api/notas-credito/1/anular").status_code == 200


def test_crear_ignora_un_departamento_enviado_por_el_cliente(client_como, monkeypatch):
    recibido = {}

    def crear(session, usuario, datos):
        recibido["datos"] = datos
        return NOTA

    monkeypatch.setattr(nota_credito_service, "crear", crear)
    client_como(JEFE).post("/api/notas-credito", json={**CREAR, "departamento_id": 99})

    assert not hasattr(recibido["datos"], "departamento_id")


# --- Errores de negocio → HTTP ----------------------------------------------------------

@pytest.mark.parametrize(
    "error, codigo",
    [
        (NoEncontrado("Nota de crédito no encontrada"), 404),
        (AccesoDenegado("Solo quien solicitó la nota de crédito puede anularla"), 403),
        (TransicionInvalida("No se puede anular una nota en estado APROBADA"), 409),
        (DatosInvalidos("El motivo indicado no existe"), 422),
    ],
)
def test_errores_de_negocio_se_traducen_a_http(client_como, monkeypatch, error, codigo):
    def falla(*args, **kwargs):
        raise error

    monkeypatch.setattr(nota_credito_service, "anular", falla)
    response = client_como(JEFE).post("/api/notas-credito/1/anular")

    assert response.status_code == codigo
    assert response.json() == {"detail": error.mensaje}


def test_restriccion_de_la_bd_violada_responde_409_sin_detalles_internos(client_como, monkeypatch):
    def falla(*args, **kwargs):
        raise IntegrityError("UPDATE nota_credito ...", {}, Exception("ck_nota_credito_no_autoaprobacion"))

    monkeypatch.setattr(nota_credito_service, "aprobar", falla)
    response = client_como(ADMIN).post("/api/notas-credito/1/aprobar")

    assert response.status_code == 409
    assert response.json() == {"detail": "La operación no cumple una regla del negocio"}
    assert "ck_" not in response.text


@pytest.mark.parametrize("comentario", ["", "   "])
def test_comentario_opcional_en_blanco_se_normaliza_a_none(client_como, monkeypatch, comentario):
    recibido = {}

    def aprobar(session, usuario, nota_id, comentario):
        recibido["comentario"] = comentario
        return NOTA

    monkeypatch.setattr(nota_credito_service, "aprobar", aprobar)
    response = client_como(ADMIN).post("/api/notas-credito/1/aprobar", json={"comentario": comentario})

    assert response.status_code == 200
    assert recibido["comentario"] is None
