# Decisiones técnicas

## 1. Stack

### 1.1 Backend

- **Decisión:** Python con FastAPI.
- **Alternativas consideradas:** Flask, Django y NestJS.
- **Motivo:**
  - **Modelos de datos tipados:** FastAPI usa Pydantic para declarar la estructura de los datos que entran y salen de cada endpoint. La validación de las solicitudes y el formato de las respuestas quedan definidos en un solo lugar, y los datos que no cumplen el modelo se rechazan antes de llegar a la lógica de negocio.
  - **ORM adaptable al schema existente:** el modelo relacional ya está diseñado y definido en SQL (`db/01-schema.sql`). FastAPI no impone un ORM, así que se puede usar uno (por ejemplo, SQLAlchemy) que **mapee las tablas existentes** en lugar de generarlas. El schema escrito a mano sigue siendo la fuente de verdad.
  - Django se descartó justamente por esto: su ORM y su sistema de migraciones esperan ser los dueños del schema, lo que choca con un modelo diseñado primero en SQL.
  - **NestJS** se descartó por el alcance del proyecto y el tiempo disponible, aunque es una opción más adecuada para esta arquitectura en varios aspectos:
    - **Autenticación integrada en el framework:** módulos oficiales para JWT (`@nestjs/jwt`) y estrategias de login (`@nestjs/passport`).
    - **Guards:** el control de acceso se declara sobre cada endpoint con decoradores (por ejemplo, `@Roles('ADMIN')`), lo que hace explícita y uniforme la verificación de rol y departamento que exige la sección 3.2.
    - **Estructura impuesta** de módulos, controllers y services con inyección de dependencias, que mantiene la separación por capas a medida que el proyecto crece.
    - **Mismo lenguaje que el frontend** (TypeScript), con posibilidad de compartir tipos entre ambos.

- **Contras asumidos:**
  - Cada entidad tiene dos representaciones: el modelo del ORM (tabla) y el modelo de Pydantic (API). Hay que mantenerlas alineadas a mano.
  - FastAPI no incluye autenticación ni panel de administración, como Django: el login y el control de acceso se implementan por cuenta propia.

### 1.2 Frontend

- **Decisión:** React, con Vite como herramienta de build y servidor de desarrollo.
- **Alternativas consideradas:** Angular y Vue.
- **Motivo:**
  - **Experiencia previa:** es el framework que más manejo. Con un plazo acotado, conviene invertir el tiempo en la lógica del portal y no en aprender una herramienta nueva.
  - **Vite** compila rápido y su servidor de desarrollo permite redirigir las llamadas a `/api` hacia el backend. Así el frontend usa rutas relativas desde el principio, sin direcciones del backend escritas en el código.
- **Contras asumidos:** React es una librería de interfaz, no un framework completo como Angular. El ruteo, las llamadas HTTP y los formularios requieren elegir librerías adicionales (por ejemplo, React Router).

### 1.3 Base de datos

- **Decisión:** PostgreSQL.
- **Alternativas consideradas:** MySQL y SQLite.
- **Motivo:**
  - **Despliegue simple en Docker:** la imagen oficial ejecuta automáticamente los scripts de `db/` al iniciar, así que cualquier máquina obtiene la misma base de datos, con schema y datos, con un solo comando.
  - **Funcionalidades del motor:** PostgreSQL resuelve dentro de la base de datos validaciones y controles que de otro modo dependerían solo del backend. En este proyecto ya se usan restricciones `CHECK` con expresiones regulares, columnas `IDENTITY`, comentarios en el catálogo y roles con privilegios por tabla (ver [S1](#s1-usuario-de-base-de-datos-dedicado-para-la-aplicación)).
  - **Open source con licencia permisiva:** PostgreSQL se distribuye bajo la PostgreSQL License, similar a BSD/MIT, que permite usarlo y modificarlo sin costo ni restricciones comerciales. Lo desarrolla una comunidad global y no depende de un único proveedor. 
  - MySQL: también es open source, pero pertenece a Oracle y tiene licencia dual (GPL o comercial).
  - SQLite, el mínimo aceptado por el enunciado, no tiene usuarios ni permisos, así que no permitiría aplicar el principio de mínimo privilegio.
- **Contras asumidos:** requiere un servidor de base de datos en ejecución, a diferencia de SQLite, que es un archivo. Docker mitiga este costo.

## 2. Modelo de datos

Diagrama y diccionario de tablas: [modelo-datos/erd.md](modelo-datos/erd.md).

### Decisiones de diseño

## 3. Proceso de negocio (sección 3.4)

- **Decisión:**
- **Alternativas consideradas:**
- **Motivo:**
- **Contras asumidos:**

## 4. Decisiones de seguridad

### S1. Usuario de base de datos dedicado para la aplicación

- **Decisión:** el backend se conecta a PostgreSQL con un usuario propio (`APP_DB_USER`) que solo puede leer y modificar filas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). No puede crear, alterar ni eliminar tablas, ni crear roles. El usuario administrador (`POSTGRES_USER`) solo se usa para inicializar la base de datos: crear el usuario de la aplicación, el schema y el seed.
- **Alternativa descartada:** que el backend use el usuario administrador. Simplifica la configuración, pero ese usuario es superusuario: una vulnerabilidad en el backend, como una inyección SQL, daría control total sobre la base de datos.
- **Implementación:** `db/00-app-user.sql` crea el usuario y define permisos por defecto (`ALTER DEFAULT PRIVILEGES`) para todas las tablas que el administrador cree después, incluidas las de módulos futuros. El nombre y la contraseña se leen de variables de entorno con `\getenv` de psql, así que ninguna credencial queda en el repositorio.
- **En un despliegue real:**
  - Restringir más las tablas de auditoría: solo `INSERT` y `SELECT`, para que el historial no pueda modificarse ni borrarse desde la aplicación.
  - Gestionar las credenciales con un gestor de secretos (por ejemplo, Docker secrets o el servicio del proveedor cloud) en lugar de un archivo `.env`, y rotarlas periódicamente.

### S2. Mecanismo de sesión

- **Decisión:**
- **Alternativas consideradas:**
- **Motivo:**
- **Contras asumidos:**

### S3. Control de acceso por rol y departamento

- **Decisión:**
- **Alternativas consideradas:**
- **Motivo:**
- **Contras asumidos:**

## 5. Limitaciones conocidas y mejoras futuras
