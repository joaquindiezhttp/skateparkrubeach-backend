const express = require('express');
const { pool } = require('../db');
const { CATEGORIES, DAYS, MAX_PER_CATEGORY, COLS } = require('../constants');

const router = express.Router();

// GET /api/inscripciones — lista completa con datos de membresía.
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT i.id, i.name, i.phone, i.category, i.day, i.present,
             i.created_at AS "createdAt",
             (m.id IS NOT NULL) AS membresia,
             m.precio::float8 AS precio,
             m.clases_restantes AS "clasesRestantes"
      FROM inscripciones i
      LEFT JOIN memberships m ON m.inscripcion_id = i.id
      ORDER BY i.created_at
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

// POST /api/inscripciones — inscribe. INSERT condicional respeta el cupo
// de forma atómica (no insert si la categoría está llena).
router.post('/', async (req, res) => {
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

// PATCH /api/inscripciones/:id — marcar/desmarcar asistencia.
router.patch('/:id', async (req, res) => {
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

// DELETE /api/inscripciones/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM inscripciones WHERE id = $1',
      [req.params.id]
    );
    if (!rowCount) return res.status(404).json({ error: 'No encontrado' });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

module.exports = router;
