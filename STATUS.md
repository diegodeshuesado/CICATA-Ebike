# Estado del Sistema de Telemetría SCADA LEVs - IPN CICATA Querétaro
**Fecha de actualización:** 2026-08-19

> Este documento describe el estado del sistema en 2026-08-04. Desde entonces se hizo una revisión completa de seguridad, integridad de datos y funcionalidad -- ver `PLAN_MEJORAS.md` en la raíz del proyecto para el backlog vivo y el registro de cambios detallado. La sección 3 de abajo (que en 2026-08-04 describía un bug pendiente) ya está resuelta; se dejó tachada en vez de borrada para que quede el historial de qué se diagnosticó y cómo se corrigió.

---

## 1. Resumen de Cambios Realizados

### Backend & Ingesta (Node-RED + InfluxDB + Express)
* **Estandarización de Identificadores:** Se configuró el nodo `Preparar Influx Payload` en Node-RED para forzar la firma de la etiqueta `bike_id: "B001"` en el bucket `scada_lev`.
* **Transformación Pivot:** Se implementó la cláusula `pivot()` en las consultas Flux de Express (`server/index.js`) para unificar la serie de tiempo en objetos planos.
* **Manejo de Tiempos:** Se corrigió el filtrado por marcas de tiempo en el backend para evitar estados con fecha/hora congelada.

### Frontend (React + Vite)
* **Depuración de Mock Data:** Se eliminaron los valores por defecto hardcodeados (`48.0V`, `576.0W`) en `useTelemetry.ts`, `api.ts` y componentes de vista. Las métricas vacías o nulas ahora muestran de forma consistente la convención `--`.
* **Mapeo del GPS:** Se alinearon los campos de coordenadas (`latitud`/`longitud` → `lat`/`lng`) logrando que el marcador de Leaflet posicione en tiempo real sobre el centro `[20.5896, -100.3780]`.
* **Desestructuración Segura:** Se implementaron defensas de tipo (`safeFormat` / null-guards) para evitar que el dashboard colapse cuando la API devuelve propiedades nulas o incompletas.

---

## 2. Estado Actual de la Telemetría (Avances Verificados)

| Variable | Node-RED (MQTT Streaming) | React HMI (SCADA B001) | Estado |
| :--- | :--- | :--- | :--- |
| **Tiempo (Última Act.)** | En vivo (`2:28:09 a.m.`) | En vivo (`2:28:09 a.m.`) | **Sincronizado** |
| **Voltaje (`v_bus`)** | $38.64\text{ V}$ | $38.6\text{ V}$ | **Sincronizado** |
| **Corriente (`i_motor`)** | $-60.77\text{ A}$ | $-60.8\text{ A}$ | **Sincronizado** |
| **Potencia (`potencia_w`)** | $-2348.23\text{ W}$ | $-2347.8\text{ W}$ | **Sincronizado** |
| **Ubicación GPS** | `20.5897, -100.3780` | Centrado en mapa | **Sincronizado** |
| **Inclinación Pitch** | $-2.7^\circ$ | $-9.5^\circ$ | *Pendiente de alineación* |
| **Inclinación Roll** | $-18.3^\circ$ | $-2.4^\circ$ | *Pendiente de alineación* |
| **Temperatura / Acel.** | $29.6\text{ }^\circ\text{C}$ / $0.0\text{ G}$ | $28.4\text{ }^\circ\text{C}$ / $1.84\text{ m/s}^2$ | *Pendiente de alineación* |

---

## 3. ~~Tareas Pendientes (Pendiente Principal)~~ -- ✅ Resuelto (ver `PLAN_MEJORAS.md`, punto F4)

### ~~A. Desfase de Array Index en `useTelemetry`~~ -- ✅ Resuelto
* **Diagnóstico (2026-08-04):** La API `/api/influx/telemetry` devuelve un arreglo con 5 muestras históricas `(5) [{...}, ...]`. El frontend consume la primera posición `[0]` del arreglo en lugar de la más reciente (`[data.length - 1]`), lo que genera una lectura atrasada en sensores de rápida variación como Pitch, Roll y Temperatura.
* ~~**Acción Requerida:**~~ **Ya implementado:**
  1. ✅ `server/index.js` ya aplica `sort(columns: ["_time"], desc: true)` y `limit(n: ...)` para que la API entregue la(s) muestra(s) más reciente(s).
  2. ✅ `hooks/useTelemetry.ts` ya implementa un `reduce` por `_time` (línea ~80) para garantizar que la vista en React siempre renderice la estampa con el tiempo más alto.
* **Nota (2026-08-19):** al confirmar que esto ya estaba resuelto, se encontró un efecto secundario no documentado: el `limit(n: 1)` quedó fijo para *todos* los callers del endpoint, así que `pages/BikeDetails.tsx` -- que pide `-30d` de historial para su gráfica y tabla -- solo recibía 1 muestra en vez de un historial real. Se agregó un parámetro opcional `?limit=N` (1-500, default 1 para no cambiar el comportamiento de SCADA/`getBikes`) para que quien sí necesite historial pueda pedirlo explícitamente. Detalle completo en `PLAN_MEJORAS.md`, punto F4.
