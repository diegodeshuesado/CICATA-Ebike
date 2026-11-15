import os
from influxdb_client import InfluxDBClient
from dotenv_loader import require_env

# Token leído de .env, ya no hardcodeado -- ver PLAN_MEJORAS.md, punto S3.
_env = require_env("INFLUXDB_TOKEN")

client = InfluxDBClient(
    url=os.getenv('INFLUXDB_URL', 'http://localhost:8086'),
    token=_env['INFLUXDB_TOKEN'],
    org=os.getenv('INFLUXDB_ORG', 'IPN CICATA QRO')
)

query_api = client.query_api()
flux = '''
from(bucket: "scada_lev")
  |> range(start: -30d)
  |> filter(fn: (r) => r["_measurement"] == "telemetria_motor")
  |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value")
'''
tables = query_api.query(flux)

print("Resultados pivoteados:")
for table in tables:
    for r in table.records[:5]:
        print("Record values:", r.values)
