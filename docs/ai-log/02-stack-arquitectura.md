# AI log: Stack y arquitectura

## 4. Separación en contenedores y dockerización de PostgreSQL

- **Fecha:** 2026-11-03 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** buscaba portabilidad para que el proyecto funcione igual en cualquier máquina, empezando por la base de datos.
- **Lo que pedí:** una propuesta de separación de contenedores que respete la separación por capas, y después dockerizar solo PostgreSQL.
- **Prompts:**
  > Ok, quiero centrarme en dockernizar el proyecto para lograr una mejor portabilidad del mismo y asegurar la debida funcionalidad en distintas maquinas, que separacion de contenedores me propones para respetar la correcta separacion por capas?

  > Por ahora ayudame a dockenizar la db de postgres
- **Aporte de la AI:**
  - Arquitectura de tres contenedores, uno por capa (frontend con nginx, backend y base de datos), más un contenedor de ejecución única para el seed de usuarios
  - Redes separadas: `backend_net` con `internal: true`, para que la base de datos no tenga salida a internet ni sea accesible desde el frontend
  - Variables obligatorias con `${VAR:?}`: Compose no arranca si falta una contraseña o está vacía
  - Puerto de PostgreSQL publicado solo en `127.0.0.1` y solo desde `docker-compose.override.yml` (desarrollo)
  - Healthcheck con `pg_isready`
- **Revisión:** pregunté si hacía falta exponer el puerto, ya que el backend vivirá en la misma red de Docker. La AI confirmó que el backend no lo necesita, porque se conecta por nombre de servicio (`db:5432`). El `docker-compose.yml` base no publica el puerto; el override existe solo para conectarse desde el host durante el desarrollo.
- **Decisión:** ✅ Aceptada. La dockerización del backend y del frontend se pospone hasta que ambos funcionen.
- **Evidencia:** `docker-compose.yml`, `docker-compose.override.yml`. Se verificó la carga de los scripts, la autenticación y que no hay salida a internet desde `backend_net`.

## 6. Framework y ORM del backend

- **Fecha:** 2026-11-03 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** con PostgreSQL en Docker y el schema escrito en SQL, faltaba confirmar el framework del backend y elegir un ORM que agilizara el desarrollo sin tomar el control del schema.
- **Lo que pedí:** una comparación de opciones en una tabla, con pros y contras; después, un ejemplo de implementación (ORM y API) de las opciones finalistas y del patrón de modelos de SQLModel.
- **Prompts:**
  > En cuanto al lenguaje + framework a utilizar del backend, que opcion es mas viable para cumplir el requerimiento planteado de manera sencilla y con buena arquitectura, tomando en cuenta que nuestra DB es PostgresSQL en un contenedor de docker y tengo en mente utilizar un ORM (ORM) para agilizar el desarollo? Planteame las distintas opciones en una tabla, listando sus pros y contras

  > pintame un ejemplo sencillo de como se veria la implementacion de tanto ORM como API en estas opciones: Opción: FastAPI + SQLAlchemy 2.0, Opción: FastAPI + SQLModel y Opción: Express + Prisma (TS)

  > listame como seria otro caso de uso de SQLModel, como se usa comumente el modelo base y exponer x columnas para luego usarlas en un endpoint, con la estructura de archivos y su contenido

  > Vamos con FastApi y SQLModel
- **Aporte de la AI:** comparó seis opciones (FastAPI + SQLAlchemy, FastAPI + SQLModel, Flask, Django + DRF, Express + Prisma y NestJS + Prisma) y recomendó **FastAPI + SQLAlchemy 2.0**. Mostró el mismo endpoint implementado con tres de ellas y el patrón de múltiples modelos de SQLModel aplicado a la tabla `usuario`.

  | Sugerencia de la AI | Decisión | Por qué |
  |---|---|---|
  | FastAPI como framework | ✅ Aceptada | Validación con Pydantic y dependencias reutilizables para el control de acceso |
  | SQLAlchemy 2.0 como ORM | ❌ Rechazada | SQLModel se adapta con menos fricción a la implementación: un mismo modelo sirve como tabla y como esquema de la API, sin mantener dos jerarquías de clases por separado |
  | Patrón de múltiples modelos (`Base`, tabla, `Create`, `Public`, `Update`) | ✅ Aceptada | Declara los campos compartidos una sola vez y separa lo que se guarda de lo que se expone |
  | Responder siempre con los modelos `*Public` | ✅ Aceptada | Mitiga el principal riesgo de SQLModel: exponer columnas sensibles como `hashed_password` |
- **Evidencia:** sección 1.1 de `docs/decisiones-tecnicas.md`

## 8. Librerías y arquitectura del frontend

- **Fecha:** 2026-11-04 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** con la API completa, faltaba definir cómo construir el frontend con React y React Router dentro de un contenedor de Docker en la misma red que el backend.
- **Lo que pedí:** un plan para el frontend con React, React Router y Docker; después, las alternativas para las llamadas a la API y para los componentes visuales.
- **Prompts:**
  > ahora si, actualiza el roadmap y dime como afrontamos esta parte del frontend, tomando en cuenta que quiero usar react con react router tambien en un contenedor de docker en la misma red

  > que alternativas hay para [TanStack Query y Mantine]? dame las distintas opciones

  > y por que no usar fetch?

  > vamos con TanStack Query y Mantine
- **Aporte de la AI:** propuso nginx como proxy de `/api` (un solo origen, sin CORS), el *fallback* a `index.html` para las rutas de React Router y una red `frontend_net` que deja a la base de datos fuera del alcance del frontend. Comparó cinco opciones para las llamadas a la API y siete para los componentes, y explicó que TanStack Query no reemplaza a `fetch` sino que maneja lo que pasa alrededor de él.

  | Sugerencia de la AI | Decisión | Por qué |
  |---|---|---|
  | nginx como proxy de `/api` y una red `frontend_net` | ✅ Aceptada | Un solo origen para la cookie de sesión y la base de datos aislada del frontend |
  | TanStack Query para las llamadas a la API | ✅ Aceptada | Evita reescribir en cada pantalla la carga, los errores y la recarga de datos |
  | Mantine para los componentes | ✅ Aceptada | Tablas, formularios y modales listos para usar, con un tema propio |
  | Estructura por *features* basada en bulletproof-react | ✅ Aceptada | Evita duplicación y archivos mal ubicados al trabajar el frontend por partes |
- **Evidencia:** sección 1.2 de `docs/decisiones-tecnicas.md`, `frontend/`
