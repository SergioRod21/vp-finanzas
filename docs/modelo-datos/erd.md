# Modelo lógico de datos

## Diccionario de tablas

| Tabla | Propósito |
|---|---|
| `pais` | Catálogo de países de residencia |
| `departamento` | Departamentos de la VP de Finanzas |
| `nivel` | Catálogo de seniority |
| `cargo` | Puesto dentro de un departamento |
| `funcion` | Catálogo de funciones |
| `cargo_funcion` | Tabla asociativa cargo ↔ función |
| `colaborador` | Ficha laboral de cada persona |
| `rol` | Roles de acceso (Administrador, Jefe de Departamento, Colaborador) |
| `usuario` | Credencial de acceso al portal |
| `motivo_nota_credito` | Catálogo de motivos de las notas de crédito |
| `nota_credito` | Solicitud de nota de crédito y su estado actual |
| `nota_credito_historico` | Historial de acciones sobre cada nota de crédito (auditoría) |

## Diagrama

```mermaid
erDiagram
    pais         ||--o{ colaborador   : ""
    rol          ||--o{ usuario       : ""
    colaborador  ||--o| usuario       : ""
    cargo        ||--o{ colaborador   : ""
    departamento ||--o{ cargo         : ""
    nivel        ||--o{ cargo         : ""
    cargo        ||--o{ cargo_funcion : ""
    funcion      ||--o{ cargo_funcion : ""
    usuario      ||--o{ nota_credito  : "solicita"
    usuario      |o--o{ nota_credito  : "resuelve"
    departamento ||--o{ nota_credito  : ""
    motivo_nota_credito ||--o{ nota_credito : ""
    nota_credito ||--|{ nota_credito_historico : ""
    usuario      ||--o{ nota_credito_historico : ""

    pais {
        integer pais_id PK
        varchar codigo_iso UK
        varchar nombre UK
    }
    rol {
        integer rol_id PK
        varchar nombre UK
    }
    usuario {
        integer usuario_id PK
        integer colaborador_id FK, UK
        integer rol_id FK
        varchar hashed_password
        boolean activo
    }
    colaborador {
        integer colaborador_id PK
        integer pais_id FK
        integer cargo_id FK
        varchar correo UK
        varchar nombre
        varchar apellido
        date fecha_ingreso
        boolean activo
    }
    departamento {
        integer departamento_id PK
        varchar nombre UK
    }
    cargo {
        integer cargo_id PK
        integer departamento_id FK
        integer nivel_id FK
        varchar titulo
    }
    nivel {
        integer nivel_id PK
        varchar nombre UK
    }
    cargo_funcion {
        integer cargo_id PK, FK
        integer funcion_id PK, FK
    }
    funcion {
        integer funcion_id PK
        varchar descripcion UK
    }
    motivo_nota_credito {
        integer motivo_nota_credito_id PK
        varchar descripcion UK
    }
    nota_credito {
        integer nota_credito_id PK
        integer solicitante_id FK
        integer resolutor_id FK
        integer departamento_id FK
        integer motivo_nota_credito_id FK
        varchar numero UK
        numeric monto
        varchar detalle
        varchar estado_actual
        timestamp creada_en
        timestamp actualizada_en
    }
    nota_credito_historico {
        integer nota_credito_historico_id PK
        integer nota_credito_id FK
        integer usuario_id FK
        varchar accion
        varchar estado_anterior
        varchar estado_nuevo
        varchar comentario
        timestamp ocurrido_en
    }
```
