# VP Finanzas

Portal interno para la Vicepresidencia de Finanzas: estructura organizacional, acceso por rol y departamento, y un proceso de negocio con auditoría.

> Proyecto en desarrollo. Por ahora solo está disponible la base de datos.

## Requisitos

- Docker con Docker Compose v2

## Levantar la base de datos

1. Crear el archivo de variables de entorno y completar las contraseñas:

   ```bash
   cp .env.example .env
   openssl rand -hex 24   # ejecutarlo una vez por cada contraseña
   ```

   | Variable | Descripción |
   |---|---|
   | `POSTGRES_DB` | Nombre de la base de datos |
   | `POSTGRES_USER` / `POSTGRES_PASSWORD` | Administrador. Solo inicializa la base de datos |
   | `APP_DB_USER` / `APP_DB_PASSWORD` | Usuario de la aplicación, con privilegios mínimos |
   | `DB_PORT` | Puerto del host en `127.0.0.1` (solo desarrollo) |

   Los valores se eligen libremente: PostgreSQL crea la base de datos y los usuarios con ellos la primera vez que arranca.

2. Levantar el contenedor:

   ```bash
   docker compose up -d db
   ```

   Al iniciar con el volumen vacío, se ejecutan en orden los scripts de `db/`:

   | Script | Contenido |
   |---|---|
   | `00-app-user.sql` | Usuario de la aplicación y sus permisos |
   | `01-schema.sql` | Tablas, restricciones e índices |
   | `02-seed.sql` | Datos ficticios: 4 departamentos y 40 colaboradores |

3. Verificar:

   ```bash
   docker compose exec db psql -U vp_admin -d vp_finanzas -c "SELECT count(*) FROM colaborador;"   # 40
   ```

### Reiniciar la base de datos

Los scripts de `db/` **solo se ejecutan cuando el volumen está vacío**. Después de modificarlos, o de cambiar las credenciales en `.env`:

```bash
docker compose down -v   # borra el volumen y TODOS los datos
docker compose up -d db
```

## Documentación

- [Modelo de datos](docs/modelo-datos/erd.md)
- [Decisiones técnicas](docs/decisiones-tecnicas.md)
- [Registro de uso de AI](docs/ai-log/README.md)
