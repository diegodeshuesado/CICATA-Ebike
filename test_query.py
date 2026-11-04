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
flux = 'from(bucket: "scada_lev") |> range(start: -30d)'
tables = query_api.query(flux)

records = []
for table in tables:
    for record in table.records:
        records.append({
            'time': record.get_time(),
            'measurement': record.get_measurement(),
            'field': record.get_field(),
            'value': record.get_value(),
            'bike_id': record.values.get('bike_id')
        })

print(f"Total registros en InfluxDB: {len(records)}")
for r in records[:10]:
    print(r)
