"""Matriz de permisos (S3) contra PostgreSQL real y los datos del seed.

Cada test llama al mismo endpoint como los tres roles, autenticándose con los
usuarios de demostración. Requieren la base de datos levantada:

    RUN_INTEGRATION=1 DATABASE_URL=postgresql+psycopg://vp_app:<password>@localhost:5432/vp_finanzas \\
    SEED_USER_PASSWORD=<password> pytest -m integration
"""

import pytest

from tests.integration.conftest import CORREOS

pytestmark = pytest.mark.integration

CAMPOS_RESUMEN = {"colaborador_id", "nombre", "apellido", "correo", "cargo"}


@pytest.fixture(scope="module")
def ids(clientes):
    """IDs de referencia, obtenidos con el administrador."""
    colaboradores = clientes["admin"].get("/api/colaboradores").json()
    por_correo = {c["correo"]: c for c in colaboradores}
    cargos = clientes["admin"].get("/api/cargos").json()
    return {
        "tesoreria": por_correo[CORREOS["jefe"]]["departamento_id"],
        "planificacion": por_correo[CORREOS["admin"]]["departamento_id"],
        "colega_activo": por_correo["natalia.briceno@vpfinanzas.example"]["colaborador_id"],
        "colega_inactivo": por_correo["diego.alcala@vpfinanzas.example"]["colaborador_id"],
        "de_otro_depto": por_correo["valeria.montiel@vpfinanzas.example"]["colaborador_id"],
        "cargo_propio": next(c["cargo_id"] for c in cargos if c["titulo"] == "Analista Senior de Tesorería"),
        "cargo_mismo_depto": next(c["cargo_id"] for c in cargos if c["titulo"] == "Gerente de Tesorería"),
        "cargo_otro_depto": next(c["cargo_id"] for c in cargos if c["titulo"] == "Contador Senior"),
    }


# --- Colaboradores: listar -------------------------------------------------------------

def test_admin_ve_todos_los_colaboradores_con_ficha_completa(clientes):
    colaboradores = clientes["admin"].get("/api/colaboradores").json()

    assert len(colaboradores) == 40
    assert len({c["departamento"] for c in colaboradores}) == 4
    assert sum(not c["activo"] for c in colaboradores) == 3


def test_admin_puede_filtrar_por_departamento(clientes, ids):
    colaboradores = clientes["admin"].get(
        f"/api/colaboradores?departamento_id={ids['tesoreria']}").json()

    assert len(colaboradores) == 10
    assert {c["departamento"] for c in colaboradores} == {"Tesorería"}


def test_jefe_ve_solo_su_departamento_con_ficha_completa(clientes):
    colaboradores = clientes["jefe"].get("/api/colaboradores").json()

    assert len(colaboradores) == 10
    assert {c["departamento"] for c in colaboradores} == {"Tesorería"}
    assert "fecha_ingreso" in colaboradores[0]


def test_colaborador_ve_solo_companeros_activos_y_datos_de_contacto(clientes):
    colaboradores = clientes["colaborador"].get("/api/colaboradores").json()

    assert len(colaboradores) == 9  # Tesorería tiene 10, uno inactivo
    assert all(set(c) == CAMPOS_RESUMEN for c in colaboradores)


@pytest.mark.parametrize("rol", ["jefe", "colaborador"])
def test_pedir_otro_departamento_responde_404(clientes, ids, rol):
    response = clientes[rol].get(f"/api/colaboradores?departamento_id={ids['planificacion']}")

    assert response.status_code == 404


# --- Colaboradores: detalle ------------------------------------------------------------

@pytest.mark.parametrize("rol, esperado", [("admin", 200), ("jefe", 404), ("colaborador", 404)])
def test_colaborador_de_otro_departamento(clientes, ids, rol, esperado):
    response = clientes[rol].get(f"/api/colaboradores/{ids['de_otro_depto']}")

    assert response.status_code == esperado


@pytest.mark.parametrize("rol, esperado", [("admin", 200), ("jefe", 200), ("colaborador", 404)])
def test_companero_inactivo(clientes, ids, rol, esperado):
    response = clientes[rol].get(f"/api/colaboradores/{ids['colega_inactivo']}")

    assert response.status_code == esperado


def test_colaborador_ve_el_resumen_de_un_companero_activo(clientes, ids):
    response = clientes["colaborador"].get(f"/api/colaboradores/{ids['colega_activo']}")

    assert response.status_code == 200
    assert set(response.json()) == CAMPOS_RESUMEN


# --- Cargos y funciones ----------------------------------------------------------------

@pytest.mark.parametrize("rol, cantidad", [("admin", 16), ("jefe", 4), ("colaborador", 1)])
def test_cantidad_de_cargos_visibles(clientes, rol, cantidad):
    cargos = clientes[rol].get("/api/cargos").json()

    assert len(cargos) == cantidad
    assert all(cargo["funciones"] for cargo in cargos)


def test_colaborador_ve_solo_su_propio_cargo(clientes, ids):
    cargos = clientes["colaborador"].get("/api/cargos").json()

    assert [c["cargo_id"] for c in cargos] == [ids["cargo_propio"]]


@pytest.mark.parametrize(
    "cargo, rol, esperado",
    [
        ("cargo_mismo_depto", "admin", 200),
        ("cargo_mismo_depto", "jefe", 200),
        ("cargo_mismo_depto", "colaborador", 404),
        ("cargo_otro_depto", "admin", 200),
        ("cargo_otro_depto", "jefe", 404),
        ("cargo_otro_depto", "colaborador", 404),
        ("cargo_propio", "colaborador", 200),
    ],
)
def test_detalle_de_cargo_segun_alcance(clientes, ids, cargo, rol, esperado):
    assert clientes[rol].get(f"/api/cargos/{ids[cargo]}").status_code == esperado


# --- Mi perfil ---------------------------------------------------------------------------

@pytest.mark.parametrize(
    "rol, nombre_rol",
    [("admin", "Administrador"), ("jefe", "Jefe de Departamento"), ("colaborador", "Colaborador")],
)
def test_cada_rol_ve_su_propio_perfil(clientes, rol, nombre_rol):
    perfil = clientes[rol].get("/api/perfil").json()

    assert perfil["correo"] == CORREOS[rol]
    assert perfil["rol"] == nombre_rol
