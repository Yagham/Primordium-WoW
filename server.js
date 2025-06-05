const express = require('express');
const path = require('path');
const mysql = require('mysql2/promise'); 
const crypto = require('crypto');
const app = express();
app.use(express.json());
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


// Endpoint de registro de usuarios
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  // Validaciones básicas
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan username o password' });
  }

  try {
    // 1) Conectar a la base de datos 'auth'
    const conn = await mysql.createConnection({
      host:     'localhost',
      user:     'root',
      password: 'Dani3269',
      database: 'auth'
    });

    // 2) Comprobar si ya existe ese nombre de usuario
    const [rows] = await conn.execute(
      'SELECT COUNT(*) AS cuenta_existente FROM account WHERE username = ?;',
      [username]
    );
    if (rows[0].cuenta_existente > 0) {
      await conn.end();
      return res.status(409).json({ error: 'Usuario ya existe' });
    }

    // 3) Generar el hash SHA1 en mayúsculas con formato USER:PASS (requisito de Core 3.3.5a)
    const hashInput = username.toUpperCase() + ':' + password.toUpperCase();
    const sha1 = crypto.createHash('sha1').update(hashInput).digest('hex').toUpperCase();

    // 4) Insertar en auth.account
    await conn.execute(
      'INSERT INTO account (username, sha_pass_hash, email) VALUES (?, ?, ?);',
      [username, sha1, null]
    );

    await conn.end();
    return res.status(201).json({ message: 'Cuenta creada correctamente' });
  } catch (err) {
    console.error('Error en /api/register:', err);
    return res.status(500).json({ error: 'Error al crear la cuenta' });
  }
});

// Endpoint para obtener personajes de una cuenta a partir de su username
app.get('/api/characters', async (req, res) => {
  const username = (req.query.username || '').toUpperCase();
  if (!username) {
    return res.status(400).json({ error: 'Falta el parámetro username' });
  }

  try {
    // 1) Conectar a auth para obtener el ID de cuenta
    const connAuth = await mysql.createConnection({
      host:     'localhost',
      user:     'root',
      password: 'Dani3269',
      database: 'auth'
    });
    const [acctRows] = await connAuth.execute(
      'SELECT id FROM account WHERE username = ?;',
      [username]
    );
    if (acctRows.length === 0) {
      await connAuth.end();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const accountId = acctRows[0].id;
    await connAuth.end();

    // 2) Conectar a la base de datos de personajes (usualmente 'characters' o 'world')
    const connChars = await mysql.createConnection({
      host:     'localhost',
      user:     'root',
      password: 'Dani3269',
      database: 'characters' // o el nombre correcto de tu BD de personajes
    });

    // 3) Traer los personajes de esa cuenta (campo 'account' en la tabla)
    const [charRows] = await connChars.execute(
      'SELECT name, level, race, class FROM characters WHERE account = ?;',
      [accountId]
    );
    await connChars.end();

    return res.json({ characters: charRows });
  } catch (err) {
    console.error('Error en /api/characters:', err);
    return res.status(500).json({ error: 'Error al obtener personajes' });
  }
});

const jsrp = require('jsrp');

// Objeto en memoria para guardar instancias SRP de servidor
// Clave: username, Valor: instancia de jsrp.server
const srpServers = {};

// Endpoint para iniciar SRP en login
app.get('/api/login/start', async (req, res) => {
  const username = (req.query.username || '').toUpperCase();
  if (!username) {
    return res.status(400).json({ error: 'Falta el parámetro username' });
  }

  try {
    // 1) Conectarse a auth para obtener salt y verifier
    const connAuth = await mysql.createConnection({
      host:     'localhost',
      user:     'root',
      password: 'Dani3269',
      database: 'auth'
    });
    const [rows] = await connAuth.execute(
      'SELECT HEX(salt) AS salt_hex, HEX(verifier) AS verifier_hex FROM account WHERE username = ?;',
      [username]
    );
    await connAuth.end();
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // 2) Crear una nueva instancia SRP de servidor
    const server = new jsrp.server();
    // Inicializar con parámetros de WoW (hash: SHA-1, N y g estándar)
    server.init({
      salt:      rows[0].salt_hex,      // salt en hex
      verifier:  rows[0].verifier_hex,  // verifier en hex
      hash:      'SHA-1',
      // N y g por defecto en jsrp (compatibles con WoW)
    });

    // 3) Obtener valor público B
    const B = server.getPublicKey(); // hex string

    // 4) Guardar instancia en memoria para este usuario
    srpServers[username] = server;

    // 5) Responder con salt y B
    return res.json({
      salt: rows[0].salt.toString('hex'),
      B: B
    });
  } catch (err) {
    console.error('Error en /api/login/start:', err);
    return res.status(500).json({ error: 'Error interno al iniciar login' });
  }
});
// Endpoint para finalizar SRP en login
app.post('/api/login/finish', async (req, res) => {
  const { username, A, M1 } = req.body || {};
  if (!username || !A || !M1) {
    return res.status(400).json({ error: 'Faltan parámetros SRP' });
  }
  const user = username.toUpperCase();
  try {
    // 1) Buscar la instancia de servidor guardada en srpServers
    const server = srpServers[user];
    if (!server) {
      return res.status(400).json({ error: 'Sesión SRP no encontrada' });
    }

    // 2) Poner A y M1 en la instancia de servidor para verificar
    server.setClientPublicKey(A);
    const isValid = server.checkClientProof(M1); // true o false
    if (!isValid) {
      return res.status(401).json({ error: 'Prueba del cliente inválida' });
    }

    // 3) Obtener M2 (la prueba del servidor)
    const M2 = server.getProof();

    // 4) (Opcional) Aquí podrías generar un token de sesión o cookie
    //    pero por ahora devolvemos solo M2.
    return res.json({ M2: M2 });
  } catch (err) {
    console.error('Error en /api/login/finish:', err);
    return res.status(500).json({ error: 'Error interno al finalizar login' });
  }
});
// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});