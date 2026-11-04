
export enum UserRole {
  ADMIN = 'Administrador',
  INVESTIGADOR = 'Investigador',
  USUARIO = 'Usuario Bicicleta'
}

export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: UserRole;
  nfc?: string;
  bicicletaAsignada?: string;
  // F1: false para cuentas auto-registradas desde pages/Register.tsx
  // pendientes de que un Administrador las apruebe (ver
  // server/index.js POST /api/auth/register). Los usuarios dados de alta
  // directo por un Administrador, o ya existentes antes de este cambio,
  // vienen en true.
  aprobado?: boolean;
}

export type BikeStatus = 'activa' | 'inactiva' | 'mantenimiento';

export interface Location {
  lat: number;
  lng: number;
}

// F2: bateria/ubicacion/temperatura/velocidad son "| null" porque ahora
// vienen de la telemetría real (o simulada, si el modo demo está activo --
// ver D1) de cada bicicleta en vez de un valor fijo -- ver
// services/api.ts getBikes(). `null` significa honestamente "sin datos
// recientes para esta bicicleta", no se debe inventar un número para
// rellenar el hueco.
export interface Bike {
  id: string;
  modelo: string;
  numero_serie: string;
  estado: BikeStatus;
  bateria: number | null;
  ubicacion: Location | null;
  ultimo_dato: string;
  temperatura: number | null;
  velocidad: number | null;
  potencia_max_W?: number;
  // F11: relación real usuario<->bicicleta -- vive en `bicicletas_lev.usuario_asignado`
  // (server/schema.sql), no en `usuarios`. `User.bicicletaAsignada` es solo
  // lo que se muestra/edita en la UI; al guardar hay que reflejarlo aquí,
  // en la bicicleta elegida, ver pages/UsersPage.tsx.
  usuario_asignado?: string | null;
  nombre_usuario_asignado?: string | null;
}

export interface TelemetryData {
  voltaje: number;
  corriente: number;
  velocidad: number;
  temperatura: number;
  potencia: number;
  timestamp: string;
}

export interface Trip {
  fecha: string;
  distancia: number;
  energia: number;
  duracion: string;
}
