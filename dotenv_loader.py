"""
Carga simple de variables desde .env, sin depender de python-dotenv.

Los scripts Python del proyecto (02_setup_influxdb.py, test_pivot.py,
test_query.py) antes tenían el token de InfluxDB escrito directo en el
código fuente. Este módulo permite que lean el mismo archivo .env que ya
usa el backend Node (server/index.js vía el paquete `dotenv`), para tener
las credenciales en un solo lugar -- ver PLAN_MEJORAS.md, punto S3.

Uso:
    from dotenv_loader import load_dotenv_simple
    load_dotenv_simple()
    token = os.environ["INFLUXDB_TOKEN"]
"""

import os


def load_dotenv_simple(path: str = None) -> None:
    """Lee un archivo .env (formato KEY=VALUE, una variable por línea) y
    define cada variable en os.environ si todavía no existe (no pisa
    variables que ya estén definidas en el entorno del sistema)."""
    if path is None:
        path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')

    if not os.path.exists(path):
        return

    with open(path, 'r', encoding='utf-8') as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, _, value = line.partition('=')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key:
                os.environ.setdefault(key, value)


def require_env(*names: str) -> dict:
    """Carga .env y valida que las variables pedidas existan; si falta
    alguna, corta la ejecución con un mensaje claro en vez de usar un
    valor por defecto hardcodeado."""
    load_dotenv_simple()
    values = {}
    missing = []
    for name in names:
        value = os.environ.get(name)
        if not value:
            missing.append(name)
        values[name] = value
    if missing:
        raise SystemExit(
            f"ERROR: faltan variables de entorno requeridas: {', '.join(missing)}.\n"
            f"Defínelas en tu archivo .env (revisa .env.example) o expórtalas en la terminal."
        )
    return values
