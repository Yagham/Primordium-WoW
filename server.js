const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise');    // <<-- línea nueva

const app = express();
const port = 3000;

// Función para obtener una conexión a la base de datos
async function getDbConnection() {
  return await mysql.createConnection({
    host:     'localhost',    // <-- Cambia si tu host es distinto
    user:     'root',   // <-- Pon aquí tu usuario MySQL
    password: 'Dani3269',  // <-- Pon aquí tu contraseña MySQL
    database: 'characters'    // <<– Tu base de datos se llama “characters”
  });
}
// Servir archivos estáticos (tu frontend: index.html, CSS, JS, assets, etc.)
app.use(express.static(path.join(__dirname)));

// Endpoint real: consulta la BD para obtener cantidad de personajes online
app.get('/api/estado-servidor', async (req, res) => {
  try {
    // Obtener conexión a MySQL
    const conn = await getDbConnection();

    // 1) Contar cuántos personajes están online
    const [onlineRows] = await conn.execute(
      'SELECT COUNT(*) AS jugadores_online FROM characters WHERE online = 1;'
    );
    const onlineCount = onlineRows[0].jugadores_online;

    // 2) (Opcional) Contar cuántos personajes totales existen
    const [totalRows] = await conn.execute(
      'SELECT COUNT(*) AS total_characters FROM characters;'
    );
    const totalCount = totalRows[0].total_characters;

    // Cerrar conexión
    await conn.end();

    // Armar respuesta JSON
    res.json({
      status: onlineCount > 0 ? 'online' : 'offline',
      players: onlineCount,
      maxPlayers: totalCount,
      uptime: 'N/A' // o ajusta según prefieras
    });
  } catch (err) {
    console.error('Error en /api/estado-servidor:', err);
    res.status(500).json({ error: 'No se pudo consultar la base de datos' });
  }
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});