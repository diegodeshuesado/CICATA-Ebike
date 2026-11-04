-- ============================================================
-- SISTEMA SCADA+ML PARA LEVs -- CICATA-Queretaro IPN
-- Esquema de Base de Datos Relacional
-- Proyecto: SECTEI/234/2024 | SIP 2025-027 | Registro B250098
-- Autor: Diego Gutierrez Hernandez
-- Version: 2.0 | Mayo 2026
-- Compatible: SQLite 3.x (prototipo TRL 4-5) / PostgreSQL 14+
-- ============================================================

-- TABLA 1: usuarios
-- `aprobado` (F1): las cuentas creadas por un Administrador desde el panel
-- (POST /api/users) nacen aprobadas (1) -- un admin ya las dio de alta a
-- propósito. Las cuentas auto-registradas por el público desde
-- pages/Register.tsx (POST /api/auth/register) nacen en 0: el login las
-- rechaza con un mensaje claro hasta que un Administrador las aprueba,
-- que es exactamente lo que la pantalla de registro ya le prometía al
-- usuario ("Un administrador revisará su acceso") sin que el código
-- hiciera nada de eso -- ver PLAN_MEJORAS.md, punto F1.
CREATE TABLE IF NOT EXISTS usuarios (
    id            TEXT PRIMARY KEY,
    email         TEXT NOT NULL UNIQUE,
    nombre        TEXT NOT NULL,
    rol           TEXT NOT NULL CHECK (rol IN ('Administrador','Investigador','Usuario Bicicleta')),
    nfc_token     TEXT UNIQUE,
    password_hash TEXT,          -- formato "salt_hex:hash_hex" (scrypt) -- ver server/auth.js
    aprobado      INTEGER NOT NULL DEFAULT 1,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- TABLA 1B: sesiones_auth (S2 -- tokens de autorización de la API, no confundir
-- con sesiones_experimento). Se crea un registro por login exitoso y se borra
-- al hacer logout o al expirar (expires_at).
CREATE TABLE IF NOT EXISTS sesiones_auth (
    token         TEXT PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    expires_at    TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sesiones_auth_user ON sesiones_auth(user_id);

-- TABLA 2: bicicletas_lev
CREATE TABLE IF NOT EXISTS bicicletas_lev (
    id                TEXT PRIMARY KEY,          -- e.g. 'B001'
    modelo            TEXT NOT NULL,
    numero_serie      TEXT NOT NULL UNIQUE,
    estado            TEXT NOT NULL DEFAULT 'inactiva'
                      CHECK (estado IN ('activa','inactiva','mantenimiento')),
    potencia_max_W    REAL CHECK (potencia_max_W < 2000),  -- LEV < 2 kW
    usuario_asignado  TEXT REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- TABLA 3: sesiones_experimento
CREATE TABLE IF NOT EXISTS sesiones_experimento (
    session_id    TEXT PRIMARY KEY,   -- UUID compartido con InfluxDB tag
    bike_id       TEXT NOT NULL REFERENCES bicicletas_lev(id),
    user_id       TEXT NOT NULL REFERENCES usuarios(id),
    inicio        TEXT NOT NULL,      -- ISO 8601: 2026-05-31T08:00:00Z
    fin           TEXT,               -- NULL mientras la sesion este activa
    duracion_s    INTEGER DEFAULT 300,
    distancia_km  REAL,
    energia_Wh    REAL,
    oe_id         TEXT NOT NULL CHECK (oe_id IN ('OE1','OE2','OE3','OE4')),
    notas         TEXT
);

-- TABLA 4: experimentos
CREATE TABLE IF NOT EXISTS experimentos (
    experimento_id        TEXT PRIMARY KEY,
    session_id            TEXT NOT NULL REFERENCES sesiones_experimento(session_id),
    voltaje_V             REAL NOT NULL CHECK (voltaje_V IN (36, 48, 60)),
    carga_Nm              REAL NOT NULL CHECK (carga_Nm BETWEEN 0 AND 5),
    perfil_rpm            TEXT NOT NULL
                          CHECK (perfil_rpm IN ('constante','rampa','urbano','sinusoidal','aleatorio')),
    estrategia_ctrl       TEXT NOT NULL DEFAULT 'SVPWM',
    temp_ambiente_C       REAL,
    frecuencia_Hz         INTEGER NOT NULL DEFAULT 1000,
    num_bicicletas        INTEGER DEFAULT 2 CHECK (num_bicicletas BETWEEN 1 AND 3),
    notas                 TEXT,
    created_at            TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- TABLA 5: resultados_sesion
CREATE TABLE IF NOT EXISTS resultados_sesion (
    resultado_id          TEXT PRIMARY KEY,
    session_id            TEXT NOT NULL UNIQUE REFERENCES sesiones_experimento(session_id),
    energia_Wh_km_prom    REAL,
    energia_Wh_km_min     REAL,
    energia_Wh_km_max     REAL,
    eficiencia_pct_prom   REAL,
    eficiencia_pct_min    REAL,
    thd_pct_prom          REAL,
    potencia_W_prom       REAL,
    potencia_W_max        REAL,
    voltaje_bateria_V_prom   REAL,
    voltaje_bateria_V_min    REAL,
    voltaje_bateria_V_max    REAL,
    corriente_bateria_A_prom REAL,
    corriente_bateria_A_max  REAL,
    voltaje_motor_V_prom     REAL,
    corriente_motor_A_prom   REAL,
    corriente_motor_A_max    REAL,
    velocidad_ms_prom        REAL,
    velocidad_ms_max         REAL,
    velocidad_rpm_prom       REAL,
    velocidad_rpm_max        REAL,
    aceleracion_ms2_max      REAL,
    inclinacion_grados_prom  REAL,
    temperatura_C_inicio     REAL,
    temperatura_C_max        REAL,
    humedad_pct_prom         REAL,
    gps_lat_inicio           REAL,
    gps_lng_inicio           REAL,
    gps_lat_fin              REAL,
    gps_lng_fin              REAL,
    completitud_prom         REAL,
    exactitud_prom           REAL,
    consistencia_prom        REAL,
    num_anomalias            INTEGER DEFAULT 0,
    latencia_maxima_ms       REAL,
    perdida_mensajes_pct     REAL,
    tasa_adquisicion_prom    REAL,
    calidad_ok               INTEGER DEFAULT 1 CHECK (calidad_ok IN (0,1)),
    created_at               TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- TABLA 6: catalogo_variables_influxdb
CREATE TABLE IF NOT EXISTS catalogo_variables_influxdb (
    variable_id   INTEGER PRIMARY KEY AUTOINCREMENT,
    measurement   TEXT NOT NULL,
    campo         TEXT NOT NULL,
    tipo_influxdb TEXT NOT NULL,
    tipo_dato     TEXT NOT NULL,
    unidad        TEXT,
    rango_min     REAL,
    rango_max     REAL,
    umbral_alerta REAL,
    descripcion   TEXT,
    fuente        TEXT,
    UNIQUE(measurement, campo)
);

-- Datos: telemetria_motor
INSERT OR IGNORE INTO catalogo_variables_influxdb
  (measurement, campo, tipo_influxdb, tipo_dato, unidad, rango_min, rango_max, descripcion, fuente)
VALUES
('telemetria_motor','bike_id',   'tag','string',NULL,NULL,NULL,'Identificador del LEV (e.g. B001)','arquitectura_bd'),
('telemetria_motor','session_id','tag','string',NULL,NULL,NULL,'ID de sesion experimental -- clave de integracion con BD relacional','arquitectura_bd'),
('telemetria_motor','oe_id',     'tag','string',NULL,NULL,NULL,'Objetivo especifico activo OE1-OE4','arquitectura_bd'),
('telemetria_motor','voltaje_bateria_V',   'field','float','V',   30,72,  'Voltaje paquete bateria -- niveles 36/48/60 V','diseno_experimental'),
('telemetria_motor','corriente_bateria_A', 'field','float','A',  -30,30,  'Corriente descarga/carga de la bateria','diseno_experimental'),
('telemetria_motor','voltaje_motor_V',     'field','float','V',    0,72,  'Voltaje aplicado al devanado del motor (SVPWM)','arquitectura_bd'),
('telemetria_motor','corriente_motor_A',   'field','float','A',  -30,30,  'Corriente de fase del motor','arquitectura_bd'),
('telemetria_motor','velocidad_ms',        'field','float','m/s',  0,20,  'Velocidad lineal del vehiculo','diseno_experimental'),
('telemetria_motor','velocidad_rpm',       'field','float','RPM',  0,1500,'Velocidad angular del rotor medida por encoder','omae'),
('telemetria_motor','aceleracion_ms2',     'field','float','m/s2',-15,15, 'Aceleracion lineal del vehiculo (derivada velocidad o IMU)','diseno_experimental'),
('telemetria_motor','inclinacion_grados',  'field','float','deg', -45,45, 'Angulo de inclinacion -- compensacion gravitacional para Wh/km','diseno_experimental'),
('telemetria_motor','temperatura_C',       'field','float','C',    0,120, 'Temperatura devanado motor -- T_init < 35 C','diseno_experimental'),
('telemetria_motor','humedad_pct',         'field','float','%',    0,100, 'Humedad relativa del ambiente de prueba','diseno_experimental'),
('telemetria_motor','gps_lat',             'field','float','deg', -90,90,  'Latitud GPS del vehiculo (WGS84)','diseno_experimental'),
('telemetria_motor','gps_lng',             'field','float','deg',-180,180, 'Longitud GPS del vehiculo (WGS84)','diseno_experimental'),
('telemetria_motor','potencia_W',          'field','float','W',    0,2000,'Potencia instantanea: P = V_motor x I_motor','omae'),
('telemetria_motor','energia_Wh_km',       'field','float','Wh/km',0,100, 'Variable dependiente principal del modelo ML -- objetivo R2>=0.90','omae'),
('telemetria_motor','eficiencia_pct',      'field','float','%',    0,100, 'Eficiencia energetica eta%','omae'),
('telemetria_motor','thd_pct',             'field','float','%',    0,100, 'Distorsion armonica total THD%','omae'),
('telemetria_motor','carga_Nm',            'field','float','N.m',  0,5,   'Carga mecanica aplicada -- variable independiente','omae');

-- Datos: calidad_dato (ISO/IEC 25012)
INSERT OR IGNORE INTO catalogo_variables_influxdb
  (measurement, campo, tipo_influxdb, tipo_dato, unidad, rango_min, rango_max, umbral_alerta, descripcion, fuente)
VALUES
('calidad_dato','bike_id',      'tag',  'string', NULL, NULL,NULL,NULL,  'Tag trazabilidad','iso25012'),
('calidad_dato','origen_dato',  'tag',  'string', NULL, NULL,NULL,NULL,  'sensor_directo | interpolado | imputado','iso25012'),
('calidad_dato','completitud',  'field','float',  NULL, 0,   1,   0.95,  'Ratio campos no nulos / total esperado (300s x 1kHz) -- umbral >=95%','iso25012'),
('calidad_dato','exactitud',    'field','float',  NULL, 0,   1,   0.98,  'Lecturas dentro de rango fisico valido / total -- umbral >=98%','iso25012'),
('calidad_dato','consistencia', 'field','float',  NULL, 0,   1,   NULL,  'Verificacion P = V_motor x I_motor con tolerancia +-5%','iso25012'),
('calidad_dato','flag_anomalia','field','integer', NULL, 0,   1,   NULL,  '1 si lectura fuera rango estadistico (IQR x1.5)','iso25012');

-- Datos: metricas_sistema
INSERT OR IGNORE INTO catalogo_variables_influxdb
  (measurement, campo, tipo_influxdb, tipo_dato, unidad, umbral_alerta, descripcion, fuente)
VALUES
('metricas_sistema','bike_id',              'tag',  'string','--',   NULL,'LEV o nodo SCADA bajo medicion','diseno_experimental'),
('metricas_sistema','latencia_promedio_ms', 'field','float', 'ms',   NULL,'Latencia promedio transmision MQTT','diseno_experimental'),
('metricas_sistema','latencia_maxima_ms',   'field','float', 'ms',   50,  'Latencia maxima -- alerta si > 50 ms','diseno_experimental'),
('metricas_sistema','perdida_mensajes_pct', 'field','float', '%',    1.0, 'Porcentaje mensajes perdidos -- alerta si > 1%','diseno_experimental'),
('metricas_sistema','jitter_ms',            'field','float', 'ms',   NULL,'Desviacion temporal entre timestamps esperados y reales','diseno_experimental'),
('metricas_sistema','error_sincronia_ms',   'field','float', 'ms',   NULL,'Error de sincronia entre fuentes de datos simultaneas','diseno_experimental'),
('metricas_sistema','tiempo_recuperacion_s','field','float', 's',    NULL,'Tiempo de recuperacion tras fallo de comunicacion','diseno_experimental'),
('metricas_sistema','tasa_adquisicion_mps', 'field','float', 'muestras/s',NULL,'Tasa de adquisicion real -- nominal 1000 muestras/s','diseno_experimental'),
('metricas_sistema','throughput_KBs',       'field','float', 'KB/s', NULL,'Throughput de datos en la red MQTT','diseno_experimental');

-- TABLA 7: alertas_sistema
CREATE TABLE IF NOT EXISTS alertas_sistema (
    alerta_id     INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    bike_id       TEXT REFERENCES bicicletas_lev(id),
    session_id    TEXT REFERENCES sesiones_experimento(session_id),
    tipo_alerta   TEXT NOT NULL
                  CHECK (tipo_alerta IN (
                    'completitud_baja','exactitud_baja','anomalia_energia',
                    'inconsistencia_potencia','latencia_alta','perdida_mensajes',
                    'temperatura_alta','sensor_offline','otro'
                  )),
    campo         TEXT,
    valor         REAL,
    umbral        REAL,
    descripcion   TEXT,
    atendida      INTEGER DEFAULT 0 CHECK (atendida IN (0,1))
);

-- INDICES
CREATE INDEX IF NOT EXISTS idx_sesiones_bike       ON sesiones_experimento(bike_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_user       ON sesiones_experimento(user_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_oe         ON sesiones_experimento(oe_id);
CREATE INDEX IF NOT EXISTS idx_experimentos_ses    ON experimentos(session_id);
CREATE INDEX IF NOT EXISTS idx_experimentos_voltaje ON experimentos(voltaje_V);
CREATE INDEX IF NOT EXISTS idx_resultados_sesion   ON resultados_sesion(session_id);
CREATE INDEX IF NOT EXISTS idx_alertas_bike        ON alertas_sistema(bike_id);
CREATE INDEX IF NOT EXISTS idx_alertas_tipo        ON alertas_sistema(tipo_alerta);
CREATE INDEX IF NOT EXISTS idx_catalogo_measurement ON catalogo_variables_influxdb(measurement);

-- DATOS SEMILLA
-- NOTA DE SEGURIDAD: estas son contraseñas DE DEMOSTRACIÓN para el prototipo local.
-- Contraseñas en texto plano (cambiarlas antes de cualquier despliegue real):
--   admin@ipn.mx        -> Admin2026!
--   investigador@ipn.mx -> Inves2026!
--   usuario@ipn.mx       -> user123   (coincide con la simulación de tarjeta NFC en Login.tsx)
-- Los hashes de abajo se generaron con server/auth.js (scrypt + sal aleatoria).
INSERT OR IGNORE INTO usuarios (id, email, nombre, rol, nfc_token, password_hash) VALUES
    ('u1', 'admin@ipn.mx',        'Diego Gutiérrez Hernández', 'Administrador', 'NFC-ADMIN-001',
        'fe6a84e442d9fb2094a26046eec57663:93611ddae39f427acdd2b9a2c2412c6a30ef600022af51f74dc763dcec3d0a79ce579374ea246f7b97d4f7d35a0c3c413346273cf4c83af64343788a221f4464'),
    ('u2', 'investigador@ipn.mx', 'Ana López',                 'Investigador',  'NFC-INV-002',
        '264f2ff7a93e5e7a692822d9c0317610:e91aa2dc98a6f357d991da39c473b6475c490e81dce81155c84f57751a031e173df9de76d052d6fe77d85c03056ab950b5adf052cac739020b556407705eb748'),
    ('u3', 'usuario@ipn.mx',      'Carlos Ramírez',            'Usuario Bicicleta', 'ABC123456',
        '130effb458494d14500fa9dbf2ffbbef:2ab025f291c115f93894d0b89cec33d3c98e85bfb2a69a8a36ebd7be2579de89f17704d149c6781213b3fdaa64d3896d88d90876e0aa0044453fb229e8c41c6a');

INSERT OR IGNORE INTO bicicletas_lev (id, modelo, numero_serie, estado, potencia_max_W, usuario_asignado) VALUES
    ('B001', 'Urban Commuter Pro', 'LEV-2024-001', 'activa',        500, 'u3'),
    ('B002', 'City E-Bike Plus',   'LEV-2024-002', 'activa',        500, NULL),
    ('B003', 'Cargo Electric',     'LEV-2024-003', 'mantenimiento', 750, NULL),
    ('B004', 'Sport E-Bike',       'LEV-2024-004', 'activa',        1000, NULL),
    ('B005', 'Urban Commuter Pro', 'LEV-2024-005', 'activa',        500, NULL),
    ('B006', 'City E-Bike Plus',   'LEV-2024-006', 'inactiva',      500, NULL),
    ('B007', 'Cargo Electric',     'LEV-2024-007', 'activa',        750, NULL),
    ('B008', 'Sport E-Bike',       'LEV-2024-008', 'mantenimiento', 1000, NULL);

INSERT OR IGNORE INTO alertas_sistema (alerta_id, timestamp, bike_id, tipo_alerta, campo, valor, umbral, descripcion, atendida) VALUES
    (1, '2026-05-31T10:15:00Z', 'B001', 'temperatura_alta', 'temperatura_C', 48.5, 45.0, 'Temperatura de devanado excedió umbral operacional', 0),
    (2, '2026-05-31T09:30:00Z', 'B003', 'completitud_baja', 'completitud', 0.91, 0.95, 'Completitud de muestra por debajo de la norma ISO/IEC 25012', 1),
    (3, '2026-05-31T08:00:00Z', 'B006', 'sensor_offline', 'voltaje_bateria_V', 0.0, 30.0, 'Pérdida de señal de telemetría MQTT', 0);

-- VISTA: resumen_experimentos
CREATE VIEW IF NOT EXISTS resumen_experimentos AS
SELECT
    e.experimento_id,
    e.session_id,
    s.bike_id,
    s.oe_id,
    e.voltaje_V,
    e.carga_Nm,
    e.perfil_rpm,
    e.estrategia_ctrl,
    e.temp_ambiente_C,
    r.energia_Wh_km_prom,
    r.eficiencia_pct_prom,
    r.thd_pct_prom,
    r.potencia_W_prom,
    r.velocidad_ms_prom,
    r.aceleracion_ms2_max,
    r.inclinacion_grados_prom,
    r.temperatura_C_max,
    r.humedad_pct_prom,
    r.voltaje_bateria_V_prom,
    r.corriente_bateria_A_prom,
    r.voltaje_motor_V_prom,
    r.corriente_motor_A_prom,
    r.completitud_prom,
    r.exactitud_prom,
    r.calidad_ok
FROM experimentos e
JOIN sesiones_experimento s ON e.session_id = s.session_id
LEFT JOIN resultados_sesion r ON e.session_id = r.session_id;
