
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
}

export type BikeStatus = 'activa' | 'inactiva' | 'mantenimiento';

export interface Location {
  lat: number;
  lng: number;
}

export interface Bike {
  id: string;
  modelo: string;
  numero_serie: string;
  estado: BikeStatus;
  bateria: number;
  ubicacion: Location;
  ultimo_dato: string;
  temperatura: number;
  velocidad: number;
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
