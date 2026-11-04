# VP Finanzas

Portal interno para la Vicepresidencia de Finanzas: estructura organizacional, acceso por rol y departamento, y un proceso de negocio con auditoría.

> Proyecto en desarrollo. La API está completa: autenticación, módulos de consulta (Mi perfil, Colaboradores, Cargos y funciones) y el flujo de aprobación de notas de crédito. Falta el frontend.

## Requisitos

- Docker con Docker Compose v2
- Solo para desarrollo del frontend fuera de Docker: Node.js 22
- Solo para ejecutar los tests del backend: Python 3.13

## Levantar el proyecto

1. Crear el archivo de variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Los valores de `.env.example` funcionan tal cual para desarrollo local. **Son públicos: no los uses en ningún otro entorno** (ver la decisión S4 en [decisiones técnicas](docs/decisiones-tecnicas.md)).

   | Variable | Descripción |
   |---|---|
   | `APP_ENV` | `development` o `production`. En `production`, el backend no arranca con el `JWT_SECRET` de ejemplo |
   | `POSTGRES_DB` | Nombre de la base de datos |
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` | Administrador. Solo inicializa la base de datos |
   | `APP_DB_USER` / `APP_DB_PASSWORD` | Usuario de la aplicación, con privilegios mínimos. Lo usa el backend |
   | `JWT_SECRET` | Secreto para firmar las sesiones (mínimo 32 caracteres) |
   | `JWT_EXPIRE_MINUTES` | Duración de la sesión en minutos (por defecto 60) |
   | `SEED_USER_PASSWORD` | Contraseña común de los [usuarios de prueba](#usuarios-de-prueba) |
   | `FRONTEND_PORT` | Puerto del host en `127.0.0.1` donde se publica el portal (por defecto 8080) |
   | `DB_PORT` / `BACKEND_PORT` | Puertos del host en `127.0.0.1` (solo desarrollo) |

   Para usar valores propios, genéralos con `openssl rand -hex 32`. Las contraseñas de PostgreSQL deben tener solo letras, números y guiones bajos, porque forman parte de la URL de conexión del backend.

2. Levantar los contenedores:

   ```bash
   docker compose up -d --build
   ```

   | Servicio | Contenido |
   |---|---|
   | `db` | PostgreSQL 17. Al iniciar con el volumen vacío ejecuta en orden los scripts de `db/` |
   | `backend` | API FastAPI. Se conecta a la base de datos como el usuario de la aplicación |
   | `frontend` | React compilado y servido por nginx, que además reenvía `/api` al backend. **Es el único servicio publicado** |

   | Script de `db/` | Contenido |
   |---|---|
   | `00-app-user.sql` | Usuario de la aplicación y sus permisos |
   | `01-schema.sql` | Tablas, restricciones e índices |
   | `02-seed.sql` | Datos ficticios: 4 departamentos y 40 colaboradores |
   | `03-notas-credito.sql` | Tablas del módulo de notas de crédito, con sus reglas de negocio |
   | `04-seed-notas-credito.sql` | Catálogo de motivos de nota de crédito |
   | `05-seed-usuarios.sql` | Usuarios de prueba, con la contraseña de `SEED_USER_PASSWORD` |
   | `06-seed-notas-credito-ejemplo.sql` | 8 notas de crédito de ejemplo en los cuatro estados, con su historial |

3. Abrir el portal en <http://localhost:8080>.

   Verificación desde la terminal:

   ```bash
   curl http://localhost:8080/api/health   # {"status":"ok"}
   docker compose exec db psql -U vp_admin -d vp_finanzas -c "SELECT count(*) FROM colaborador;"   # 40
   ```

   Documentación interactiva de la API (Swagger, solo en desarrollo): <http://localhost:8000/docs>

En desarrollo, el backend se recarga automáticamente al guardar cambios en `backend/app/`, sin reconstruir la imagen.

### Frontend en modo desarrollo

Para trabajar en el frontend con recarga instantánea, con los contenedores levantados:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173, con /api reenviado al backend en localhost:8000
```

El código siempre llama a rutas relativas (`/api/...`): en desarrollo las reenvía el servidor de Vite y en Docker, nginx.

## Usuarios de prueba

Todos usan la contraseña definida en `SEED_USER_PASSWORD` (en `.env.example`: `Demo.Finanzas.2026`). El login es con el correo, en `POST /api/auth/login` (se puede probar desde <http://localhost:8000/docs>). La sesión queda en una cookie `httpOnly`; `GET /api/auth/me` devuelve el usuario autenticado y `POST /api/auth/logout` la cierra.

| Rol | Correo | Departamento |
|---|---|---|
| Administrador | `andres.quintero@vpfinanzas.example` | Planificación Financiera |
| Jefe de Departamento | `valeria.montiel@vpfinanzas.example` | Planificación Financiera |
| Jefe de Departamento | `ricardo.palencia@vpfinanzas.example` | Tesorería |
| Jefe de Departamento | `beatriz.oropeza@vpfinanzas.example` | Contraloría |
| Jefe de Departamento | `patricia.velasquez@vpfinanzas.example` | Contabilidad |
| Colaborador | `mariana.ochoa@vpfinanzas.example` | Planificación Financiera |
| Colaborador | `elena.carvajal@vpfinanzas.example` | Tesorería |
| Colaborador | `oscar.marcano@vpfinanzas.example` | Contraloría |
| Colaborador | `manuel.alfonzo@vpfinanzas.example` | Contabilidad |

Dos usuarios existen para probar que el login se rechaza:

| Caso | Correo |
|---|---|
| Colaborador que ya no trabaja en la VP (colaborador inactivo) | `tomas.villalba@vpfinanzas.example` |
| Acceso al portal desactivado (usuario inactivo) | `sofia.bracho@vpfinanzas.example` |

### Reiniciar la base de datos

Los scripts de `db/` **solo se ejecutan cuando el volumen está vacío**. Después de modificarlos, o de cambiar las credenciales en `.env`:

```bash
docker compose down -v   # borra el volumen y TODOS los datos
docker compose up -d --build
```

## API

Todos los endpoints, salvo `health` y `login`, requieren sesión. Qué ve cada rol está definido en la matriz de permisos (decisión S3 en [decisiones técnicas](docs/decisiones-tecnicas.md)). Un recurso de otro departamento responde 404.

| Endpoint | Administrador | Jefe de Departamento | Colaborador |
|---|---|---|---|
| `GET /api/health` | Público | Público | Público |
| `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/me` | ✅ | ✅ | ✅ |
| `GET /api/perfil` | Su perfil | Su perfil | Su perfil |
| `GET /api/colaboradores[?departamento_id=]` · `GET /api/colaboradores/{id}` | Todos, ficha completa | Su departamento, ficha completa | Compañeros activos de su departamento, solo datos de contacto |
| `GET /api/cargos[?departamento_id=]` · `GET /api/cargos/{id}` | Todos | Su departamento | Solo su cargo |
| `GET /api/motivos-nota-credito` | ✅ | ✅ | ❌ |
| `GET /api/notas-credito[?estado=]` · `GET /api/notas-credito/{id}` · `GET /api/notas-credito/{id}/historial` | Todas | Su departamento | ❌ |
| `POST /api/notas-credito` | ❌ | Para su departamento | ❌ |
| `POST /api/notas-credito/{id}/aprobar` · `POST /api/notas-credito/{id}/rechazar` (comentario obligatorio) | Las que no solicitó | ❌ | ❌ |
| `POST /api/notas-credito/{id}/anular` | ❌ | Solo las propias y pendientes | ❌ |

Códigos de error: **401** sin sesión, **403** rol sin permiso, **404** recurso inexistente o de otro departamento, **409** acción no válida para el estado actual de la nota (por ejemplo, aprobar una nota ya rechazada), **422** datos inválidos. Todas las respuestas de error tienen la forma `{"detail": "..."}`.

## Tests del backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
pytest
```

- **Tests unitarios:** no necesitan la base de datos; reemplazan la sesión y los servicios por versiones falsas.
- **Tests de integración** (`tests/integration/`): verifican la matriz de permisos contra PostgreSQL real, autenticándose con los usuarios de prueba. Se omiten salvo que se indique `RUN_INTEGRATION=1`. Con los contenedores levantados:

  ```bash
  set -a; source ../.env; set +a
  RUN_INTEGRATION=1 \
  DATABASE_URL="postgresql+psycopg://$APP_DB_USER:$APP_DB_PASSWORD@localhost:${DB_PORT:-5432}/$POSTGRES_DB" \
  pytest
  ```

## Documentación

- [Modelo de datos](docs/modelo-datos/erd.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
- [Registro de uso de AI](docs/ai-log/README.md)
