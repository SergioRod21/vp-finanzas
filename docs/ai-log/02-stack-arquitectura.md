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
