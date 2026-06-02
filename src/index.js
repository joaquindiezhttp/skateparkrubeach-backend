// ============================================================
//  Skatepark Perubeach · API de inscripciones (PostgreSQL)
//  Entry: middleware + monta routers + inicializa la base.
// ============================================================

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { init } = require('./db');

if (!process.env.DATABASE_URL) {
  console.error('⚠️  Falta DATABASE_URL. Copiá .env.example a .env y pegá tu conexión de Neon.');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

// Rutas
app.use('/', require('./routes/health'));
app.use('/api/inscripciones', require('./routes/inscripciones'));
app.use('/api/cupos', require('./routes/cupos'));
app.use('/api/memberships', require('./routes/memberships'));

const PORT = process.env.PORT || 3000;

init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en http://localhost:${PORT}`);
      console.log('Conectado a PostgreSQL · tablas listas');
    });
  })
  .catch((err) => {
    console.error('No se pudo conectar a la base:', err.message);
    process.exit(1);
  });

module.exports = app;
