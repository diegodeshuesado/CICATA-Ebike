import { User, Bike, Trip } from '../types';

export interface AlertaSistema {
  alerta_id: number;
  timestamp: string;
  bike_id: string;
  session_id?: string;
  tipo_alerta: string;
  campo?: string;
  valor?: number;
  umbral?: number;
  descripcion: string;
  atendida: number;
}

export interface CatalogoVariable {
  variable_id: number;
  measurement: string;
  campo: string;
  tipo_influxdb: string;
  tipo_dato: string;
  unidad?: string;
  rango_min?: number;
  rango_max?: number;
  umbral_alerta?: number;
  descripcion?: string;
  fuente?: string;
}

export interface SesionExperimento {
  session_id: string;
  bike_id: string;
  user_id: string;
  inicio: string;
  fin?: string;
  duracion_s: number;
  distancia_km?: number;
  energia_Wh?: number;
  oe_id: string;
  notas?: string;
  bike_modelo?: string;
  user_nombre?: string;
}

export interface InfluxTelemetryData {
  _time: string;
  v_bus?: number;
  i_motor?: number;
  potencia_w?: number;
  temp_motor?: number;
  pitch?: number;
  roll?: number;
  acel_x?: number;
  // F9: campo propio para velocidad real (m/s) -- antes, si no había dato
  // real de aceleración, el backend rellenaba `acel_x` con este mismo valor
  // (dos magnitudes físicas distintas mezcladas en un solo campo). Ahora
  // cada uno viene por separado; `undefined` significa honestamente "sin
  // dato de velocidad", no se debe aproximar desde `acel_x`.
  velocidad_ms?: number;
  // F8: el backend (server/index.js, GET /api/influx/telemetry) siempre
  // devolvió latitud/longitud, pero no estaban en este tipo -- causaba que
  // hooks/useTelemetry.ts y pages/ScadaPage.tsx los usaran igual sin que
  // TypeScript los reconociera (fallaba con --strict). Se agregan aquí.
  latitud?: number;
  longitud?: number;
  bike_id?: string;
}

// D1: los campos son "number | null" porque el backend ahora es honesto
// sobre cuándo no hay suficiente dato real -- ver server/index.js,
// GET /api/system-metrics. `null` significa "sin datos suficientes",
// nunca se rellena con un número inventado salvo que el modo demo esté
// activo explícitamente (ver getDemoMode/setDemoMode más abajo).
export interface SystemMetrics {
  latencia_promedio_ms: number | null;
  latencia_maxima_ms: number | null;
  perdida_mensajes_pct: number | null;
  jitter_ms: number | null;
  error_sincronia_ms: number | null;
  tiempo_recuperacion_s: number | null;
  tasa_adquisicion_mps: number | null;
  throughput_KBs: number | null;
  timestamp?: string;
}

// ─── MODO DEMO (D1) ───────────────────────────────────────────────────
export interface DemoModeStatus {
  enabled: boolean;
}

const API_BASE = '/api';

// ─── Token de sesión (S2) ───────────────────────────────────────────────
// El backend ahora exige "Authorization: Bearer <token>" en casi todos los
// endpoints. El token se guarda en localStorage tras un login exitoso y se
// adjunta automáticamente a cada request hecho a través de `apiFetch`.
const TOKEN_KEY = 'auth_token';

export const getAuthToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const setAuthToken = (token: string | null): void => {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
};

/**
 * Wrapper de fetch() que agrega el header Authorization automáticamente
 * cuando hay un token guardado. Todas las llamadas a la API (salvo el
 * propio login) deben pasar por aquí.
 */
const apiFetch = (path: string, options: RequestInit = {}): Promise<Response> => {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  return fetch(`${API_BASE}${path}`, { ...options, headers });
};

/**
 * Construye la URL para un EventSource (SSE) autenticado. EventSource no
 * permite mandar headers personalizados desde el navegador, así que el
 * token va como query param -- ver server/auth.js `extractToken`.
 */
export const authedEventSourceUrl = (path: string): string => {
  const token = getAuthToken();
  const sep = path.includes('?') ? '&' : '?';
  return token ? `${API_BASE}${path}${sep}token=${encodeURIComponent(token)}` : `${API_BASE}${path}`;
};

// ─── F2: helpers para derivar el estado "de flota" de una bicicleta a ───
// partir de su última lectura real de telemetría, en vez de valores fijos.
//
// No existe un sensor de "% de batería" en la telemetría real -- solo hay
// voltaje del bus (v_bus). Estos límites son una aproximación razonable
// para un paquete Li-ion de 10 celdas en serie (~3.0V/celda vacío,
// ~4.2V/celda lleno = 30V-42V), documentada aquí para que quede claro que
// es una conversión y no una medición directa.
const BATTERY_V_EMPTY = 30;
const BATTERY_V_FULL = 42;
function batteryPercentFromVoltage(v: number): number {
  const pct = ((v - BATTERY_V_EMPTY) / (BATTERY_V_FULL - BATTERY_V_EMPTY)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

// Texto relativo simple ("hace Xs" / "hace X min") a partir del timestamp
// real de la última lectura -- reemplaza el "hace 2 segundos" fijo de antes.
function formatUltimoDato(isoTime: string): string {
  const diffS = Math.round((Date.now() - new Date(isoTime).getTime()) / 1000);
  if (diffS < 5) return 'justo ahora';
  if (diffS < 60) return `hace ${diffS}s`;
  const diffMin = Math.round(diffS / 60);
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `hace ${diffH} h`;
  return `hace ${Math.round(diffH / 24)} d`;
}

// F1: error específico para "cuenta pendiente de aprobación" (backend
// responde 403 en POST /api/auth/login), distinto de "credenciales
// incorrectas" (401, sigue devolviendo `null` como antes) y de un error de
// red real (sigue lanzando y activando el fallback offline en
// AuthContext.login). Así la pantalla de login puede mostrar el mensaje
// correcto en cada caso en vez de un genérico "credenciales incorrectas".
export class PendingApprovalError extends Error {}

export const api = {
  // ─── TELEMETRÍA INFLUXDB ───
  // F4: `limit` (opcional, 1-500) le pide al backend varias muestras dentro
  // del `range` en vez de solo la más reciente -- antes el backend siempre
  // devolvía 1 sola muestra sin importar el `range` pedido, así que
  // BikeDetails.tsx pedía `-30d` de historial y su gráfica/tabla solo
  // recibían 1 punto. Sin `limit`, el comportamiento es igual que antes
  // (1 muestra, la más reciente) -- SCADA y getBikes (F2) no lo necesitan.
  getTelemetry: async (bike_id: string = 'ebike1', range: string = '-15m', limit?: number): Promise<InfluxTelemetryData[]> => {
    try {
      const limitParam = limit !== undefined ? `&limit=${encodeURIComponent(String(limit))}` : '';
      const res = await apiFetch(`/influx/telemetry?bike_id=${encodeURIComponent(bike_id)}&range=${encodeURIComponent(range)}${limitParam}`);
      if (!res.ok) throw new Error('Error al consultar telemetría InfluxDB');
      return await res.json();
    } catch (err) {
      console.warn('Error al obtener telemetría InfluxDB:', err);
      return [];
    }
  },

  // ─── USUARIOS ───
  getUsers: async (): Promise<User[]> => {
    try {
      const res = await apiFetch('/users');
      if (!res.ok) throw new Error('Error al cargar usuarios de la BD');
      const data = await res.json();
      return data.map((u: any) => ({
        id: u.id,
        email: u.email,
        nombre: u.nombre,
        rol: u.rol,
        nfc: u.nfc_token || undefined,
        // SQLite guarda `aprobado` como 0/1 -- se convierte a boolean real.
        aprobado: u.aprobado === undefined ? true : Boolean(u.aprobado),
      }));
    } catch (err) {
      console.warn('Backend API desconectado o sin permisos, usando fallback local:', err);
      return [];
    }
  },

  // F1: aprueba una cuenta auto-registrada (ver `register` más abajo) para
  // que su dueño pueda iniciar sesión. Solo Administrador.
  approveUser: async (id: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/users/${id}/aprobar`, { method: 'PUT' });
      return res.ok;
    } catch (err) {
      console.warn('Error al aprobar usuario:', err);
      return false;
    }
  },

  // NOTA: si no se pasa `password`, el backend genera una contraseña
  // temporal aleatoria y la incluye una sola vez en la respuesta
  // (`temp_password`). La UI de Usuarios todavía no la muestra al admin
  // -- ver punto F6 en PLAN_MEJORAS.md.
  createUser: async (user: Partial<User> & { password?: string }): Promise<User & { temp_password?: string }> => {
    const res = await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify({
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        nfc_token: user.nfc,
        password: user.password,
      }),
    });
    if (!res.ok) throw new Error('Error al crear usuario en la BD');
    const u = await res.json();
    return {
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      nfc: u.nfc_token,
      temp_password: u.temp_password,
    };
  },

  // F10: antes `hooks/useUsers.ts` solo actualizaba el estado local de
  // React -- estos endpoints no existían en el backend, así que cualquier
  // edición se perdía al recargar la página. Devuelve el usuario tal como
  // quedó guardado en la BD (o lanza si el backend lo rechaza, p. ej.
  // correo duplicado).
  updateUser: async (id: string, updates: Partial<User>): Promise<User> => {
    const res = await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: updates.nombre,
        email: updates.email,
        rol: updates.rol,
        nfc_token: updates.nfc,
      }),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) throw new Error(body.error || 'Error al actualizar usuario en la BD');
    return {
      id: body.id,
      email: body.email,
      nombre: body.nombre,
      rol: body.rol,
      nfc: body.nfc_token,
      aprobado: body.aprobado === undefined ? true : Boolean(body.aprobado),
    };
  },

  deleteUser: async (id: string): Promise<void> => {
    const res = await apiFetch(`/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const body = await res.json().catch(() => ({} as any));
      throw new Error(body.error || 'Error al eliminar usuario en la BD');
    }
  },

  // NOTA: a propósito NO se atrapa el error de red aquí (fetch que lanza
  // excepción por backend caído). AuthContext.login lo necesita para
  // distinguir "servidor inalcanzable" (permite fallback local) de
  // "credenciales inválidas" (res.ok === false, no debe haber fallback).
  // El login NO pasa por apiFetch porque todavía no hay token que mandar.
  login: async (email: string, password: string): Promise<User | null> => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 403) {
      // F1: cuenta auto-registrada todavía sin aprobar por un Administrador
      // -- caso distinto de "credenciales incorrectas", se lanza para que
      // la pantalla de login pueda mostrar el mensaje correcto.
      const body = await res.json().catch(() => ({} as any));
      throw new PendingApprovalError(body.error || 'Tu cuenta todavía no ha sido aprobada por un administrador');
    }
    if (!res.ok) return null; // 401: credenciales incorrectas -- respuesta válida del servidor
    const u = await res.json();
    if (u.token) setAuthToken(u.token);
    return {
      id: u.id,
      email: u.email,
      nombre: u.nombre,
      rol: u.rol,
      nfc: u.nfc_token,
    };
  },

  // F1: auto-registro público (pages/Register.tsx). No usa apiFetch porque
  // todavía no hay token -- quien llama esto no tiene cuenta. La cuenta se
  // crea sin aprobar; `login()` la rechazará hasta que un Administrador la
  // apruebe desde el panel de Usuarios.
  register: async (data: { nombre: string; email: string; password: string; nfc_token?: string }): Promise<{ rol: string }> => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({} as any));
    if (!res.ok) {
      throw new Error(body.error || 'No se pudo completar el registro');
    }
    return { rol: body.rol };
  },

  // Invalida el token en el servidor (borra la sesión de sesiones_auth) y
  // limpia el guardado local. Si el backend está inalcanzable, igual se
  // limpia localmente para no dejar al usuario atorado.
  logout: async (): Promise<void> => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('No se pudo notificar el logout al backend:', err);
    } finally {
      setAuthToken(null);
    }
  },

  // Verifica si el token guardado localmente sigue siendo válido en el
  // servidor (usado al arrancar la app para no quedarse con una sesión
  // fantasma tras expirar o tras un logout en otra pestaña/dispositivo).
  // Devuelve: User si el token es válido, null si el servidor lo rechazó
  // explícitamente (hay que cerrar sesión), o undefined si no se pudo
  // verificar por un error de red (se deja la sesión local como estaba,
  // para permitir el modo offline).
  verifySession: async (): Promise<User | null | undefined> => {
    if (!getAuthToken()) return null;
    try {
      const res = await apiFetch('/auth/me');
      if (!res.ok) return null; // token inválido/expirado: NO es error de red
      const u = await res.json();
      return { id: u.id, email: u.email, nombre: u.nombre, rol: u.rol, nfc: u.nfc };
    } catch (err) {
      console.warn('No se pudo verificar la sesión con el backend:', err);
      return undefined;
    }
  },

  // ─── BICICLETAS LEV ───
  // F2: antes, TODAS las bicicletas mostraban la misma batería/temperatura/
  // velocidad/ubicación fijas, sin importar si tenían telemetría real o no.
  // Ahora se pide, para cada una, su última lectura de `/api/influx/telemetry`
  // -- el mismo endpoint que ya usa el SCADA -- que ya respeta el modo demo
  // (D1): la bicicleta con hardware real (B001) muestra su dato real; si el
  // modo demo está activo, el resto muestra su lectura simulada; si no,
  // se queda honestamente sin datos (`null`) en vez de inventar un número.
  getBikes: async (): Promise<Bike[]> => {
    try {
      const res = await apiFetch('/bikes');
      if (!res.ok) throw new Error('Error al cargar bicicletas de la BD');
      const data = await res.json();

      return await Promise.all(data.map(async (b: any) => {
        const lecturas = await api.getTelemetry(b.id, '-30s');
        const ultima = lecturas.length > 0
          ? lecturas.reduce((prev, curr) =>
              new Date(curr._time).getTime() > new Date(prev._time).getTime() ? curr : prev)
          : null;

        return {
          id: b.id,
          modelo: b.modelo,
          numero_serie: b.numero_serie,
          estado: b.estado,
          bateria: (ultima && typeof ultima.v_bus === 'number') ? batteryPercentFromVoltage(ultima.v_bus) : null,
          ubicacion: (ultima && typeof ultima.latitud === 'number' && typeof ultima.longitud === 'number')
            ? { lat: ultima.latitud, lng: ultima.longitud }
            : null,
          ultimo_dato: ultima ? formatUltimoDato(ultima._time) : 'Sin datos',
          temperatura: (ultima && typeof ultima.temp_motor === 'number') ? ultima.temp_motor : null,
          // F9 resuelto: antes se aproximaba la velocidad multiplicando
          // `acel_x * 3.6` -- una conversión sin base física real (nunca
          // fue una integración de aceleración de verdad, solo un factor de
          // escala arbitrario), heredada de que `acel_x` a veces en
          // realidad contenía `velocidad_ms` por un fallback del backend
          // que ya se quitó (ver server/index.js). Ahora que `velocidad_ms`
          // viene como campo propio, se usa directo (m/s -> km/h); si no
          // hay dato real de velocidad, se queda honestamente en `null` en
          // vez de inventar un número a partir de la aceleración.
          velocidad: (ultima && typeof ultima.velocidad_ms === 'number') ? Number((ultima.velocidad_ms * 3.6).toFixed(1)) : null,
          potencia_max_W: b.potencia_max_W,
          usuario_asignado: b.usuario_asignado,
          nombre_usuario_asignado: b.nombre_usuario_asignado,
        };
      }));
    } catch (err) {
      console.warn('Backend API desconectado, usando fallback local:', err);
      return [];
    }
  },

  createBike: async (bike: Partial<Bike>): Promise<Bike> => {
    const res = await apiFetch('/bikes', {
      method: 'POST',
      body: JSON.stringify({
        id: bike.id,
        modelo: bike.modelo,
        numero_serie: bike.numero_serie,
        estado: bike.estado,
        potencia_max_W: (bike as any).potencia_max_W || 500,
        usuario_asignado: (bike as any).usuario_asignado || null,
      }),
    });
    if (!res.ok) throw new Error('Error al crear bicicleta en la BD');
    const b = await res.json();
    return {
      id: b.id,
      modelo: b.modelo,
      numero_serie: b.numero_serie,
      estado: b.estado,
      bateria: 100,
      ubicacion: { lat: 20.5888, lng: -100.3899 },
      ultimo_dato: 'Recién añadida',
      temperatura: 25,
      velocidad: 0,
    };
  },

  updateBike: async (id: string, bikeData: Partial<Bike>): Promise<void> => {
    await apiFetch(`/bikes/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        modelo: bikeData.modelo,
        estado: bikeData.estado,
        potencia_max_W: (bikeData as any).potencia_max_W,
        usuario_asignado: (bikeData as any).usuario_asignado,
      }),
    });
  },

  // ─── ALERTAS ───
  getAlerts: async (): Promise<AlertaSistema[]> => {
    try {
      const res = await apiFetch('/alerts');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  atenderAlerta: async (id: number): Promise<void> => {
    await apiFetch(`/alerts/${id}/atender`, { method: 'PUT' });
  },

  // ─── CATÁLOGO INFLUXDB ───
  getCatalogo: async (): Promise<CatalogoVariable[]> => {
    try {
      const res = await apiFetch('/catalogo');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  // ─── SESIONES ───
  getSessions: async (): Promise<SesionExperimento[]> => {
    try {
      const res = await apiFetch('/sessions');
      if (!res.ok) return [];
      return await res.json();
    } catch (err) {
      return [];
    }
  },

  // ─── MÉTRICAS DE RENDIMIENTO DEL SISTEMA ───
  getSystemMetrics: async (): Promise<SystemMetrics | null> => {
    try {
      const res = await apiFetch('/system-metrics');
      if (!res.ok) throw new Error('Error al consultar métricas del sistema');
      return await res.json();
    } catch (err) {
      console.warn('Error al obtener métricas del sistema:', err);
      return null;
    }
  },

  // ─── MODO DEMO (D1) ───
  // Permite mostrar el sistema con datos simulados (bicicletas sin
  // hardware instrumentado) para poder exponer el desarrollo completo,
  // sin presentarlos como una medición real en ningún otro lado.
  getDemoMode: async (): Promise<DemoModeStatus | null> => {
    try {
      const res = await apiFetch('/demo-mode');
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  },

  setDemoMode: async (enabled: boolean): Promise<DemoModeStatus | null> => {
    try {
      const res = await apiFetch('/demo-mode', {
        method: 'POST',
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      return null;
    }
  },
};
