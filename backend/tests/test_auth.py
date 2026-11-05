"""Tests de los endpoints de autenticación.

El servicio se reemplaza para no depender de PostgreSQL. La lógica de consulta y
validación del servicio se verifica contra la base de datos real (ver README).
"""

import pytest

from app.core.config import SESSION_COOKIE_NAME
from app.core.security import create_access_token
from app.models import UsuarioActual
from app.services import auth_service
from tests.conftest import FakeSession

JEFE = UsuarioActual(
    usuario_id=3,
    colaborador_id=11,
    correo="ricardo.palencia@vpfinanzas.example",
    nombre="Ricardo",
    apellido="Palencia",
    rol="Jefe de Departamento",
    cargo_id=5,
    departamento_id=2,
    departamento="Tesorería",
)


@pytest.fixture
def client(make_client):
    return make_client(FakeSession())


@pytest.fixture
def credenciales_validas(monkeypatch):
    def autenticar(session, correo, password):
        return JEFE if (correo, password) == (JEFE.correo, "clave-correcta") else None

    monkeypatch.setattr(auth_service, "autenticar", autenticar)


@pytest.fixture
def usuario_activo(monkeypatch):
    monkeypatch.setattr(
        auth_service, "obtener_usuario_activo",
        lambda session, usuario_id: JEFE if usuario_id == JEFE.usuario_id else None,
    )


# --- login -------------------------------------------------------------------

def test_login_correcto_devuelve_usuario_y_cookie_segura(client, credenciales_validas):
    response = client.post("/api/auth/login",
                           json={"correo": JEFE.correo, "password": "clave-correcta"})

    assert response.status_code == 200
    assert response.json() == JEFE.model_dump()
    assert "hashed_password" not in response.text

    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f"{SESSION_COOKIE_NAME}=")
    assert "HttpOnly" in cookie
    assert "SameSite=strict" in cookie
    assert "Path=/api" in cookie
    assert "Max-Age=3600" in cookie


def test_login_incorrecto_responde_401_generico_sin_cookie(client, credenciales_validas):
    response = client.post("/api/auth/login",
                           json={"correo": JEFE.correo, "password": "clave-incorrecta"})

    assert response.status_code == 401
    assert response.json() == {"detail": "Credenciales inválidas"}
    assert "set-cookie" not in response.headers


def test_login_con_datos_invalidos_responde_422(client):
    response = client.post("/api/auth/login", json={"correo": "", "password": ""})

    assert response.status_code == 422


# --- me ------------------------------------------------------------------------

def test_me_sin_cookie_responde_401(client):
    response = client.get("/api/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "No autenticado"}


def test_me_con_cookie_valida_devuelve_el_usuario(client, usuario_activo):
    client.cookies.set(SESSION_COOKIE_NAME, create_access_token(JEFE.usuario_id))

    response = client.get("/api/auth/me")

    assert response.status_code == 200
    assert response.json() == JEFE.model_dump()


def test_me_con_token_invalido_responde_401(client, usuario_activo):
    client.cookies.set(SESSION_COOKIE_NAME, "token-falso")

    assert client.get("/api/auth/me").status_code == 401


def test_me_de_usuario_desactivado_responde_401(client, usuario_activo):
    # El token es válido, pero el servicio ya no encuentra al usuario como activo.
    client.cookies.set(SESSION_COOKIE_NAME, create_access_token(999))

    assert client.get("/api/auth/me").status_code == 401


# --- logout ----------------------------------------------------------------------

def test_logout_borra_la_cookie(client):
    response = client.post("/api/auth/logout")

    assert response.status_code == 204
    cookie = response.headers["set-cookie"]
    assert cookie.startswith(f'{SESSION_COOKIE_NAME}=""')
    assert "Max-Age=0" in cookie
    assert "Path=/api" in cookie
