# AI log: Modelo de datos

## 1. Versión Mermaid del ERD lógico

- **Fecha:** 2026-11-02 · **Herramienta:** Claude Code (Opus 5.5)
- **Contexto:** el ERD lógico del core ya estaba dibujado (`docs/modelo-datos/ERD.png`) y documentado en el diccionario de tablas (`docs/modelo-datos/erd.md`). Hacía falta una versión en texto del diagrama, que se pueda versionar y ver directamente en GitHub.
- **Prompt:**
  > Tomando en cuenta el Logical ERD plasmado en @docs/modelo-datos/ERD.png y el diccionario de tablas en @docs/modelo-datos/erd.md, generame la version en Mermaid del diagrama, respetando las entidades, sus atributos y relaciones.
- **Respuesta (resumen):** generó un bloque `erDiagram` con las 9 entidades, sus atributos, tipos y llaves (PK, FK, UK) y las 8 relaciones con la cardinalidad del PNG. Dejó las etiquetas de las relaciones vacías porque el PNG no tiene verbos y no agregó restricciones que no estaban en el diagrama.
- **Decisión:** ✅ Aceptada
- **Por qué:** el diagrama coincide con el PNG en entidades, atributos y cardinalidades. Al ser texto, sus cambios se pueden revisar en los diffs.
- **Evidencia:** `docs/modelo-datos/erd.md`, sección "Diagrama"
