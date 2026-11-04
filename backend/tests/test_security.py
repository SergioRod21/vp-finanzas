from datetime import UTC, datetime, timedelta

import jwt

from app.core.config import settings
from app.core.security import (
    create_access_token,
    decode_access_token,
    hash_password,
    verify_password,
)


def test_verificar_contrasena_correcta_e_incorrecta():
    hashed = hash_password("una-clave")

    assert verify_password("una-clave", hashed)
    assert not verify_password("otra-clave", hashed)


def test_verificar_contrasena_demasiado_larga_no_lanza_error():
    hashed = hash_password("una-clave")

    assert not verify_password("x" * 200, hashed)


def test_verificar_contra_hash_mal_formado_no_lanza_error():
    assert not verify_password("una-clave", "no-es-un-hash")


def test_token_valido_devuelve_el_usuario():
    assert decode_access_token(create_access_token(7)) == 7


def test_token_solo_contiene_identificador_y_fechas():
    payload = jwt.decode(create_access_token(7), settings.jwt_secret, algorithms=["HS256"])

    assert set(payload) == {"sub", "iat", "exp"}


def test_token_expirado_es_rechazado():
    pasado = datetime.now(UTC) - timedelta(hours=2)
    token = jwt.encode(
        {"sub": "7", "iat": pasado, "exp": pasado + timedelta(minutes=5)},
        settings.jwt_secret,
        algorithm="HS256",
    )

    assert decode_access_token(token) is None


def test_token_firmado_con_otro_secreto_es_rechazado():
    ahora = datetime.now(UTC)
    token = jwt.encode(
        {"sub": "7", "iat": ahora, "exp": ahora + timedelta(minutes=5)},
        "otro-secreto-con-longitud-suficiente-para-firmar",
        algorithm="HS256",
    )

    assert decode_access_token(token) is None


def test_token_sin_firma_alg_none_es_rechazado():
    ahora = datetime.now(UTC)
    token = jwt.encode(
        {"sub": "7", "iat": ahora, "exp": ahora + timedelta(minutes=5)}, None, algorithm="none"
    )

    assert decode_access_token(token) is None


def test_token_sin_sub_es_rechazado():
    ahora = datetime.now(UTC)
    token = jwt.encode(
        {"iat": ahora, "exp": ahora + timedelta(minutes=5)}, settings.jwt_secret, algorithm="HS256"
    )

    assert decode_access_token(token) is None


def test_token_corrupto_es_rechazado():
    assert decode_access_token("esto.no.es-un-jwt") is None
