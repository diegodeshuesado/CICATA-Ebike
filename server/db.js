import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'scada_ebike.db');
const schemaPath = path.join(__dirname, 'schema.sql');

sqlite3.verbose();

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos SQLite:', err.message);
  } else {
    console.log('Conectado exitosamente a la base de datos SQLite:', dbPath);
    initDb();
  }
});

function initDb() {
  if (fs.existsSync(schemaPath)) {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    db.exec(schemaSql, (err) => {
      if (err) {
        console.error('Error al inicializar las tablas de la BD:', err.message);
      } else {
        console.log('Esquema de BD e índices verificados / inicializados correctamente.');
        migratePasswordHashColumn();
        migrateAprobadoColumn();
      }
    });
  } else {
    console.warn('No se encontró el archivo schema.sql en:', schemaPath);
  }
}

// ─── Migración: agrega password_hash a bases de datos creadas antes de
// que existiera esta columna, y siembra los hashes de demo en los
// usuarios semilla si aún no tienen contraseña asignada.
// (CREATE TABLE IF NOT EXISTS no modifica tablas ya existentes, por eso
// esta migración es necesaria además del schema.sql actualizado.)
function migratePasswordHashColumn() {
  db.run('ALTER TABLE usuarios ADD COLUMN password_hash TEXT', (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
      console.error('Error al migrar columna password_hash:', err.message);
    } else if (!err) {
      console.log('Migración aplicada: columna password_hash agregada a usuarios.');
    }

    // Backfill de contraseñas de demo para los usuarios semilla que
    // hayan quedado sin password_hash (bases de datos preexistentes).
    const seedHashes = {
      'admin@ipn.mx': 'fe6a84e442d9fb2094a26046eec57663:93611ddae39f427acdd2b9a2c2412c6a30ef600022af51f74dc763dcec3d0a79ce579374ea246f7b97d4f7d35a0c3c413346273cf4c83af64343788a221f4464',
      'investigador@ipn.mx': '264f2ff7a93e5e7a692822d9c0317610:e91aa2dc98a6f357d991da39c473b6475c490e81dce81155c84f57751a031e173df9de76d052d6fe77d85c03056ab950b5adf052cac739020b556407705eb748',
      'usuario@ipn.mx': '130effb458494d14500fa9dbf2ffbbef:2ab025f291c115f93894d0b89cec33d3c98e85bfb2a69a8a36ebd7be2579de89f17704d149c6781213b3fdaa64d3896d88d90876e0aa0044453fb229e8c41c6a',
    };
    Object.entries(seedHashes).forEach(([email, hash]) => {
      db.run(
        "UPDATE usuarios SET password_hash = ? WHERE email = ? AND (password_hash IS NULL OR password_hash = '')",
        [hash, email],
        (updateErr) => {
          if (updateErr) console.error(`Error al asignar contraseña semilla a ${email}:`, updateErr.message);
        }
      );
    });
  });
}

// ─── Migración (F1): agrega `aprobado` a bases de datos creadas antes de
// que existiera esta columna. Todas las filas existentes (creadas por un
// Administrador o sembradas manualmente) se marcan como ya aprobadas --
// solo los registros nuevos hechos por el público desde
// POST /api/auth/register nacen con aprobado = 0 a partir de ahora.
function migrateAprobadoColumn() {
  db.run('ALTER TABLE usuarios ADD COLUMN aprobado INTEGER NOT NULL DEFAULT 1', (err) => {
    if (err && !/duplicate column/i.test(err.message)) {
      console.error('Error al migrar columna aprobado:', err.message);
    } else if (!err) {
      console.log('Migración aplicada: columna aprobado agregada a usuarios (usuarios existentes marcados como aprobados).');
    }
  });
}

// Helpers promisificados para queries
export const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};
