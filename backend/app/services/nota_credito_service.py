"""Lógica de negocio del módulo de notas de crédito.

Aplica la matriz de permisos (S3) y la máquina de estados (domain/nota_credito.py),
y controla las transacciones: cada acción actualiza la nota e inserta su evento de
auditoría en una sola transacción. Si algo falla, no se guarda ninguna de las dos.

El rol general (quién puede usar cada endpoint) lo verifica el router con
require_roles. Aquí se verifican las reglas que dependen de la nota concreta:
alcance por departamento, autoría y estado.
"""

from sqlmodel import Session

from app.domain.errores import AccesoDenegado, DatosInvalidos, NoEncontrado
from app.domain.nota_credito import (
    ACCIONES_DE_RESOLUCION,
    AccionNota,
    EstadoNota,
    NivelAprobacion,
    nivel_aprobacion_para,
    puede_resolver,
    siguiente_estado,
)
from app.models import UsuarioActual
from app.models.nota_credito_public import (
    EventoHistorialPublic,
    MotivoPublic,
    NotaCreditoCrear,
    NotaCreditoPublic,
)
from app.repositories import nota_credito_repository as repo
from app.repositories.nota_credito_repository import AlcanceNotas, NotaConDetalle
from app.services.acceso import alcance_notas_credito

NOTA_NO_ENCONTRADA = "Nota de crédito no encontrada"


def _alcance(usuario: UsuarioActual) -> AlcanceNotas:
    departamento_id, solicitante_id = alcance_notas_credito(usuario)
    return AlcanceNotas(departamento_id=departamento_id, solicitante_id=solicitante_id)


def _a_public(n: NotaConDetalle) -> NotaCreditoPublic:
    return NotaCreditoPublic(
        nota_credito_id=n.nota.nota_credito_id,
        numero=n.nota.numero,
        monto=n.nota.monto,
        detalle=n.nota.detalle,
        estado=n.nota.estado_actual,
        nivel_aprobacion=n.nota.nivel_aprobacion,
        motivo_nota_credito_id=n.nota.motivo_nota_credito_id,
        motivo=n.motivo,
        departamento_id=n.nota.departamento_id,
        departamento=n.departamento,
        solicitante_id=n.nota.solicitante_id,
        solicitante=n.solicitante,
        resolutor_id=n.nota.resolutor_id,
        resolutor=n.resolutor,
        creada_en=n.nota.creada_en,
        actualizada_en=n.nota.actualizada_en,
    )


# --- Consultas -------------------------------------------------------------------------

def listar_motivos(session: Session) -> list[MotivoPublic]:
    return [MotivoPublic.model_validate(m, from_attributes=True) for m in repo.listar_motivos(session)]


def listar(
    session: Session, usuario: UsuarioActual, estado: EstadoNota | None = None
) -> list[NotaCreditoPublic]:
    notas = repo.listar_notas(session, _alcance(usuario), estado)
    return [_a_public(n) for n in notas]


def obtener(session: Session, usuario: UsuarioActual, nota_id: int) -> NotaCreditoPublic:
    nota = repo.obtener_nota(session, nota_id, _alcance(usuario))
    if nota is None:
        raise NoEncontrado(NOTA_NO_ENCONTRADA)
    return _a_public(nota)


def historial(
    session: Session, usuario: UsuarioActual, nota_id: int
) -> list[EventoHistorialPublic]:
    obtener(session, usuario, nota_id)  # 404 si no existe o está fuera de alcance
    return [
        EventoHistorialPublic(
            accion=e.evento.accion,
            estado_anterior=e.evento.estado_anterior,
            estado_nuevo=e.evento.estado_nuevo,
            usuario_id=e.evento.usuario_id,
            usuario=e.usuario,
            comentario=e.evento.comentario,
            ocurrido_en=e.evento.ocurrido_en,
        )
        for e in repo.listar_historial(session, nota_id)
    ]


# --- Acciones --------------------------------------------------------------------------

def crear(session: Session, usuario: UsuarioActual, datos: NotaCreditoCrear) -> NotaCreditoPublic:
    """El Colaborador o el Jefe solicita una nota para SU departamento (nunca para otro).

    El nivel de aprobación se fija aquí, según el rol del solicitante, y no cambia
    aunque después cambie su rol.
    """
    nivel = nivel_aprobacion_para(usuario.rol)
    if not repo.existe_motivo(session, datos.motivo_nota_credito_id):
        raise DatosInvalidos("El motivo indicado no existe")

    nota_id = repo.insertar_nota(
        session,
        solicitante_id=usuario.usuario_id,
        departamento_id=usuario.departamento_id,
        motivo_id=datos.motivo_nota_credito_id,
        monto=datos.monto,
        detalle=datos.detalle,
        nivel_aprobacion=nivel,
    )
    repo.insertar_evento(
        session,
        nota_id=nota_id,
        usuario_id=usuario.usuario_id,
        accion=AccionNota.CREAR,
        estado_anterior=None,
        estado_nuevo=EstadoNota.PENDIENTE,
        comentario=None,
    )
    session.commit()
    return obtener(session, usuario, nota_id)


def aprobar(
    session: Session, usuario: UsuarioActual, nota_id: int, comentario: str | None
) -> NotaCreditoPublic:
    return _aplicar_accion(session, usuario, nota_id, AccionNota.APROBAR, comentario)


def rechazar(
    session: Session, usuario: UsuarioActual, nota_id: int, comentario: str
) -> NotaCreditoPublic:
    return _aplicar_accion(session, usuario, nota_id, AccionNota.RECHAZAR, comentario)


def anular(
    session: Session, usuario: UsuarioActual, nota_id: int, comentario: str | None
) -> NotaCreditoPublic:
    return _aplicar_accion(session, usuario, nota_id, AccionNota.ANULAR, comentario)


_DESCRIPCION_APROBADOR = {
    NivelAprobacion.JEFE_DEPARTAMENTO: "el Jefe de Departamento",
    NivelAprobacion.ADMINISTRADOR: "el Administrador",
}


def _verificar_permiso(
    usuario: UsuarioActual, solicitante_id: int, nivel: str, accion: AccionNota
) -> None:
    es_solicitante = usuario.usuario_id == solicitante_id
    if accion in ACCIONES_DE_RESOLUCION:
        if es_solicitante:
            # Segregación de funciones. La BD lo impide también (ck_nota_credito_no_autoaprobacion).
            raise AccesoDenegado("No puede resolver una nota de crédito que usted solicitó")
        if not puede_resolver(usuario.rol, nivel):
            aprobador = _DESCRIPCION_APROBADOR[NivelAprobacion(nivel)]
            raise AccesoDenegado(f"Esta nota de crédito debe resolverla {aprobador}")
    if accion == AccionNota.ANULAR and not es_solicitante:
        raise AccesoDenegado("Solo quien solicitó la nota de crédito puede anularla")


def _aplicar_accion(
    session: Session,
    usuario: UsuarioActual,
    nota_id: int,
    accion: AccionNota,
    comentario: str | None,
) -> NotaCreditoPublic:
    """Aplica una transición de estado en una sola transacción:

    1. Bloquea la fila de la nota (las acciones simultáneas sobre ella esperan).
    2. Verifica alcance, permiso (autoría y nivel de aprobación) y que la transición sea válida.
    3. Actualiza el estado e inserta el evento de auditoría.
    4. Confirma la transacción.
    """
    nota = repo.bloquear_nota(session, nota_id, _alcance(usuario))
    if nota is None:
        raise NoEncontrado(NOTA_NO_ENCONTRADA)

    _verificar_permiso(usuario, nota.solicitante_id, nota.nivel_aprobacion, accion)
    estado_anterior = nota.estado_actual
    estado_nuevo = siguiente_estado(estado_anterior, accion)  # TransicionInvalida → 409

    resolutor_id = usuario.usuario_id if accion in ACCIONES_DE_RESOLUCION else None
    repo.actualizar_estado(session, nota_id, estado_nuevo, resolutor_id)
    repo.insertar_evento(
        session,
        nota_id=nota_id,
        usuario_id=usuario.usuario_id,
        accion=accion,
        estado_anterior=estado_anterior,
        estado_nuevo=estado_nuevo,
        comentario=comentario,
    )
    session.commit()
    return obtener(session, usuario, nota_id)
