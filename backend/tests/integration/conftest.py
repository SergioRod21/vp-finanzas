"""Fixtures de los tests de integración (PostgreSQL real con los datos del seed)."""

import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

# Usuarios de demostración (db/05-seed-usuarios.sql)
CORREOS = {
    "admin": "andres.quintero@vpfinanzas.example",            # Planificación Financiera
    "jefe": "ricardo.palencia@vpfinanzas.example",            # Tesorería
    "jefe_otro_depto": "valeria.montiel@vpfinanzas.example",  # Planificación Financiera
    "colaborador": "elena.carvajal@vpfinanzas.example",       # Tesorería
}


def pytest_collection_modifyitems(config, items):
    """Los tests de esta carpeta solo corren con RUN_INTEGRATION=1."""
    if os.environ.get("RUN_INTEGRATION"):
        return
    omitir = pytest.mark.skip(reason="requiere RUN_INTEGRATION=1 y la base de datos levantada")
    for item in items:
        if "integration" in item.keywords:
            item.add_marker(omitir)


def iniciar_sesion(correo: str) -> TestClient:
    cliente = TestClient(app)
    response = cliente.post("/api/auth/login", json={
        "correo": correo, "password": os.environ["SEED_USER_PASSWORD"]})
    assert response.status_code == 200, f"login de {correo} falló"
    return cliente


@pytest.fixture(scope="session")
def clientes():
    """Un cliente autenticado por rol, compartido por todos los tests de integración."""
    app.dependency_overrides.clear()
    return {rol: iniciar_sesion(correo) for rol, correo in CORREOS.items()}
