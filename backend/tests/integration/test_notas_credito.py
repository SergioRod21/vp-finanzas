"""Proceso de notas de crédito de punta a punta, contra PostgreSQL real.

Cada test crea sus propias notas, así que pueden ejecutarse varias veces sobre la
misma base de datos. Los usuarios y sus roles salen de db/05-seed-usuarios.sql.
Hay dos caminos de aprobación (matriz S3):
  - la nota de un Jefe la resuelve el Administrador;
  - la nota de un Colaborador la resuelve el Jefe de su departamento.
"""

import re
from concurrent.futures import ThreadPoolExecutor

import pytest

from tests.integration.conftest import CORREOS, iniciar_sesion

pytestmark = pytest.mark.integration

URL = "/api/notas-credito"


@pytest.fixture(scope="module")
def motivo_id(clientes):
    return clientes["admin"].get("/api/motivos-nota-credito").json()[0]["motivo_nota_credito_id"]


@pytest.fixture
def nueva_nota(clientes, motivo_id):
    """Crea una nota PENDIENTE y devuelve su respuesta. Por defecto la solicita el Jefe de Tesorería."""
    def _crear(solicitante="jefe", **cambios):
        datos = {"motivo_nota_credito_id": motivo_id, "monto": "1520.00",
                 "detalle": "Nota creada por los tests de integración", **cambios}
        response = clientes[solicitante].post(URL, json=datos)
        assert response.status_code == 201, response.text
        return response.json()

    return _crear


def acciones_del_historial(cliente, nota_id):
    return [e["accion"] for e in cliente.get(f"{URL}/{nota_id}/historial").json()]


# --- Creación ----------------------------------------------------------------------------

def test_jefe_crea_una_nota_pendiente_para_su_departamento(clientes, nueva_nota):
    nota = nueva_nota()

    assert re.fullmatch(r"NC-\d{6,}", nota["numero"])
    assert nota["estado"] == "PENDIENTE"
    assert nota["departamento"] == "Tesorería"
    assert nota["solicitante"] == "Ricardo Palencia"
    assert nota["resolutor"] is None
    assert nota["monto"] == "1520.00"
    assert acciones_del_historial(clientes["jefe"], nota["nota_credito_id"]) == ["CREAR"]


def test_el_departamento_lo_define_el_solicitante_no_el_cliente(nueva_nota):
    nota = nueva_nota(departamento_id=1)  # intento de crearla en otro departamento

    assert nota["departamento"] == "Tesorería"


def test_motivo_inexistente_responde_422(clientes):
    response = clientes["jefe"].post(URL, json={
        "motivo_nota_credito_id": 999999, "monto": "10.00", "detalle": "x"})

    assert response.status_code == 422
    assert response.json() == {"detail": "El motivo indicado no existe"}


# --- Aprobación -------------------------------------------------------------------------

def test_ciclo_de_aprobacion_con_auditoria(clientes, nueva_nota):
    nota_id = nueva_nota()["nota_credito_id"]

    # El Jefe no puede aprobar (403 por rol)
    assert clientes["jefe"].post(f"{URL}/{nota_id}/aprobar").status_code == 403

    response = clientes["admin"].post(f"{URL}/{nota_id}/aprobar",
                                      json={"comentario": "Validado con el comprobante"})
    assert response.status_code == 200
    assert response.json()["estado"] == "APROBADA"
    assert response.json()["resolutor"] == "Andrés Quintero"

    historial = clientes["admin"].get(f"{URL}/{nota_id}/historial").json()
    assert [(e["accion"], e["estado_anterior"], e["estado_nuevo"], e["usuario"]) for e in historial] == [
        ("CREAR", None, "PENDIENTE", "Ricardo Palencia"),
        ("APROBAR", "PENDIENTE", "APROBADA", "Andrés Quintero"),
    ]
    assert historial[1]["comentario"] == "Validado con el comprobante"


def test_una_nota_resuelta_no_admite_mas_acciones(clientes, nueva_nota):
    nota_id = nueva_nota()["nota_credito_id"]
    clientes["admin"].post(f"{URL}/{nota_id}/aprobar")

    segunda = clientes["admin"].post(f"{URL}/{nota_id}/rechazar", json={"comentario": "x"})
    anulacion = clientes["jefe"].post(f"{URL}/{nota_id}/anular")

    assert segunda.status_code == 409
    assert anulacion.status_code == 409
    assert acciones_del_historial(clientes["admin"], nota_id) == ["CREAR", "APROBAR"]


def test_aprobaciones_simultaneas_solo_una_prospera(clientes, nueva_nota):
    """Dos aprobaciones a la vez sobre la misma nota: SELECT … FOR UPDATE las serializa."""
    nota_id = nueva_nota()["nota_credito_id"]
    administradores = [iniciar_sesion(CORREOS["admin"]) for _ in range(2)]

    with ThreadPoolExecutor(max_workers=2) as pool:
        codigos = sorted(pool.map(
            lambda cliente: cliente.post(f"{URL}/{nota_id}/aprobar").status_code, administradores))

    assert codigos == [200, 409]
    assert acciones_del_historial(clientes["admin"], nota_id) == ["CREAR", "APROBAR"]


# --- Rechazo y anulación -------------------------------------------------------------------

def test_rechazo_exige_comentario(clientes, nueva_nota):
    nota_id = nueva_nota()["nota_credito_id"]

    assert clientes["admin"].post(f"{URL}/{nota_id}/rechazar", json={}).status_code == 422

    response = clientes["admin"].post(f"{URL}/{nota_id}/rechazar",
                                      json={"comentario": "Fuera del plazo de devolución"})
    assert response.status_code == 200
    assert response.json()["estado"] == "RECHAZADA"


def test_el_solicitante_anula_su_nota_pendiente(clientes, nueva_nota):
    nota_id = nueva_nota()["nota_credito_id"]

    response = clientes["jefe"].post(f"{URL}/{nota_id}/anular",
                                     json={"comentario": "Se corrigió con una refacturación"})

    assert response.status_code == 200
    assert response.json()["estado"] == "ANULADA"
    assert response.json()["resolutor"] is None  # anular no es resolver
    historial = clientes["jefe"].get(f"{URL}/{nota_id}/historial").json()
    assert (historial[-1]["accion"], historial[-1]["usuario"]) == ("ANULAR", "Ricardo Palencia")


# --- Alcance por departamento ---------------------------------------------------------------

def test_jefe_de_otro_departamento_no_ve_ni_actua_sobre_la_nota(clientes, nueva_nota):
    nota_id = nueva_nota()["nota_credito_id"]
    otro_jefe = clientes["jefe_otro_depto"]

    assert otro_jefe.get(f"{URL}/{nota_id}").status_code == 404
    assert otro_jefe.get(f"{URL}/{nota_id}/historial").status_code == 404
    assert otro_jefe.post(f"{URL}/{nota_id}/anular").status_code == 404
    assert clientes["admin"].get(f"{URL}/{nota_id}").status_code == 200


def test_listado_segun_alcance(clientes, nueva_nota):
    nueva_nota()

    del_jefe = clientes["jefe"].get(URL).json()
    del_admin = clientes["admin"].get(URL).json()

    assert del_jefe and {n["departamento"] for n in del_jefe} == {"Tesorería"}
    assert len({n["departamento"] for n in del_admin}) == 4


def test_filtro_por_estado(clientes):
    pendientes = clientes["admin"].get(f"{URL}?estado=PENDIENTE").json()

    assert pendientes and {n["estado"] for n in pendientes} == {"PENDIENTE"}
    assert clientes["admin"].get(f"{URL}?estado=INVENTADO").status_code == 422


def test_historial_de_una_nota_del_seed(clientes):
    nota = next(n for n in clientes["admin"].get(URL).json() if n["numero"] == "NC-000001")

    assert acciones_del_historial(clientes["admin"], nota["nota_credito_id"]) == ["CREAR", "APROBAR"]


# --- Camino del Colaborador: lo resuelve el Jefe de su departamento ---------------------

def test_colaborador_crea_y_su_jefe_aprueba(clientes, nueva_nota):
    nota = nueva_nota(solicitante="colaborador")

    assert nota["nivel_aprobacion"] == "JEFE_DEPARTAMENTO"
    assert nota["departamento"] == "Tesorería"
    assert nota["solicitante"] == "Elena Carvajal"

    response = clientes["jefe"].post(f"{URL}/{nota['nota_credito_id']}/aprobar",
                                     json={"comentario": "Verificado con el cliente"})
    assert response.status_code == 200
    assert (response.json()["estado"], response.json()["resolutor"]) == ("APROBADA", "Ricardo Palencia")
    assert acciones_del_historial(clientes["jefe"], nota["nota_credito_id"]) == ["CREAR", "APROBAR"]


def test_la_nota_de_un_jefe_requiere_al_administrador(nueva_nota):
    assert nueva_nota()["nivel_aprobacion"] == "ADMINISTRADOR"


def test_el_administrador_no_resuelve_la_nota_de_un_colaborador(clientes, nueva_nota):
    nota_id = nueva_nota(solicitante="colaborador")["nota_credito_id"]

    response = clientes["admin"].post(f"{URL}/{nota_id}/aprobar")

    assert response.status_code == 403
    assert response.json() == {"detail": "Esta nota de crédito debe resolverla el Jefe de Departamento"}
    assert acciones_del_historial(clientes["admin"], nota_id) == ["CREAR"]


def test_el_jefe_no_resuelve_la_nota_de_un_jefe(clientes, nueva_nota):
    # La única nota de Jefe que el Jefe de Tesorería ve es la suya: también cubre la autoaprobación.
    nota_id = nueva_nota()["nota_credito_id"]

    response = clientes["jefe"].post(f"{URL}/{nota_id}/rechazar", json={"comentario": "x"})

    assert response.status_code == 403


def test_jefe_de_otro_departamento_no_resuelve_la_nota_de_un_colaborador(clientes, nueva_nota):
    nota_id = nueva_nota(solicitante="colaborador")["nota_credito_id"]

    assert clientes["jefe_otro_depto"].post(f"{URL}/{nota_id}/aprobar").status_code == 404


def test_el_jefe_rechaza_la_nota_de_un_colaborador(clientes, nueva_nota):
    nota_id = nueva_nota(solicitante="colaborador")["nota_credito_id"]

    response = clientes["jefe"].post(f"{URL}/{nota_id}/rechazar",
                                     json={"comentario": "Fuera de la política comercial"})

    assert response.status_code == 200
    assert response.json()["estado"] == "RECHAZADA"


def test_el_colaborador_anula_su_nota_pero_no_la_resuelve(clientes, nueva_nota):
    nota_id = nueva_nota(solicitante="colaborador")["nota_credito_id"]

    assert clientes["colaborador"].post(f"{URL}/{nota_id}/aprobar").status_code == 403

    response = clientes["colaborador"].post(f"{URL}/{nota_id}/anular")
    assert response.status_code == 200
    assert (response.json()["estado"], response.json()["resolutor"]) == ("ANULADA", None)


def test_el_colaborador_solo_ve_sus_propias_notas(clientes, nueva_nota):
    nueva_nota(solicitante="colaborador")
    nota_del_jefe = nueva_nota()["nota_credito_id"]

    propias = clientes["colaborador"].get(URL).json()

    assert propias and {n["solicitante"] for n in propias} == {"Elena Carvajal"}
    assert clientes["colaborador"].get(f"{URL}/{nota_del_jefe}").status_code == 404
    assert clientes["colaborador"].post(f"{URL}/{nota_del_jefe}/anular").status_code == 404
