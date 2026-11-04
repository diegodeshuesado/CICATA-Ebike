// ─── Utilidades de contraseña (scrypt, sin dependencias externas) ───
// Usa el módulo nativo `crypto` de Node.js para no depender de paquetes
// externos (bcrypt/bcryptjs) que podrían requerir compilación nativa
// o instalación adicional en el entorno de despliegue.

import crypto from 'crypto';

const KEY_LENGTH = 64;

/**
 * Genera un hash de contraseña con sal aleatoria.
 * Formato almacenado: "<salt_hex>:<hash_hex>"
 */
export function hashPassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('La contraseña no puede estar vacía');
  }
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña en texto plano contra el hash almacenado.
 * Usa comparación en tiempo constante para evitar timing attacks.
 */
export function verifyPassword(password, storedHash) {
  if (typeof password !== 'string' || password.length === 0) return false;
  if (typeof storedHash !== 'string' || !storedHash.includes(':')) return false;

  const [salt, hashHex] = storedHash.split(':');
  if (!salt || !hashHex) return false;

  try {
    const storedBuffer = Buffer.from(hashHex, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, KEY_LENGTH);
    if (storedBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(storedBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

/**
 * Genera una contraseña temporal aleatoria (para altas de usuario que no
 * especifican contraseña, p. ej. desde el panel de administración).
 */
export function generateTempPassword() {
  return crypto.randomBytes(9).toString('base64url'); // 12 caracteres aprox.
}

/**
 * Quita el campo password_hash de un objeto usuario antes de enviarlo
 * al cliente. Nunca debe salir del backend hacia el frontend.
 */
export function stripPasswordHash(userRow) {
  if (!userRow) return userRow;
  const { password_hash, ...rest } = userRow;
  return rest;
}

// ─── Sesiones de autorización (S2) ───
// Tokens opacos de sesión persistidos en SQLite (tabla sesiones_auth),
// para no depender de JWT ni de ningún paquete externo. El servidor
// valida cada request contra esa tabla.

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

export function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function newSessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

/**
 * Extrae el token de sesión de una request: header `Authorization: Bearer <token>`
 * (usado por fetch()) o parámetro de query `?token=` (necesario para
 * EventSource, que no permite enviar headers personalizados en el navegador).
 */
export function extractToken(req) {
  const authHeader = req.headers?.authorization || '';
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }
  if (req.query && typeof req.query.token === 'string') {
    return req.query.token;
  }
  return null;
}
