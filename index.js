// ============================================================
//  Skateparkrubeach · API de inscripciones
//  Express + persistencia en data.json (cupo 10 por categoría).
// ============================================================

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');
const CATEGORIES = ['Iniciantes', 'Intermedios', 'Adultos', 'Avanzados'];
const DAYS = ['Lunes', 'Miércoles', 'Jueves'];
const MAX_PER_CATEGORY = 10;

// ---- persistencia ----
function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}
function save(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2));
}

// ---- rutas ----
app.get('/', (req, res) => {
  res.send('Skateparkrubeach API ✅ — ver /api/inscripciones');
});

// Lista completa (para el admin)
app.get('/api/inscripciones', (req, res) => {
  res.json(load());
});

// Cupos por categoría
app.get('/api/cupos', (req, res) => {
  const list = load();
  const cupos = {};
  CATEGORIES.forEach((c) => {
    const used = list.filter((r) => r.category === c).length;
    cupos[c] = { used, remaining: Math.max(0, MAX_PER_CATEGORY - used), max: MAX_PER_CATEGORY };
  });
  res.json(cupos);
});

// Inscribir (con control de cupo en el server)
app.post('/api/inscripciones', (req, res) => {
  const { name, phone, category, day } = req.body || {};

  if (!name || String(name).trim().length < 2)
    return res.status(400).json({ error: 'Nombre inválido' });
  if (!phone || String(phone).replace(/\D/g, '').length < 6)
    return res.status(400).json({ error: 'Teléfono inválido' });
  if (!CATEGORIES.includes(category))
    return res.status(400).json({ error: 'Categoría inválida' });
  if (!DAYS.includes(day))
    return res.status(400).json({ error: 'Día inválido' });

  const list = load();
  const used = list.filter((r) => r.category === category).length;
  if (used >= MAX_PER_CATEGORY)
    return res.status(409).json({ error: `La categoría ${category} está completa` });

  const item = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
    present: false,
    name: String(name).trim(),
    phone: String(phone).trim(),
    category,
    day,
  };
  list.push(item);
  save(list);
  res.status(201).json(item);
});

// Marcar/desmarcar asistencia
app.patch('/api/inscripciones/:id', (req, res) => {
  const list = load();
  const reg = list.find((x) => x.id === req.params.id);
  if (!reg) return res.status(404).json({ error: 'No encontrado' });
  if (typeof req.body.present === 'boolean') reg.present = req.body.present;
  save(list);
  res.json(reg);
});

// Eliminar
app.delete('/api/inscripciones/:id', (req, res) => {
  const list = load();
  const next = list.filter((x) => x.id !== req.params.id);
  if (next.length === list.length) return res.status(404).json({ error: 'No encontrado' });
  save(next);
  res.json({ ok: true });
});

app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
  console.log('Endpoints: GET /api/inscripciones · GET /api/cupos · POST/PATCH/DELETE /api/inscripciones');
});
