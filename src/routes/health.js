const express = require('express');
const { pool } = require('../db');

const router = express.Router();

router.get('/', (req, res) => {
  res.send('Skatepark Perubeach API ✅ (PostgreSQL) — ver /api/inscripciones');
});

// Health check para Render (verifica también la conexión a la base).
router.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'up' });
  } catch {
    res.status(503).json({ status: 'error', db: 'down' });
  }
});

module.exports = router;
