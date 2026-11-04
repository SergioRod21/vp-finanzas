"""Tests de las reglas de alcance (S3) y de la dependencia require_roles."""

from typing import Annotated

import pytest
from fastapi import Depends, FastAPI
from fastapi.testclient import TestClient

from app.core.roles import RolNombre
from app.dependencies import get_current_user, require_roles
from app.models import UsuarioActual
from app.services.acceso import departamento_en_alcance, resolver_filtro_departamento
from tests.usuarios import ADMIN, COLABORADOR, JEFE

# --- alcance por departamento --------------------------------------------------------


def test_administrador_no_tiene_limite_de_departamento():
    assert departamento_en_alcance(ADMIN) is None


@pytest.mark.parametrize("usuario", [JEFE, COLABORADOR])
def test_jefe_y_colaborador_se_limitan_a_su_departamento(usuario):
    assert departamento_en_alcance(usuario) == usuario.departamento_id


@pytest.mark.parametrize("solicitado, esperado", [(None, None), (3, 3)])
def test_administrador_usa_el_filtro_pedido(solicitado, esperado):
    assert resolver_filtro_departamento(ADMIN, solicitado) == (True, esperado)


@pytest.mark.parametrize("usuario", [JEFE, COLABORADOR])
def test_sin_filtro_se_aplica_su_departamento(usuario):
    assert resolver_filtro_departamento(usuario, None) == (True, usuario.departamento_id)


@pytest.mark.parametrize("usuario", [JEFE, COLABORADOR])
def test_pedir_otro_departamento_no_esta_permitido(usuario):
    assert resolver_filtro_departamento(usuario, 99) == (False, None)


# --- require_roles -------------------------------------------------------------------

app_prueba = FastAPI()


@app_prueba.get("/solo-admin")
def solo_admin(
    usuario: Annotated[UsuarioActual, Depends(require_roles(RolNombre.ADMINISTRADOR))],
):
    return {"ok": True}


@app_prueba.get("/admin-o-jefe")
def admin_o_jefe(
    usuario: Annotated[
        UsuarioActual,
        Depends(require_roles(RolNombre.ADMINISTRADOR, RolNombre.JEFE_DEPARTAMENTO)),
    ],
):
    return {"ok": True}


def _cliente_como(usuario: UsuarioActual) -> TestClient:
    app_prueba.dependency_overrides[get_current_user] = lambda: usuario
    return TestClient(app_prueba)


@pytest.mark.parametrize(
    "ruta, usuario, esperado",
    [
        ("/solo-admin", ADMIN, 200),
        ("/solo-admin", JEFE, 403),
        ("/solo-admin", COLABORADOR, 403),
        ("/admin-o-jefe", ADMIN, 200),
        ("/admin-o-jefe", JEFE, 200),
        ("/admin-o-jefe", COLABORADOR, 403),
    ],
)
def test_require_roles(ruta, usuario, esperado):
    response = _cliente_como(usuario).get(ruta)

    assert response.status_code == esperado
    if esperado == 403:
        assert response.json() == {"detail": "No tiene permisos para realizar esta acción"}
