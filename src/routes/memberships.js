const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// POST /api/memberships — crea o actualiza la membresía (con su precio)
router.post('/', async (req, res) => {
  const { inscripcion_id, precio } = req.body || {};
  const precioNum = Number(precio);

  if (!inscripcion_id) return res.status(400).json({ error: 'Falta inscripcion_id' });
  if (!Number.isFinite(precioNum) || precioNum <= 0)
    return res.status(400).json({ error: 'Precio inválido' });

  try {
    const ins = await pool.query('SELECT 1 FROM inscripciones WHERE id = $1', [inscripcion_id]);
    if (!ins.rowCount) return res.status(404).json({ error: 'Inscripción no encontrada' });

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const { rows } = await pool.query(
      `INSERT INTO memberships (id, inscripcion_id, precio)
       VALUES ($1, $2, $3)
       ON CONFLICT (inscripcion_id) DO UPDATE SET precio = EXCLUDED.precio
       RETURNING id, inscripcion_id AS "inscripcionId", precio::float8 AS precio,
                 clases_restantes AS "clasesRestantes", created_at AS "createdAt"`,
      [id, inscripcion_id, precioNum]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

// PATCH /api/memberships/:inscripcionId/usar-clase — resta 1 clase restante
router.patch('/:inscripcionId/usar-clase', async (req, res) => {
  const { inscripcionId } = req.params;

  try {
    const { rows } = await pool.query(
      `UPDATE memberships
       SET clases_restantes = GREATEST(clases_restantes - 1, 0)
       WHERE inscripcion_id = $1
       RETURNING id, inscripcion_id AS "inscripcionId", precio::float8 AS precio,
                 clases_restantes AS "clasesRestantes", created_at AS "createdAt"`,
      [inscripcionId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Membresía no encontrada' });
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error de base de datos' });
  }
});

module.exports = router;
