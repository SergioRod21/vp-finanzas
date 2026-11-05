"""Acceso a datos del módulo de notas de crédito.

Única capa que conoce las tablas y el SQL del módulo. No decide reglas de negocio:
recibe del servicio qué leer o escribir, incluido el alcance por departamento.
No hace commit: la transacción la controla el servicio.
"""

from dataclasses import dataclass
from decimal import Decimal

from sqlalchemy import func, insert, update
from sqlalchemy.orm import aliased
from sqlmodel import Session, col, select

from app.models import Colaborador, Departamento, Usuario
from app.models.nota_credito import MotivoNotaCredito, NotaCredito, NotaCreditoHistorico


@dataclass(frozen=True)
class NotaConDetalle:
    """Una nota con los nombres que la API muestra junto a ella."""

    nota: NotaCredito
    motivo: str
    departamento: str
    solicitante: str
    resolutor: str | None


@dataclass(frozen=True)
class AlcanceNotas:
    """Qué notas puede ver el usuario. Un campo en None significa "sin ese límite"."""

    departamento_id: int | None = None
    solicitante_id: int | None = None


@dataclass(frozen=True)
class EventoConUsuario:
    evento: NotaCreditoHistorico
    usuario: str


# --- Catálogo de motivos ---------------------------------------------------------------

def listar_motivos(session: Session) -> list[MotivoNotaCredito]:
    return list(session.exec(select(MotivoNotaCredito).order_by(MotivoNotaCredito.descripcion)))


def existe_motivo(session: Session, motivo_id: int) -> bool:
    return session.get(MotivoNotaCredito, motivo_id) is not None


# --- Lectura de notas --------------------------------------------------------------------

def _aplicar_alcance(stmt, alcance: AlcanceNotas):
    if alcance.departamento_id is not None:
        stmt = stmt.where(NotaCredito.departamento_id == alcance.departamento_id)
    if alcance.solicitante_id is not None:
        stmt = stmt.where(NotaCredito.solicitante_id == alcance.solicitante_id)
    return stmt


def _consulta_con_detalle(alcance: AlcanceNotas):
    """Nota + motivo + departamento + nombres del solicitante y del resolutor, dentro del alcance."""
    solicitante = aliased(Usuario)
    colab_solicitante = aliased(Colaborador)
    resolutor = aliased(Usuario)
    colab_resolutor = aliased(Colaborador)

    stmt = (
        select(
            NotaCredito,
            MotivoNotaCredito.descripcion,
            Departamento.nombre,
            colab_solicitante.nombre,
            colab_solicitante.apellido,
            colab_resolutor.nombre,
            colab_resolutor.apellido,
        )
        .join(MotivoNotaCredito,
              NotaCredito.motivo_nota_credito_id == MotivoNotaCredito.motivo_nota_credito_id)
        .join(Departamento, NotaCredito.departamento_id == Departamento.departamento_id)
        .join(solicitante, NotaCredito.solicitante_id == solicitante.usuario_id)
        .join(colab_solicitante, solicitante.colaborador_id == colab_solicitante.colaborador_id)
        .outerjoin(resolutor, NotaCredito.resolutor_id == resolutor.usuario_id)
        .outerjoin(colab_resolutor, resolutor.colaborador_id == colab_resolutor.colaborador_id)
    )
    return _aplicar_alcance(stmt, alcance)


def _a_nota_con_detalle(fila) -> NotaConDetalle:
    nota, motivo, departamento, sol_nombre, sol_apellido, res_nombre, res_apellido = fila
    return NotaConDetalle(
        nota=nota,
        motivo=motivo,
        departamento=departamento,
        solicitante=f"{sol_nombre} {sol_apellido}",
        resolutor=f"{res_nombre} {res_apellido}" if res_nombre else None,
    )


def listar_notas(
    session: Session, alcance: AlcanceNotas, estado: str | None
) -> list[NotaConDetalle]:
    stmt = _consulta_con_detalle(alcance)
    if estado is not None:
        stmt = stmt.where(NotaCredito.estado_actual == estado)
    stmt = stmt.order_by(col(NotaCredito.creada_en).desc(), col(NotaCredito.nota_credito_id).desc())
    return [_a_nota_con_detalle(fila) for fila in session.exec(stmt).all()]


def obtener_nota(
    session: Session, nota_id: int, alcance: AlcanceNotas
) -> NotaConDetalle | None:
    fila = session.exec(
        _consulta_con_detalle(alcance).where(NotaCredito.nota_credito_id == nota_id)
    ).first()
    return _a_nota_con_detalle(fila) if fila else None


def bloquear_nota(session: Session, nota_id: int, alcance: AlcanceNotas) -> NotaCredito | None:
    """Lee la nota y bloquea su fila hasta el fin de la transacción (SELECT … FOR UPDATE).

    Si dos usuarios actúan sobre la misma nota a la vez, el segundo espera a que el
    primero termine y ve el estado ya actualizado: la nota no se resuelve dos veces.
    """
    stmt = _aplicar_alcance(select(NotaCredito).where(NotaCredito.nota_credito_id == nota_id), alcance)
    return session.exec(stmt.with_for_update()).first()


def listar_historial(session: Session, nota_id: int) -> list[EventoConUsuario]:
    stmt = (
        select(NotaCreditoHistorico, Colaborador.nombre, Colaborador.apellido)
        .join(Usuario, NotaCreditoHistorico.usuario_id == Usuario.usuario_id)
        .join(Colaborador, Usuario.colaborador_id == Colaborador.colaborador_id)
        .where(NotaCreditoHistorico.nota_credito_id == nota_id)
        .order_by(NotaCreditoHistorico.ocurrido_en, NotaCreditoHistorico.nota_credito_historico_id)
    )
    return [
        EventoConUsuario(evento=evento, usuario=f"{nombre} {apellido}")
        for evento, nombre, apellido in session.exec(stmt).all()
    ]


# --- Escritura ---------------------------------------------------------------------------

def insertar_nota(
    session: Session,
    *,
    solicitante_id: int,
    departamento_id: int,
    motivo_id: int,
    monto: Decimal,
    detalle: str,
    nivel_aprobacion: str,
) -> int:
    """Inserta una nota PENDIENTE. La BD asigna el número, el estado inicial y las fechas."""
    stmt = (
        insert(NotaCredito)
        .values(
            solicitante_id=solicitante_id,
            departamento_id=departamento_id,
            motivo_nota_credito_id=motivo_id,
            monto=monto,
            detalle=detalle,
            nivel_aprobacion=nivel_aprobacion,
        )
        .returning(NotaCredito.nota_credito_id)
    )
    return session.execute(stmt).scalar_one()


def actualizar_estado(
    session: Session, nota_id: int, estado: str, resolutor_id: int | None
) -> None:
    session.execute(
        update(NotaCredito)
        .where(NotaCredito.nota_credito_id == nota_id)
        .values(estado_actual=estado, resolutor_id=resolutor_id, actualizada_en=func.now())
    )


def insertar_evento(
    session: Session,
    *,
    nota_id: int,
    usuario_id: int,
    accion: str,
    estado_anterior: str | None,
    estado_nuevo: str,
    comentario: str | None,
) -> None:
    """Agrega un evento al historial. La tabla solo admite INSERT (append-only)."""
    session.execute(
        insert(NotaCreditoHistorico).values(
            nota_credito_id=nota_id,
            usuario_id=usuario_id,
            accion=accion,
            estado_anterior=estado_anterior,
            estado_nuevo=estado_nuevo,
            comentario=comentario,
        )
    )

