// Captura del payload entrante (desde la LILYGO / MQTT)
var raw = msg.payload || {};

// Parseo seguro de variables numéricas (Casting explícito float ISO/IEC 25012)
var v = parseFloat(raw.v_bus || raw.voltaje_bateria_V || 0);
var i = parseFloat(raw.i_motor || raw.corriente_bateria_A || 0);
var p = parseFloat(raw.potencia_w) || (v * i);
var t = parseFloat(raw.temp_motor || raw.temperatura_C || 0);

// Estructura estandarizada para InfluxDB v2 (measurement: telemetria_motor)
msg.payload = [
    {
        measurement: "telemetria_motor",
        tags: {
            bike_id: raw.bike_id || "ebike1",
            origen: "lilygo_4g"
        },
        fields: {
            v_bus: v,
            i_motor: i,
            potencia_w: p,
            temp_motor: t,
            pitch: parseFloat(raw.pitch || 0),
            roll: parseFloat(raw.roll || 0),
            acel_x: parseFloat(raw.acel_x || 0),
            latitud: parseFloat(raw.latitud || 0),
            longitud: parseFloat(raw.longitud || 0)
        },
        timestamp: new Date()
    }
];

return msg;
