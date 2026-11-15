# Sistema SCADA de Telemetría para Vehículos Eléctricos Ligeros (LEVs)
### IPN CICATA Querétaro

Sistema SCADA (Supervisión, Control y Adquisición de Datos) con modelos de machine learning para vehículos eléctricos ligeros, desarrollado como proyecto de maestría. Captura telemetría real de una bicicleta eléctrica instrumentada (voltaje, corriente, potencia, temperatura, inclinación y GPS) vía MQTT/Node-RED hacia InfluxDB, y la expone en un panel web con autenticación por roles, gestión de flota y usuarios, y un modo demo para presentar el sistema completo (8 bicicletas) sin telemetría real en todas ellas.

## Arquitectura

```
Bicicleta instrumentada (LILYGO)
        │  MQTT
        ▼
     Node-RED  ──────────────▶  InfluxDB (bucket "scada_lev")
                                       ▲
                                       │  Flux queries
                                       │
Frontend (React + Vite) ◀── HTTP ──▶ Backend (Express + SQLite)
   puerto 3000                         puerto 3001
```

- **Frontend:** React 18 + Vite + TypeScript + Material UI. Vistas de SCADA en vivo, flota de bicicletas, mapa, usuarios, reportes y métricas del sistema.
- **Backend:** Express 5. Sirve la API REST, autentica usuarios (tokens de sesión propios, sin JWT) y consulta InfluxDB con Flux.
- **Base de datos de la aplicación:** SQLite (`server/scada_ebike.db`, no se versiona -- ver `.gitignore`) para usuarios, bicicletas, sesiones y experimentos.
- **Series de tiempo:** InfluxDB v2, alimentado por Node-RED (`03_nodered_flow_calidad.json`), que recibe la telemetría por MQTT y la escribe directo al bucket -- no pasa por el backend Express.

## Requisitos previos

- Node.js 18+
- InfluxDB v2 corriendo localmente (el binario `influxdb/influxd.exe` en Windows, o tu propia instalación) con un bucket, organización y token ya creados
- Python 3 (solo para los scripts auxiliares de configuración de InfluxDB: `02_setup_influxdb.py`, `test_pivot.py`, `test_query.py`)

## Puesta en marcha

1. Instala las dependencias del frontend/backend:
   ```
   npm install
   ```
2. Copia `.env.example` a `.env` y completa los valores reales de tu InfluxDB:
   ```
   INFLUXDB_URL=http://localhost:8086
   INFLUXDB_TOKEN=...
   INFLUXDB_ORG=IPN CICATA QRO
   INFLUXDB_BUCKET=scada_lev
   ```
   `.env` nunca se sube a git (ver `.gitignore`).
3. Levanta los tres servicios a la vez:
   ```
   npm run dev:all
   ```
   o por separado: `npm run dev` (frontend, puerto 3000), `npm run server` (backend Express, puerto 3001), `npm run influx` (motor de InfluxDB).

En el primer arranque del backend, `server/db.js` crea/migra automáticamente la base de datos SQLite (`server/schema.sql`) con tres usuarios de ejemplo -- revisa `server/schema.sql` para las contraseñas semilla y cámbialas antes de usar el sistema fuera de tu máquina de desarrollo.

## Roles y acceso

El sistema deriva el rol de un usuario a partir del dominio de su correo institucional al registrarse (`pages/Register.tsx` → `POST /api/auth/register`), nunca de lo que mande el cliente:

- `@ipn.mx` → **Investigador**
- `@alumno.ipn.mx` → **Usuario Bicicleta** (requiere ID de tarjeta NFC)
- Cualquier otro correo → registro rechazado

El rol **Administrador** no se auto-asigna nunca por registro público; se crea manualmente desde el panel de Usuarios por otro Administrador. Toda cuenta auto-registrada queda pendiente de aprobación hasta que un Administrador la active desde el panel de Usuarios.

## Modo Demo

Como hoy solo una bicicleta (`B001`) tiene hardware instrumentado, el sistema incluye un interruptor "Modo Demo" (visible solo para Administradores, en la barra superior) que simula telemetría con variación suave y continua para el resto de las bicicletas del catálogo, sin marca visual distinta en la UI. `B001` nunca se simula, con o sin modo demo activo. Apagado por defecto, y siempre que el servidor se reinicia.

## Estructura del proyecto

```
pages/          Vistas de la aplicación (SCADA, flota, usuarios, reportes, métricas, login/registro)
components/      Componentes compartidos (mapa de flota, layout/barra superior)
hooks/           Lógica de datos en vivo (telemetría, bicicletas, métricas, modo demo)
context/         Contexto de autenticación (AuthContext)
services/        Cliente HTTP hacia el backend (api.ts)
server/          Backend Express: rutas, autenticación, esquema y acceso a SQLite/InfluxDB
```

## Estado del proyecto y backlog

`PLAN_MEJORAS.md` (en la raíz del repo) es el tablero vivo de seguimiento: qué se revisó, qué se resolvió y cómo se verificó, y qué queda pendiente. Es el punto de partida recomendado antes de seguir desarrollando sobre este proyecto. `STATUS.md` documenta un estado puntual anterior de la telemetría (2026-08-04); su hallazgo pendiente ya está resuelto -- ver la nota al inicio de ese archivo.
