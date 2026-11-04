"""Conexión a PostgreSQL.

Las tablas las crea db/01-schema.sql: aquí NUNCA se llama a create_all().
"""

from collections.abc import Iterator
from typing import Annotated

from fastapi import Depends
from sqlmodel import Session, create_engine

from app.core.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session


# Uso en los endpoints:  def endpoint(session: SessionDep): ...
SessionDep = Annotated[Session, Depends(get_session)]
