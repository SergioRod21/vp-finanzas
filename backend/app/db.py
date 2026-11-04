import os
from collections.abc import Iterator

from sqlmodel import Session, create_engine

# Ejemplo: postgresql+psycopg://vp_app:<password>@db:5432/vp_finanzas
# Las tablas las crea db/01-schema.sql: aquí no se llama a create_all().
engine = create_engine(os.environ["DATABASE_URL"], pool_pre_ping=True)


def get_session() -> Iterator[Session]:
    with Session(engine) as session:
        yield session
