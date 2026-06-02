const express = require('express');
const { pool } = require('../db');
const { CATEGORIES, MAX_PER_CATEGORY } = require('../constants');

const router = express.Router();

// GET /api/cupos — cuántos lugares quedan por categoría.
router.get('/', async (req, res) => {
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

module.exports = router;
