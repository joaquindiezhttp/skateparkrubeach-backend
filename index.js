// ============================================================
//  Skateparkrubeach · API de inscripciones (PostgreSQL)
//  Express + cors + pg. Cupo 10 por categoría enforced en SQL.
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { pool, init } = require('./db');

if (!process.env.DATABASE_URL) {
  console.error('⚠️  Falta DATABASE_URL. Copiá .env.example a .env y pegá tu conexión de Neon.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

const CATEGORIES = ['Iniciantes', 'Intermedios', 'Adultos', 'Avanzados'];
const DAYS = ['Lunes', 'Miércoles', 'Jueves'];
const MAX_PER_CATEGORY = 10;

// columnas con alias camelCase para que el front no cambie
const COLS = 'id, name, phone, category, day, present, created_at AS "createdAt"';

app.get('/', (req, res) => {
  res.send('Skateparkrubeach API ✅ (PostgreSQL) — ver /api/inscripciones');
});

// Lista completa (para el admin)
app.get('/api/inscripciones', async (req, res) => {
  try {
    const { rows } = await pool.query(`SELECT ${COLS} FROM inscripciones ORDER BY created_at`);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

// Cupos por categoría
app.get('/api/cupos', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT category, count(*)::int AS used FROM inscripciones GROUP BY category'
    );
    const cupos = {};
    CATEGORIES.forEach((c) => {
      cupos[c] = { used: 0, remaining: MAX_PER_CATEGORY, max: MAX_PER_CATEGORY };
    });
    rows.forEach((r) => {
      if (cupos[r.category]) {
        cupos[r.category].used = r.used;
        cupos[r.category].remaining = Math.max(0, MAX_PER_CATEGORY - r.used);
      }
    });
    res.json(cupos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

// Inscribir — el INSERT condicional respeta el cupo de forma atómica
app.post('/api/inscripciones', async (req, res) => {
  const { name, phone, category, day } = req.body || {};

  if (!name || String(name).trim().length < 2)
    return res.status(400).json({ error: 'Nombre inválido' });
  if (!phone || String(phone).replace(/\D/g, '').length < 6)
    return res.status(400).json({ error: 'Teléfono inválido' });
  if (!CATEGORIES.includes(category))
    return res.status(400).json({ error: 'Categoría inválida' });
  if (!DAYS.includes(day))
    return res.status(400).json({ error: 'Día inválido' });

  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

  try {
    const { rows } = await pool.query(
      `INSERT INTO inscripciones (id, name, phone, category, day)
       SELECT $1, $2, $3, $4, $5
       WHERE (SELECT count(*) FROM inscripciones WHERE category = $4) < $6
       RETURNING ${COLS}`,
      [id, String(name).trim(), String(phone).trim(), category, day, MAX_PER_CATEGORY]
    );
    if (!rows.length)
      return res.status(409).json({ error: `La categoría ${category} está completa` });
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

// Marcar/desmarcar asistencia
app.patch('/api/inscripciones/:id', async (req, res) => {
  if (typeof req.body.present !== 'boolean')
    return res.status(400).json({ error: 'present debe ser booleano' });
  try {
    const { rows } = await pool.query(
      `UPDATE inscripciones SET present = $1 WHERE id = $2 RETURNING ${COLS}`,
      [req.body.present, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'No encontrado' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

// Eliminar
app.delete('/api/inscripciones/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM inscripciones WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('Conectado a PostgreSQL · tabla "inscripciones" lista');
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar a la base:', err.message);
    process.exit(1);
  });
