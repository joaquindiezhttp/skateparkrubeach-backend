// Valores compartidos por las rutas y la lógica de cupo.
exports.CATEGORIES = ['Iniciantes', 'Intermedios', 'Adultos', 'Avanzados'];
exports.DAYS = ['Lunes', 'Miércoles', 'Jueves'];
exports.MAX_PER_CATEGORY = 10;
// Columnas con alias camelCase para que el front reciba `createdAt`.
exports.COLS = 'id, name, phone, category, day, present, created_at AS "createdAt"';
