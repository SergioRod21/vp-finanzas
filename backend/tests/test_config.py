import pytest

from app.core.config import load_settings

BASE = {
    "DATABASE_URL": "postgresql+psycopg://u:p@db:5432/x",
    "JWT_SECRET": "a" * 40,
}


def test_configuracion_valida_en_desarrollo():
    settings = load_settings(BASE)

    assert settings.app_env == "development"
    assert settings.jwt_expire_minutes == 60
    assert settings.cookie_secure is False


def test_produccion_usa_cookie_secure():
    settings = load_settings({**BASE, "APP_ENV": "production"})

    assert settings.cookie_secure is True


@pytest.mark.parametrize("faltante", ["DATABASE_URL", "JWT_SECRET"])
def test_falla_si_falta_una_variable_obligatoria(faltante):
    env = {k: v for k, v in BASE.items() if k != faltante}

    with pytest.raises(RuntimeError, match=faltante):
        load_settings(env)


def test_falla_con_jwt_secret_corto():
    with pytest.raises(RuntimeError, match="al menos 32"):
        load_settings({**BASE, "JWT_SECRET": "corto"})


def test_produccion_rechaza_el_jwt_secret_de_ejemplo():
    env = {**BASE, "APP_ENV": "production",
           "JWT_SECRET": "dev_jwt_secret_local_only_9d2f6a1c8e4b7a3f5c0d"}

    with pytest.raises(RuntimeError, match="valor de ejemplo"):
        load_settings(env)


def test_desarrollo_acepta_el_jwt_secret_de_ejemplo():
    env = {**BASE, "JWT_SECRET": "dev_jwt_secret_local_only_9d2f6a1c8e4b7a3f5c0d"}

    assert load_settings(env).app_env == "development"


def test_falla_con_entorno_desconocido():
    with pytest.raises(RuntimeError, match="APP_ENV"):
        load_settings({**BASE, "APP_ENV": "staging"})


@pytest.mark.parametrize("valor", ["abc", "0", "100000"])
def test_falla_con_expiracion_invalida(valor):
    with pytest.raises(RuntimeError, match="JWT_EXPIRE_MINUTES"):
        load_settings({**BASE, "JWT_EXPIRE_MINUTES": valor})
