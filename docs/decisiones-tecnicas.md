# Decisiones técnicas

## 1. Stack

### 1.1 Backend

- **Decisión:** Python con FastAPI, usando SQLModel como ORM.
- **Alternativas consideradas:** Flask, Django y NestJS como framework; SQLAlchemy 2.0 y Prisma como ORM.
- **Motivo:**
  - **Modelos de datos tipados:** FastAPI usa Pydantic para declarar la estructura de los datos que entran y salen de cada endpoint. La validación de las solicitudes y el formato de las respuestas quedan definidos en un solo lugar, y los datos que no cumplen el modelo se rechazan antes de llegar a la lógica de negocio.
  - **ORM adaptable al schema existente:** el modelo relacional ya está diseñado y definido en SQL (`db/01-schema.sql`). FastAPI no impone un ORM, así que se usa uno que **mapea las tablas existentes** en lugar de generarlas. El schema escrito a mano sigue siendo la fuente de verdad: nunca se llama a `create_all()`.
  - **SQLModel como ORM:** lo creó el mismo autor de FastAPI y está construido sobre SQLAlchemy y Pydantic. Un mismo modelo sirve como tabla y como esquema de la API, y con el patrón de múltiples modelos (`Base`, tabla, `Create`, `Public`, `Update`) cada entidad declara una sola vez sus campos compartidos. Se adapta con menos fricción a la implementación que SQLAlchemy puro, que exige mantener por separado los modelos del ORM y los de Pydantic.
  - Django se descartó justamente por esto: su ORM y su sistema de migraciones esperan ser los dueños del schema, lo que choca con un modelo diseñado primero en SQL.
  - **NestJS** se descartó por el alcance del proyecto y el tiempo disponible, aunque es una opción más adecuada para esta arquitectura en varios aspectos:
    - **Autenticación integrada en el framework:** módulos oficiales para JWT (`@nestjs/jwt`) y estrategias de login (`@nestjs/passport`).
    - **Guards:** el control de acceso se declara sobre cada endpoint con decoradores (por ejemplo, `@Roles('ADMIN')`), lo que hace explícita y uniforme la verificación de rol y departamento que exige la sección 3.2.
    - **Estructura impuesta** de módulos, controllers y services con inyección de dependencias, que mantiene la separación por capas a medida que el proyecto crece.
    - **Mismo lenguaje que el frontend** (TypeScript), con posibilidad de compartir tipos entre ambos.

- **Contras asumidos:**
  - SQLModel es menos maduro y tiene menos documentación que SQLAlchemy. Para consultas complejas se puede recurrir a SQLAlchemy directamente, porque SQLModel está construido sobre él.
  - Como la clase de la tabla también es un modelo válido para la API, usarla por error como `response_model` expondría todas sus columnas (por ejemplo, `hashed_password`). Regla del proyecto: las respuestas usan siempre los modelos `*Public`.
  - FastAPI no incluye autenticación ni panel de administración, como Django: el login y el control de acceso se implementan por cuenta propia.

### 1.2 Frontend

- **Decisión:** React con TypeScript, compilado con Vite, y tres librerías de apoyo: React Router para el ruteo, TanStack Query para las llamadas a la API y Mantine para los componentes visuales y los formularios.
- **Alternativas consideradas:**
  - Framework: Angular, Vue y Next.js. Next.js se descartó porque su principal ventaja (renderizado en el servidor, SEO) no aplica a un portal interno detrás de un login, y agregaría un segundo servidor que duplica responsabilidades del backend.
  - Llamadas a la API: `fetch` con `useEffect` en cada pantalla, SWR y los *loaders* de React Router.
  - Componentes: MUI, Ant Design y shadcn/ui.
- **Motivo:**
  - **Experiencia previa:** React es el framework que más manejo. Con un plazo acotado, conviene invertir el tiempo en la lógica del portal y no en aprender una herramienta nueva.
  - **Vite** compila rápido y su servidor de desarrollo redirige `/api` al backend, como lo hace nginx en Docker. El frontend usa rutas relativas y comparte origen con la API, así que la cookie de sesión funciona sin CORS.
  - **TanStack Query** maneja la carga, los errores, la caché y la recarga de datos después de cada acción (por ejemplo, el listado y el detalle de una nota se actualizan al aprobarla). Escribir eso a mano con `useEffect` en cada pantalla repite código y es una fuente común de errores, como respuestas que llegan desordenadas.
  - **Mantine** trae listos los componentes que un portal administrativo usa todo el tiempo (tablas, formularios, modales, notificaciones), con una API simple y un tema configurable con los colores de la marca.
- **Arquitectura:** estructura por funcionalidades (*features*), basada en bulletproof-react:
  - `app/` compone la aplicación (router y pantallas); `features/` tiene un módulo por funcionalidad (perfil, colaboradores, cargos, notas de crédito); `components/`, `lib/`, `hooks/` y `utils/` son compartidos.
  - Las importaciones van en una sola dirección (compartido → features → app) y **una feature nunca importa de otra**.
  - Solo `lib/api-client.ts` llama a `fetch`; la matriz de permisos (S3) vive en `lib/authorization.ts`, y el frontend la usa solo para ocultar lo que no corresponde: la seguridad real está en el backend.
- **Contras asumidos:** React es una librería de interfaz, no un framework completo como Angular: el ruteo, el estado del servidor y los formularios dependen de librerías elegidas aparte, que hay que mantener actualizadas.

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

- **El departamento del colaborador sale de su cargo.** El colaborador no tiene su propio `departamento_id`: se obtiene con `colaborador → cargo → departamento`. 
- **`usuario` está separado de `colaborador`.** El colaborador es la ficha laboral; el usuario es el acceso al portal. No todo colaborador necesita entrar, y la contraseña queda aislada de los datos que se muestran en las consultas.
- **Hay dos campos `activo`.** El de `colaborador` indica si la persona sigue trabajando en la VP; el de `usuario`, si puede entrar al portal. Así se puede bloquear el acceso sin dar de baja a la persona. Para iniciar sesión se exigen los dos.
- **El correo es del colaborador**, no del usuario, porque es un dato laboral que todos deben tener. El login usa ese correo.
- **Países, niveles, roles, funciones y motivos son tablas catálogo.** Evitan escribir el mismo valor de formas distintas
- **Cargos y funciones se relacionan con la tabla `cargo_funcion`.** Un cargo tiene varias funciones y una función puede estar en varios cargos
- **La nota de crédito guarda el estado actual y el historial guarda cada cambio.** La tabla de historial solo admite agregar filas: no se puede modificar ni borrar.
- **Las reglas importantes también están en la base de datos**, no solo en el backend: montos mayores que cero, estados válidos, nadie aprueba su propia nota y solo transiciones permitidas en el historial. Si el backend fallara, la base de datos las rechaza igual.

## 3. Proceso de negocio (sección 3.4)

- **Decisión:** opción 2, flujo de aprobación de notas de crédito.
- **Alternativas consideradas:** opción 1 (detector de anomalías en cierres de caja) y un proceso propio.
- **Motivo:**
  - **Relevancia para el negocio:** el contexto del enunciado nombra los procesos de aprobación entre las tareas diarias del equipo de Transformación Financiera. Una nota de crédito reduce lo que un cliente debe, así que mueve dinero: es justo el tipo de operación que una organización financiera no permite ejecutar a una sola persona.
  - **Lógica de negocio que no es CRUD:** el valor del módulo está en sus reglas:
    - Una **máquina de estados** que solo permite transiciones válidas (por ejemplo, una nota aprobada o rechazada no vuelve a cambiar).
    - **Segregación de funciones:** quien solicita no puede aprobar, y el aprobador debe tener un rol distinto.
    - **Autorización contextual:** no basta con el rol; también importan el departamento del usuario y su relación con la solicitud.
  - **Experiencia previa:** he trabajado con máquinas de estados y con funcionalidades segmentadas por rol, que son el núcleo de este proceso. Eso me permite concentrar el tiempo en diseñar bien las reglas y sus pruebas, y no en aprender el patrón.
  - **Auditoría en base de datos:** cada acción queda registrada en una tabla de eventos (quién, cuándo, estado anterior, estado nuevo y comentario), escrita en la misma transacción que el cambio de estado. Es un tipo de registro con el que tengo experiencia, y cumple directamente el requisito de historial visible.
  - **Simplicidad del esquema:** el proceso reutiliza las entidades que ya existen (`usuario`, `rol`, `departamento` y la relación `colaborador → cargo → departamento`) y solo agrega la tabla de notas y la de eventos. El módulo funcional y el control de acceso por rol y departamento (sección 3.2) terminan siendo la misma pieza, en lugar de dos desarrollos separados.
  - **Por qué no la opción 1:** su lógica principal son algoritmos de detección (umbrales, transposición de dígitos, reincidencia), un ejercicio valioso pero que necesita entidades ajenas a la estructura de la VP de Finanzas (tiendas, cajeros y cierres) y se relaciona poco con el control de acceso por departamento que ya está modelado. El esquema crecería más y el módulo quedaría desconectado del resto del portal.
  - **Por qué no un proceso propio:** las opciones del enunciado ya cubren el nivel de exigencia esperado. Proponer otro proceso agregaba el riesgo de tener que demostrar que es equivalente, sin un beneficio claro.
- **Alcance:**
  - Incluido: crear solicitudes, consultarlas según el alcance del rol, aprobarlas, rechazarlas o anularlas con reglas de transición explícitas, e historial completo de auditoría.
  - Fuera del alcance: la integración con un sistema de facturación real, la emisión contable de la nota y los niveles de aprobación según el monto (posible mejora futura).
- **Contras asumidos:**
  - El valor del módulo depende de que las reglas estén bien diseñadas y probadas. Si la máquina de estados o los permisos se implementan de forma superficial, el proceso se reduce a un CRUD con un campo de estado.
  - Requiere prever aprobaciones concurrentes: dos aprobadores actuando sobre la misma nota al mismo tiempo.

## 4. Decisiones de seguridad

### S1. Usuario de base de datos dedicado para la aplicación

- **Decisión:** el backend se conecta a PostgreSQL con un usuario propio (`APP_DB_USER`) que solo puede leer y modificar filas (`SELECT`, `INSERT`, `UPDATE`, `DELETE`). No puede crear, alterar ni eliminar tablas, ni crear roles. El usuario administrador (`POSTGRES_USER`) solo se usa para inicializar la base de datos: crear el usuario de la aplicación, el schema y el seed.
- **Alternativa descartada:** que el backend use el usuario administrador. Simplifica la configuración, pero ese usuario es superusuario: una vulnerabilidad en el backend, como una inyección SQL, daría control total sobre la base de datos.
- **Implementación:** `db/00-app-user.sql` crea el usuario y define permisos por defecto (`ALTER DEFAULT PRIVILEGES`) para todas las tablas que el administrador cree después, incluidas las de módulos futuros. El nombre y la contraseña se leen de variables de entorno con `\getenv` de psql, así que ninguna credencial queda en el repositorio.
- **Restricciones adicionales en el módulo de notas de crédito:** `db/03-notas-credito.sql` le quita al usuario de la aplicación permisos que no necesita:
  - Sobre `nota_credito_historico`, sin `UPDATE` ni `DELETE`: el historial de auditoría solo admite agregar y consultar, así que no se puede modificar ni borrar desde la aplicación.
  - Sobre `nota_credito`, sin `DELETE`: las notas no se borran, se anulan.
- **En un despliegue real:** gestionar las credenciales con un gestor de secretos (por ejemplo, Docker secrets o el servicio del proveedor cloud) en lugar de un archivo `.env`, y rotarlas periódicamente.

### S2. Mecanismo de sesión

- **Decisión:** JWT firmado, enviado en una cookie `httpOnly`. `POST /api/auth/login` valida las credenciales y emite la cookie; el navegador la reenvía en cada petición y una dependencia de FastAPI la valida.
- **Alternativas consideradas:**
  - **Sesión en servidor** (ID opaco en cookie y tabla de sesiones en PostgreSQL): revocación total e inmediata, pero agrega una tabla y su limpieza periódica.
  - **JWT Bearer en el header `Authorization`:** estándar en APIs públicas, pero el frontend tendría que guardar el token. En `localStorage` queda expuesto a XSS; solo en memoria, se pierde al recargar.
  - **Cookie de sesión firmada** (`SessionMiddleware` de Starlette): muy simple, pero su contenido es legible, no permite revocación y está pensada para aplicaciones renderizadas en el servidor.
  - **JWT de acceso con refresh token:** combina ausencia de estado y revocación, pero su complejidad (dos tokens, endpoint de renovación, reintentos en el frontend) es excesiva para el alcance del portal.
  - **Proveedor de identidad externo** (OAuth2/OIDC): fuera del alcance, porque el enunciado pide un login propio.
- **Motivo:**
  - **Protección contra XSS:** JavaScript no puede leer una cookie `httpOnly`, así que un script inyectado no puede robar el token.
  - **Protección contra CSRF:** con `SameSite=Strict` y el frontend y la API en el mismo origen (nginx en producción, proxy de Vite en desarrollo), otro sitio no puede hacer que el navegador envíe la cookie.
  - **Sin estado en la base de datos:** no requiere tablas nuevas, lo que mantiene simple el esquema.
  - **Frontend más simple:** el navegador envía la cookie automáticamente; el código de React no guarda ni adjunta tokens.
- **Implementación:**
  - El token solo contiene el identificador del usuario (`sub`) y su expiración (`exp`). **No incluye el rol ni el departamento.**
  - En cada petición, el backend lee de la base de datos el usuario, su rol, su departamento y los dos indicadores `activo` (de `usuario` y de `colaborador`). Así, un cambio de rol o una desactivación se aplican en la siguiente petición, sin esperar a que el token expire. Es la misma consulta que necesita el control de acceso por departamento (S3).
  - Expiración de 60 minutos, configurable con `JWT_EXPIRE_MINUTES` (entre 5 y 1440).
  - Atributos de la cookie: `httpOnly`, `SameSite=Strict` y `Path=/api`, más `Secure` cuando se sirve por HTTPS.
  - Firma HS256 con la librería PyJWT. El secreto se lee de la variable de entorno `JWT_SECRET` y nunca está en el código.
  - El logout borra la cookie.
- **Contras asumidos:**
  - **Revocación incompleta:** un JWT es válido hasta que expira. Si alguien copiara el token antes del logout, podría usarlo hasta su vencimiento. La expiración corta y `httpOnly` reducen este riesgo, y la lectura del usuario en cada petición bloquea de inmediato a los usuarios desactivados.
  - Si la API tuviera que servir a clientes de otro origen (por ejemplo, una app móvil), habría que revisar `SameSite` y agregar protección explícita contra CSRF.
- **En un despliegue real:** pasar a sesiones en servidor, o a tokens de acceso cortos con refresh tokens revocables, para tener revocación inmediata; servir siempre por HTTPS con `Secure`; y rotar `JWT_SECRET` periódicamente.

### S3. Control de acceso por rol y departamento

- **Decisión:** el acceso se define con la siguiente matriz de permisos, y el backend la verifica en cada endpoint según el rol del usuario y su departamento (`colaborador → cargo → departamento`).

  ✅ permitido · 🔸 permitido con límites · ❌ no permitido

  | Módulo / acción | Administrador | Jefe de Departamento | Colaborador |
  |---|---|---|---|
  | **Colaboradores:** listar y ver | ✅ Todos los departamentos | ✅ Su departamento, ficha completa | 🔸 Su departamento, solo nombre, apellido, cargo y correo de los activos |
  | **Cargos y funciones:** ver | ✅ Todos | ✅ Los de su departamento | 🔸 Solo su propio cargo |
  | **Mi perfil:** ver | ✅ El propio | ✅ El propio | ✅ El propio |
  | **Notas de crédito:** ver el módulo | ✅ | ✅ | ❌ |
  | Notas: listar y ver el detalle | ✅ Todas | ✅ Las de su departamento | ❌ |
  | Notas: crear solicitud | ❌ | ✅ Para su departamento | ❌ |
  | Notas: aprobar o rechazar | ✅ Las que no solicitó él mismo | ❌ | ❌ |
  | Notas: anular | ❌ | 🔸 Solo las propias y en estado pendiente | ❌ |
  | Notas: ver el historial | ✅ Todas | ✅ Las de su departamento | ❌ |

  Módulos visibles por rol (sección 3.3): el Administrador y el Jefe de Departamento ven los cuatro; el Colaborador ve tres (Colaboradores, Cargos y funciones, y Mi perfil).

- **Cómo se resuelven los puntos que el enunciado deja abiertos:**
  - **"Información limitada" del colaborador:** el directorio de su departamento con datos de contacto, su propio cargo y su perfil. No ve datos como la fecha de ingreso o el país de sus compañeros.
  - **Solicitud de notas de crédito:** el colaborador no puede crear solicitudes, para respetar el acceso de solo lectura que define la sección 3.2. Las solicita el Jefe de Departamento.
  - **Aprobación:** la aprueba o rechaza el Administrador. Así se cumple estructuralmente que el aprobador pertenece a un rol distinto del solicitante (sección 3.4).
  - **Recursos fuera de alcance:** responden **403** cuando el rol no tiene acceso al módulo o a la acción, y **404** cuando el recurso pertenece a otro departamento, para no revelar que existe.
- **Implementación:**
  - Una dependencia de FastAPI resuelve en cada petición el usuario autenticado, su rol y su departamento, leídos de la base de datos (ver [S2](#s2-mecanismo-de-sesión)).
  - Cada endpoint declara qué roles acepta, y las consultas filtran por departamento cuando el rol es Jefe de Departamento o Colaborador.
  - Las respuestas del Colaborador usan modelos `*Public` reducidos, que solo exponen los campos permitidos.
  - El frontend oculta los módulos y acciones no permitidos solo como experiencia de usuario: la seguridad real está en el backend.
  - **Defensa en profundidad:** además de la matriz, la base de datos impide que el resolutor de una nota sea quien la solicitó (`CHECK`), aunque una regla del backend fallara.
- **Alternativas consideradas:**
  - **El Colaborador solicita y aprueba el Jefe de su departamento** (y si solicita el Jefe, aprueba el Administrador): un flujo más rico, pero contradice el acceso de solo lectura del Colaborador.
  - **El Administrador también puede crear solicitudes:** se descartó para que su rol sea supervisar y aprobar.
  - **El Jefe ve notas de otros departamentos:** se descartó para mantener el mismo alcance por departamento en todo el portal.
- **Motivo:** la matriz cumple literalmente las definiciones de roles de la sección 3.2 y la segregación de funciones de la sección 3.4, con un flujo de aprobación de un solo nivel, fácil de verificar con tests: cada celda de la matriz corresponde a un caso de prueba.
- **Contras asumidos:**
  - El Administrador es el único aprobador posible, así que puede convertirse en un cuello de botella.
  - El Colaborador no puede iniciar solicitudes, aunque en una operación real podría detectar la necesidad de una nota de crédito.
- **En un despliegue real:** niveles de aprobación según el monto, delegación temporal de la aprobación (por ejemplo, durante vacaciones) y permisos configurables por base de datos en lugar de definidos en el código.

### S4. Secretos de desarrollo y usuarios de demostración

- **Decisión:** `.env.example` incluye valores funcionales para el entorno de desarrollo local, de modo que el proyecto se levante con `cp .env.example .env` y `docker compose up -d --build`. Los usuarios de demostración, uno o más por rol, se crean con una contraseña común definida en `SEED_USER_PASSWORD` y se documentan en el README.
- **Distinción entre dos tipos de credenciales:**

  | Tipo | Ejemplos | Tratamiento |
  |---|---|---|
  | **Secretos de infraestructura** | `POSTGRES_PASSWORD`, `APP_DB_PASSWORD`, `JWT_SECRET` | Se leen siempre del `.env`, que nunca se versiona. `.env.example` trae valores de desarrollo local, marcados como no aptos para otros entornos |
  | **Credenciales de demostración** | La contraseña de los usuarios de prueba | Son datos ficticios, como los nombres y correos del seed. Se documentan para que cualquiera pueda probar el portal con cada rol |

- **Alternativas consideradas:**
  - **`SEED_USER_PASSWORD` obligatoria y sin valor de ejemplo:** obliga a quien clona el repositorio a definir contraseñas antes del primer arranque. Complica probar la aplicación sin aportar seguridad real a datos ficticios.
  - **Script de setup que genera secretos aleatorios:** mejor higiene, pero agrega un paso y un script que mantener. Queda como mejora opcional.
  - **Valores por defecto dentro de `docker-compose.yml`** (`${VAR:-valor}`): los valores quedan en un archivo versionado y se usan en silencio si falta la variable.
  - **Hashes de contraseña fijos en el SQL:** funciona, pero la contraseña quedaría fija para siempre y no podría cambiarse sin editar el script.
  - **Contraseñas generadas en el primer arranque y mostradas en los logs:** seguras, pero incómodas para quien evalúa el proyecto.
- **Motivo:** el proyecto se puede probar en dos comandos, sin editar ningún archivo, y el requisito 4.6 del enunciado se mantiene: los secretos se leen de variables de entorno, `.env` está excluido de Git y ningún secreto está escrito en el código de la aplicación.
- **Implementación:**
  - Los usuarios de demostración se crean en SQL (`db/05-seed-usuarios.sql`) con la extensión `pgcrypto` de PostgreSQL (`crypt(..., gen_salt('bf'))`). Los hashes bcrypt que genera son compatibles con la librería `bcrypt` que usa el backend para verificar el login. La contraseña se lee de `SEED_USER_PASSWORD` con `\getenv`, igual que `00-app-user.sql`.
  - Cada valor de `.env.example` lleva la advertencia de que solo sirve para desarrollo local.
  - **Salvaguarda:** con `APP_ENV=production`, el backend se niega a arrancar si `JWT_SECRET` conserva el valor de ejemplo o es demasiado corto.
- **Contras asumidos:**
  - Los valores de `.env.example` son públicos. Si alguien los usara fuera de su máquina, cualquiera podría conocerlos. La salvaguarda del backend y las advertencias reducen ese riesgo.
  - Todos los usuarios de demostración comparten la misma contraseña.
- **En un despliegue real:** sin usuarios de demostración ni valores de ejemplo; secretos generados y almacenados en un gestor de secretos; los usuarios los crea un administrador y cada uno define su propia contraseña.

## 5. Limitaciones conocidas y mejoras futuras

- **Sin migraciones.** Los scripts de `db/` solo se ejecutan al crear la base de datos. Para cambiar el schema hay que recrearla (`docker compose down -v`), lo que borra los datos. Agregaría una herramienta de migraciones, como Alembic, para aplicar cambios sin perder información.
- **Sin límite de intentos de login.** Hoy se pueden probar contraseñas sin límite. El login ya evita revelar qué correos existen (mismo mensaje y mismo tiempo de respuesta), pero no frena un ataque de fuerza bruta. Agregaría un límite de intentos por usuario y por IP.
- **Sin tests automáticos del frontend.** El backend tiene tests unitarios y de integración, pero el frontend solo se verificó con un navegador automatizado durante el desarrollo. Agregaría tests de componentes (Vitest) y de los flujos principales (Playwright).
- **Sin auditoría de accesos.** Las notas de crédito guardan un historial completo, pero los inicios de sesión, los cierres y los intentos fallidos no quedan registrados. Agregaría una tabla de eventos de acceso que solo admita agregar filas, con la misma lógica que el historial de notas.
