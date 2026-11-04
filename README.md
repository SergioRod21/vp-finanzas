# VP Finanzas

Portal interno para la Vicepresidencia de Finanzas: estructura organizacional, acceso por rol y departamento, y un proceso de negocio con auditoría.

> Proyecto en desarrollo. Por ahora están disponibles la base de datos y la base de la API.

## Requisitos

- Docker con Docker Compose v2
- Solo para ejecutar los tests del backend: Python 3.13

## Levantar el proyecto

1. Crear el archivo de variables de entorno y completar las contraseñas:

   ```bash
   cp .env.example .env
   openssl rand -hex 24   # ejecutarlo una vez por cada contraseña
   ```

   | Variable | Descripción |
   |---|---|
   | `POSTGRES_DB` | Nombre de la base de datos |
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` | Administrador. Solo inicializa la base de datos |
   | `APP_DB_USER` / `APP_DB_PASSWORD` | Usuario de la aplicación, con privilegios mínimos. Lo usa el backend |
   | `DB_PORT` / `BACKEND_PORT` | Puertos del host en `127.0.0.1` (solo desarrollo) |

   Los valores se eligen libremente: PostgreSQL crea la base de datos y los usuarios con ellos la primera vez que arranca. Usa contraseñas con solo letras y números (como las que genera `openssl rand -hex`), porque forman parte de la URL de conexión del backend.

2. Levantar los contenedores:

   ```bash
   docker compose up -d --build
   ```

   | Servicio | Contenido |
   |---|---|
   | `db` | PostgreSQL 17. Al iniciar con el volumen vacío ejecuta en orden los scripts de `db/` |
   | `backend` | API FastAPI. Se conecta a la base de datos como el usuario de la aplicación |

   | Script de `db/` | Contenido |
   |---|---|
   | `00-app-user.sql` | Usuario de la aplicación y sus permisos |
   | `01-schema.sql` | Tablas, restricciones e índices |
   | `02-seed.sql` | Datos ficticios: 4 departamentos y 40 colaboradores |

3. Verificar:

   ```bash
   curl http://localhost:8000/api/health   # {"status":"ok"}
   docker compose exec db psql -U vp_admin -d vp_finanzas -c "SELECT count(*) FROM colaborador;"   # 40
   ```

   Documentación interactiva de la API (Swagger): <http://localhost:8000/docs>

En desarrollo, el backend se recarga automáticamente al guardar cambios en `backend/app/`, sin reconstruir la imagen.

### Reiniciar la base de datos

Los scripts de `db/` **solo se ejecutan cuando el volumen está vacío**. Después de modificarlos, o de cambiar las credenciales en `.env`:

```bash
docker compose down -v   # borra el volumen y TODOS los datos
docker compose up -d --build
```

## Tests del backend

Los tests no necesitan la base de datos: reemplazan la sesión por una falsa.

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

## Documentación

- [Modelo de datos](docs/modelo-datos/erd.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
- [Registro de uso de AI](docs/ai-log/README.md)
