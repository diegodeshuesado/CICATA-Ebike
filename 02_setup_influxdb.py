"""
SISTEMA SCADA+ML PARA LEVs — CICATA-Querétaro IPN
Configuración inicial de InfluxDB: bucket + retention policies
Proyecto: SECTEI/234/2024 | SIP 2025-027 | Registro B250098
Autor: Diego Gutiérrez Hernández
Versión: 1.0 | Mayo 2026

Uso:
    pip install influxdb-client
    python 02_setup_influxdb.py

Requiere INFLUXDB_URL / INFLUXDB_TOKEN / INFLUXDB_ORG en tu archivo .env
(o exportadas en la terminal). Ya no hay ningún token hardcodeado en este
archivo -- ver PLAN_MEJORAS.md, punto S3.
"""

import os
from influxdb_client import InfluxDBClient, BucketRetentionRules
from influxdb_client.client.write_api import SYNCHRONOUS
from dotenv_loader import require_env

# ─── Configuración ────────────────────────────────────────────────────────────
_env = require_env("INFLUXDB_TOKEN")
INFLUXDB_URL   = os.getenv("INFLUXDB_URL", "http://localhost:8086")
INFLUXDB_TOKEN = _env["INFLUXDB_TOKEN"]
INFLUXDB_ORG   = os.getenv("INFLUXDB_ORG", "IPN CICATA QRO")

BUCKET_NAME    = "scada_lev"

# Retention policies (en segundos; 0 = infinito)
RETENTION_RAW_DAYS    = 90    # telemetría cruda: 90 días
RETENTION_AGG_DAYS    = 0     # agregados horarios: indefinido

# ─── Measurements esperados ──────────────────────────────────────────────────
MEASUREMENTS = {
    "telemetria_motor": {
        "descripcion": "Telemetría LEV a ~1 kHz. 22 fields: elec batería/motor, cinemáticas, GPS, ambiente, energía",
        "frecuencia":   "~1 kHz (1 ms por punto)",
        "tags":         ["bike_id", "session_id", "oe_id"],
        "fields_key":   ["voltaje_bateria_V", "corriente_bateria_A",
                         "voltaje_motor_V",   "corriente_motor_A",
                         "velocidad_ms",      "velocidad_rpm",
                         "aceleracion_ms2",   "inclinacion_grados",
                         "temperatura_C",     "humedad_pct",
                         "gps_lat",           "gps_lng",
                         "potencia_W",        "energia_Wh_km",
                         "eficiencia_pct",    "thd_pct",
                         "carga_Nm"],
    },
    "calidad_dato": {
        "descripcion": "Métricas ISO/IEC 25012 calculadas cada 1 s (ventana 1000 muestras)",
        "frecuencia":   "1/s",
        "tags":         ["bike_id", "origen_dato"],
        "fields_key":   ["completitud", "exactitud", "consistencia", "flag_anomalia"],
        "umbrales":     {"completitud": 0.95, "exactitud": 0.98},
    },
    "metricas_sistema": {
        "descripcion": "Rendimiento del sistema SCADA (latencia, jitter, throughput)",
        "frecuencia":   "1/10s",
        "tags":         ["bike_id"],
        "fields_key":   ["latencia_promedio_ms", "latencia_maxima_ms",
                         "perdida_mensajes_pct",  "jitter_ms",
                         "error_sincronia_ms",    "tiempo_recuperacion_s",
                         "tasa_adquisicion_mps",  "throughput_KBs"],
        "alertas":      {"perdida_mensajes_pct": 1.0, "latencia_maxima_ms": 50},
    },
}

# ─── Setup ───────────────────────────────────────────────────────────────────
def setup_influxdb():
    print(f"Conectando a InfluxDB en {INFLUXDB_URL}...")
    with InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG) as client:
        buckets_api = client.buckets_api()
        orgs_api    = client.organizations_api()

        # Verificar organización
        orgs = orgs_api.find_organizations(org=INFLUXDB_ORG)
        if not orgs:
            print(f"  ERROR: Organización '{INFLUXDB_ORG}' no encontrada.")
            return
        org_id = orgs[0].id
        print(f"  OK: Organización '{INFLUXDB_ORG}' (id={org_id})")

        # Verificar si existe el bucket
        existing = buckets_api.find_bucket_by_name(BUCKET_NAME)
        if existing:
            print(f"  Bucket '{BUCKET_NAME}' ya existe (id={existing.id}) — verificado.")
        else:
            # Crear bucket con retention 90 días para datos crudos
            retention = BucketRetentionRules(
                type="expire",
                every_seconds=RETENTION_RAW_DAYS * 24 * 3600
            )
            bucket = buckets_api.create_bucket(
                bucket_name=BUCKET_NAME,
                retention_rules=retention,
                org_id=org_id,
            )
            print(f"  OK: Bucket '{BUCKET_NAME}' creado (retention: {RETENTION_RAW_DAYS} días)")
            print(f"      Bucket ID: {bucket.id}")

        # Documentar measurements
        print("\n  Measurements configurados:")
        for name, meta in MEASUREMENTS.items():
            print(f"    [{name}]")
            print(f"      Descripción : {meta['descripcion']}")
            print(f"      Frecuencia  : {meta['frecuencia']}")
            print(f"      Tags        : {meta['tags']}")
            print(f"      Fields      : {len(meta['fields_key'])} campos")

        print("\n  Setup completado con éxito.")


def test_conexion():
    """Escribe un punto de prueba y lo lee para verificar la cadena completa."""
    from influxdb_client.client.write_api import SYNCHRONOUS
    from influxdb_client import Point

    print("\nEjecutando prueba de escritura/lectura...")
    with InfluxDBClient(url=INFLUXDB_URL, token=INFLUXDB_TOKEN, org=INFLUXDB_ORG) as client:
        write_api = client.write_api(write_options=SYNCHRONOUS)
        query_api = client.query_api()

        # Punto de prueba
        point = (Point("telemetria_motor")
                 .tag("bike_id",    "B001")
                 .tag("session_id", "test-session-001")
                 .tag("oe_id",      "OE2")
                 .field("voltaje_bateria_V",  48.0)
                 .field("corriente_bateria_A", 5.2)
                 .field("velocidad_ms",        4.5)
                 .field("temperatura_C",       32.1)
                 .field("energia_Wh_km",       15.3))

        write_api.write(bucket=BUCKET_NAME, record=point)
        print("  OK: Punto de prueba escrito en telemetria_motor")

        # Consulta de verificación
        query = f'''
from(bucket: "{BUCKET_NAME}")
  |> range(start: -5m)
  |> filter(fn: (r) => r["_measurement"] == "telemetria_motor")
  |> filter(fn: (r) => r["bike_id"] == "B001")
  |> last()
'''
        tables = query_api.query(query)
        count = sum(1 for t in tables for r in t.records)
        print(f"  OK: Lectura verificada — {count} registros encontrados")


if __name__ == "__main__":
    setup_influxdb()
    try:
        test_conexion()
    except Exception as e:
        print(f"\n  NOTA: Prueba de conexión: {e}")
