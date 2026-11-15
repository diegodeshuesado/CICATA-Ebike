
import { Bike, Trip, User, UserRole } from './types';

export const COLORS = {
  ipnGuinda: '#7C2041',
  white: '#FFFFFF',
  grayDark: '#3C3C3B',
  grayMedium: '#6D6E71',
  grayLight: '#DCDDDE',
  greenActive: '#4CAF50',
  yellowMaint: '#FFC107',
  redInactive: '#F44336',
  blueInfo: '#2196F3',
};

export const MOCK_USERS: User[] = [
  { id: 'u1', email: 'admin@ipn.mx', nombre: 'Diego Gutiérrez Hernández', rol: UserRole.ADMIN },
  { id: 'u2', email: 'investigador@ipn.mx', nombre: 'Ana López', rol: UserRole.INVESTIGADOR },
  { id: 'u3', email: 'usuario@ipn.mx', nombre: 'Carlos Ramírez', rol: UserRole.USUARIO, nfc: 'ABC123456', bicicletaAsignada: 'B001' },
];

export const MOCK_BIKES: Bike[] = [
  { id: "B001", modelo: "Urban Commuter Pro", numero_serie: "LEV-2024-001", estado: "activa", bateria: 85, ubicacion: { lat: 20.5888, lng: -100.3899 }, ultimo_dato: "hace 2 segundos", temperatura: 42, velocidad: 18.5 },
  { id: "B002", modelo: "City E-Bike Plus", numero_serie: "LEV-2024-002", estado: "activa", bateria: 92, ubicacion: { lat: 20.5895, lng: -100.3905 }, ultimo_dato: "hace 1 segundo", temperatura: 38, velocidad: 22.3 },
  { id: "B003", modelo: "Cargo Electric", numero_serie: "LEV-2024-003", estado: "mantenimiento", bateria: 60, ubicacion: { lat: 20.5880, lng: -100.3890 }, ultimo_dato: "hace 2 horas", temperatura: 25, velocidad: 0 },
  { id: "B004", modelo: "Sport E-Bike", numero_serie: "LEV-2024-004", estado: "activa", bateria: 78, ubicacion: { lat: 20.5892, lng: -100.3910 }, ultimo_dato: "hace 5 segundos", temperatura: 45, velocidad: 25.1 },
  { id: "B005", modelo: "Urban Commuter Pro", numero_serie: "LEV-2024-005", estado: "activa", bateria: 45, ubicacion: { lat: 20.5885, lng: -100.3895 }, ultimo_dato: "hace 3 segundos", temperatura: 48, velocidad: 15.2 },
  { id: "B006", modelo: "City E-Bike Plus", numero_serie: "LEV-2024-006", estado: "inactiva", bateria: 12, ubicacion: { lat: 20.5878, lng: -100.3888 }, ultimo_dato: "hace 1 día", temperatura: 22, velocidad: 0 },
  { id: "B007", modelo: "Cargo Electric", numero_serie: "LEV-2024-007", estado: "activa", bateria: 88, ubicacion: { lat: 20.5900, lng: -100.3920 }, ultimo_dato: "hace 1 segundo", temperatura: 40, velocidad: 20.8 },
  { id: "B008", modelo: "Sport E-Bike", numero_serie: "LEV-2024-008", estado: "mantenimiento", bateria: 55, ubicacion: { lat: 20.5883, lng: -100.3892 }, ultimo_dato: "hace 3 horas", temperatura: 28, velocidad: 0 }
];

export const MOCK_TRIPS: Trip[] = [
  { fecha: "2024-12-22 08:30", distancia: 5.2, energia: 45, duracion: "18 min" },
  { fecha: "2024-12-21 17:15", distancia: 3.8, energia: 32, duracion: "12 min" },
  { fecha: "2024-12-21 09:00", distancia: 6.5, energia: 58, duracion: "22 min" },
  { fecha: "2024-12-20 18:30", distancia: 4.1, energia: 38, duracion: "15 min" },
  { fecha: "2024-12-20 08:45", distancia: 5.7, energia: 48, duracion: "19 min" },
  { fecha: "2024-12-19 17:00", distancia: 7.2, energia: 65, duracion: "25 min" },
  { fecha: "2024-12-19 08:30", distancia: 5.0, energia: 43, duracion: "17 min" },
  { fecha: "2024-12-18 19:15", distancia: 3.5, energia: 30, duracion: "11 min" },
  { fecha: "2024-12-18 09:30", distancia: 6.8, energia: 60, duracion: "23 min" },
  { fecha: "2024-12-17 17:45", distancia: 4.8, energia: 42, duracion: "16 min" }
];
