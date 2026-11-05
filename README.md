# VP Finanzas

Portal interno para la Vicepresidencia de Finanzas. Permite consultar la estructura organizacional (departamentos, colaboradores y cargos), da acceso a cada módulo según el rol y el departamento del usuario, y gestiona un proceso de negocio completo: **la aprobación de notas de crédito**.

Todos los datos son ficticios.

## Caso de negocio: notas de crédito

Una nota de crédito reduce lo que un cliente le debe a la empresa (por ejemplo, por una devolución o un error de facturación). Como mueve dinero, **nadie puede emitirla solo**: una persona la solicita y otra, con un rol distinto, la aprueba.

| Quién solicita | Quién aprueba o rechaza |
|---|---|
| Colaborador | El Jefe de su departamento |
| Jefe de Departamento | El Administrador |

```
                 ┌── Aprobar  (el aprobador que corresponde) ──► APROBADA
    PENDIENTE ───┼── Rechazar (el aprobador que corresponde) ──► RECHAZADA   (comentario obligatorio)
        ▲        └── Anular   (quien la solicitó)              ──► ANULADA
        │
  Crear (Colaborador o Jefe de Departamento, para su departamento)
```

- Solo se puede actuar sobre una nota **pendiente**; los demás estados son finales.
- **Quien solicita no puede aprobar** su propia nota. El backend lo impide y la base de datos también, como segunda barrera.
- **Cada acción queda en un historial**: quién, cuándo, qué cambió y por qué. El historial no se puede modificar ni borrar.

### Qué ve cada rol

| Módulo | Administrador | Jefe de Departamento | Colaborador |
|---|---|---|---|
| Mi perfil | ✅ | ✅ | ✅ |
| Colaboradores | Todos los departamentos | Su departamento | Compañeros de su departamento, solo datos de contacto |
| Cargos y funciones | Todos | Los de su departamento | Solo su cargo |
| Notas de crédito | Ve todas; **aprueba y rechaza** las de los Jefes | Ve las de su departamento; **crea** y anula las suyas; **aprueba y rechaza** las de sus colaboradores | Ve las suyas; **crea** y anula las suyas |

Los permisos se validan en el backend en cada petición. El frontend solo oculta lo que no corresponde.

## Stack

| Capa | Tecnología |
|---|---|
| Base de datos | PostgreSQL 17 |
| Backend | Python 3.13 · FastAPI · SQLModel (ORM) · PyJWT · bcrypt |
| Frontend | React 19 · TypeScript · Vite · React Router · TanStack Query · Mantine |
| Infraestructura | Docker Compose · nginx |

La justificación de cada elección está en [decisiones técnicas](docs/decisiones-tecnicas.md).

## Arquitectura

### Contenedores

```
Navegador ──► http://localhost:8080
                    │
         ┌──────────▼──────────┐
         │ frontend (nginx)    │  sirve la aplicación React
         │                     │  y reenvía /api al backend
         └──────────┬──────────┘
                    │  red frontend_net
         ┌──────────▼──────────┐
         │ backend (FastAPI)   │  autenticación, permisos y reglas de negocio
         └──────────┬──────────┘
                    │  red backend_net (interna, sin salida a internet)
         ┌──────────▼──────────┐
         │ db (PostgreSQL)     │  datos y reglas críticas (CHECK, permisos)
         └─────────────────────┘
```

Solo el frontend se publica en el host. El navegador habla con un único origen, así que la cookie de sesión funciona sin configurar CORS. El frontend no puede llegar a la base de datos.

### Backend (`backend/app/`)

Cada capa tiene una sola responsabilidad:

```
routers/       Recibe la petición HTTP y verifica el rol. No tiene reglas de negocio.
   ▼
services/      Reglas de negocio: alcance por departamento, autoría, transacciones.
   ▼
repositories/  Único lugar con SQL.
   ▼
PostgreSQL

domain/        Reglas puras: máquina de estados de las notas y errores de negocio.
core/          Configuración, conexión, seguridad (JWT, bcrypt) y manejo de errores.
```

### Frontend (`frontend/src/`)

Organizado por funcionalidad:

```
app/         Rutas y pantallas.
features/    Un módulo por funcionalidad: perfil, colaboradores, cargos, notas-credito.
             Cada uno con su api/, components/ y types.ts. No se importan entre sí.
components/  Componentes compartidos: layout, mensajes de carga y error.
lib/         Cliente HTTP (único lugar que llama a la API), sesión y matriz de permisos.
```

## Cómo ejecutarlo

Requisito: **Docker con Docker Compose v2**.

### Opción 1: con las credenciales de ejemplo (recomendada para probar)

```bash
git clone https://github.com/SergioRod21/vp-finanzas.git
cd vp-finanzas
cp .env.example .env
docker compose up -d --build
```

Abrir <http://localhost:8080> e iniciar sesión con un [usuario de prueba](#usuarios-de-prueba).

`.env.example` trae valores listos para usar en tu máquina. **Son públicos: no los uses en ningún otro entorno.**

### Opción 2: con tus propias credenciales

```bash
cp .env.example .env
```

Edita `.env` y reemplaza estos valores:

| Variable | Qué poner |
|---|---|
| `POSTGRES_PASSWORD` | Contraseña del administrador de la base de datos |
| `APP_DB_PASSWORD` | Contraseña del usuario de la aplicación |
| `JWT_SECRET` | Secreto para firmar las sesiones (mínimo 32 caracteres) |
| `SEED_USER_PASSWORD` | Contraseña común de los usuarios de prueba (mínimo 8 caracteres) |

Puedes generarlos con `openssl rand -hex 32`. Las dos contraseñas de PostgreSQL deben tener solo letras, números y guiones bajos.

Después:

```bash
docker compose up -d --build
```

> Las credenciales se aplican solo al crear la base de datos. Si ya la habías levantado antes, recréala con `docker compose down -v` (borra todos los datos) y vuelve a ejecutar `docker compose up -d --build`.

### Usuarios de prueba

Todos usan la contraseña de `SEED_USER_PASSWORD`. Con los valores de ejemplo es **`Demo.Finanzas.2026`**.

| Rol | Correo | Departamento |
|---|---|---|
| Administrador | `andres.quintero@vpfinanzas.example` | Planificación Financiera |
| Jefe de Departamento | `ricardo.palencia@vpfinanzas.example` | Tesorería |
| Jefe de Departamento | `valeria.montiel@vpfinanzas.example` | Planificación Financiera |
| Jefe de Departamento | `beatriz.oropeza@vpfinanzas.example` | Contraloría |
| Jefe de Departamento | `patricia.velasquez@vpfinanzas.example` | Contabilidad |
| Colaborador | `elena.carvajal@vpfinanzas.example` | Tesorería |
| Colaborador | `mariana.ochoa@vpfinanzas.example` | Planificación Financiera |
| Colaborador | `oscar.marcano@vpfinanzas.example` | Contraloría |
| Colaborador | `manuel.alfonzo@vpfinanzas.example` | Contabilidad |

Para comprobar que el login se rechaza: `tomas.villalba@vpfinanzas.example` (ya no trabaja en la VP) y `sofia.bracho@vpfinanzas.example` (acceso desactivado).

### Recorrido sugerido (5 minutos)

1. Entra como **Colaboradora de Tesorería** (`elena.carvajal`) → Mis notas de crédito → crea una nota. El detalle indica que la aprueba el Jefe de Departamento.
2. Cierra sesión y entra como **Jefe de Tesorería** (`ricardo.palencia`) → abre la nota → apruébala o recházala.
3. Revisa el **historial** de la nota: aparecen la creación y la resolución, con usuario, fecha y comentario.
4. Como Jefe, crea una nota propia. Esa la aprueba el **Administrador** (`andres.quintero`): el Jefe no puede aprobarla, y el Administrador no puede aprobar las notas de los colaboradores.

## Desarrollo

Con los contenedores levantados:

- **Documentación de la API (Swagger):** <http://localhost:8000/docs>
- **Backend:** se recarga solo al guardar cambios en `backend/app/`.
- **Frontend con recarga instantánea:**

  ```bash
  cd frontend
  npm install
  npm run dev   # http://localhost:5173
  ```

- **Tests del backend:**

  ```bash
  cd backend
  python -m venv .venv && source .venv/bin/activate
  pip install -r requirements-dev.txt
  pytest
  ```

  Los tests de integración contra la base de datos real se activan con `RUN_INTEGRATION=1` (ver `backend/tests/integration/`).

## Documentación

- [Decisiones técnicas](docs/decisiones-tecnicas.md): stack, modelo de datos, proceso de negocio, seguridad y limitaciones.
- [Modelo de datos](docs/modelo-datos/erd.md): diagrama y diccionario de tablas.
- [Registro de uso de AI](docs/ai-log/README.md): prompts, decisiones y errores detectados.
