// ============================================================
//  Skateparkrubeach · conexión a PostgreSQL
// ============================================================

const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

// Neon / Supabase / Railway requieren SSL. Local (localhost) no.
const isLocal = connectionString && /localhost|127\.0\.0\.1/.test(connectionString);

const pool = new Pool({
  connectionString,
  ssl: isLocal ? false : { rejectUnauthorized: false },
});

// Crea la tabla si no existe (se corre al arrancar el server).
async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inscripciones (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      phone       TEXT NOT NULL,
      category    TEXT NOT NULL,
      day         TEXT NOT NULL,
      present     BOOLEAN NOT NULL DEFAULT FALSE,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
}

module.exports = { pool, init };
