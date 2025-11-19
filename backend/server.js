// Arquivo: backend/server.js (VERSÃO FINAL 100% COMPLETA E CORRIGIDA PARA DEPLOY)

const express = require('express');
const { Client } = require('pg');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const PORT = process.env.PORT || 3001; 
const JWT_SECRET = 'bE3r]=98Gne<c=$^iezw7Bf68&5zPU319rW#pPa9iegutMeJ1y1y18moHW8Z[To5'; 

// ****** CORREÇÃO CRÍTICA: URL CORRETA DO BANCO DE DADOS ******
// Esta é a URL correta do seu banco de dados PostgreSQL. O erro anterior era usar o endereço HTTP do site.
const DATABASE_URL = 'postgresql://bdpesos_user:UAnZKty8Q8FieCQPoW6wTNJEspOUfPbw@dpg-d3ra513e5dus73b586l0-a.oregon-postgres.render.com/bdpesos';

const db = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage: storage });

async function setupDatabase() {
  try {
    await db.connect();
    console.log("Conectado ao banco de dados com sucesso!");
  } catch (err) {
    console.error("Erro ao conectar ao banco (verifique a URL e o IP no Render):", err);
    throw err; // Lança o erro para o servidor Render parar
  }
  
  // 1. Criação das Tabelas Principais
  await db.query(`
    CREATE TABLE IF NOT EXISTS lancamentos (
      id SERIAL PRIMARY KEY, data TEXT, horapostada TEXT, origem TEXT,
      destino TEXT, iniciodescarga TEXT, terminodescarga TEXT, tempodescarga TEXT,
      ticket TEXT, pesoreal REAL, tarifa REAL, nf TEXT, cavalo TEXT,
      motorista TEXT, valorfrete REAL, obs TEXT, produto TEXT,
      caminhonf TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // 2. Tabelas Auxiliares
  await db.query(`CREATE TABLE IF NOT EXISTS produtos (id SERIAL PRIMARY KEY, nome TEXT UNIQUE NOT NULL)`);
  await db.query(`CREATE TABLE IF NOT EXISTS origens (id SERIAL PRIMARY KEY, nome TEXT UNIQUE NOT NULL)`);
  await db.query(`CREATE TABLE IF NOT EXISTS destinos (id SERIAL PRIMARY KEY, nome TEXT UNIQUE NOT NULL)`);

  // 3. Migrações (Adiciona colunas de ROLES e MOTORISTA se não existirem)
  try { await db.query(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'motorista'`); } catch (err) { if (err.code !== '42701') console.error("Erro migração role:", err.message); }
  try { await db.query(`ALTER TABLE users ADD COLUMN nome_completo TEXT`); } catch (err) { if (err.code !== '42701') console.error("Erro migração nome:", err.message); }
  try { await db.query(`ALTER TABLE users ADD COLUMN cpf TEXT`); } catch (err) { if (err.code !== '42701') console.error("Erro migração cpf:", err.message); }
  try { await db.query(`ALTER TABLE users ADD COLUMN cnh TEXT`); } catch (err) { if (err.code !== '42701') console.error("Erro migração cnh:", err.message); }
  try { await db.query(`ALTER TABLE users ADD COLUMN placa_cavalo TEXT`); } catch (err) { if (err.code !== '42701') console.error("Erro migração placa:", err.message); }
  try { await db.query(`ALTER TABLE users ADD COLUMN placas_carretas TEXT`); } catch (err) { if (err.code !== '42701') console.error("Erro migração carretas:", err.message); }
}

// --- Middlewares de Segurança ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) return res.sendStatus(401); 
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); 
    req.user = user;
    next(); 
  });
}

function authenticateMaster(req, res, next) {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Acesso negado. Master apenas.' });
  next();
}

function authenticateAnalyticsAccess(req, res, next) {
  if (req.user.role !== 'master' && req.user.role !== 'visualizador') return res.status(403).json({ error: 'Acesso negado.' });
  next();
}

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role', [username, hashedPassword, 'motorista']);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Nome de usuário já existe.' });
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});
app.post('/register-master', async (req, res) => {
  try {
    const { username, password, nome_completo } = req.body;
    if (!username || !password || !nome_completo) return res.status(400).json({ error: 'Login, senha e nome completo são obrigatórios.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query('INSERT INTO users (username, password, role, nome_completo) VALUES ($1, $2, $3, $4) RETURNING id, username, role', [username, hashedPassword, 'master', nome_completo]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Nome de usuário já existe.' });
    console.error('Erro ao registrar master:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const r = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (r.rowCount === 0) return res.status(401).json({error: 'Inválido'});
    const user = r.rows[0];
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ id: user.id, username: user.username, role: user.role, nome_completo: user.nome_completo }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ message: 'OK', token, role: user.role, nome_completo: user.nome_completo, placa_cavalo: user.placa_cavalo });
    } else {
      res.status(401).json({error: 'Inválido'});
    }
  } catch(e) { res.status(500).json({error: e.message}); }
});

// --- ROTAS DE LANÇAMENTOS (PROTEGIDAS E FILTRADAS) ---
app.get('/lancamentos', authenticateToken, async (req, res) => { 
  try {
    const { role, nome_completo } = req.user;
    let query = 'SELECT * FROM lancamentos';
    let params = [];
    if (role === 'motorista') {
      query += ' WHERE motorista = $1';
      params.push(nome_completo);
    }
    query += ' ORDER BY id DESC';
    const result = await db.query(query, params); 
    res.json(result.rows); 
  } catch(e){ res.status(500).json({e}) } 
});

app.get('/lancamentos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, nome_completo } = req.user;
    let query = 'SELECT * FROM lancamentos WHERE id = $1';
    let params = [id];
    if (role === 'motorista') {
      query += ' AND motorista = $2';
      params.push(nome_completo);
    }
    const result = await db.query(query, params);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Não encontrado' });
    res.json(result.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/lancamentos', authenticateToken, upload.single('arquivoNf'), async (req, res) => { 
  if (req.user.role === 'visualizador') return res.status(403).json({error: 'Acesso negado'});
  try { 
    const d = req.body;
    const f = req.file ? req.file.filename : null;
    const r = await db.query(
      `INSERT INTO lancamentos (data, horapostada, origem, destino, iniciodescarga, terminodescarga, tempodescarga, ticket, pesoreal, tarifa, nf, cavalo, motorista, valorfrete, obs, produto, caminhonf) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`, 
      [d.data, d.horapostada, d.origem, d.destino, d.iniciodescarga, d.terminodescarga, d.tempodescarga, d.ticket, Number(d.pesoreal)||0, Number(d.tarifa)||0, d.nf, d.cavalo, d.motorista, Number(d.valorfrete)||0, d.obs, d.produto, f]
    ); 
    res.status(201).json(r.rows[0]); 
  } catch(e){ res.status(500).json({error: e.message}); }
});

app.put('/lancamentos/:id', authenticateToken, upload.single('arquivoNf'), async (req, res) => { 
  if (req.user.role === 'visualizador') return res.status(403).json({error: 'Acesso negado'});
  try { 
    const { id } = req.params;
    const d = req.body;
    const { role, nome_completo } = req.user;
    const check = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (check.rowCount === 0) return res.status(404).json({error:'Não encontrado'});
    if (role !== 'master' && check.rows[0].motorista !== nome_completo) return res.status(403).json({error: 'Acesso negado'});

    let f = check.rows[0].caminhonf; 
    if (req.file) f = req.file.filename;
    
    const r = await db.query(
      `UPDATE lancamentos SET data=$1, horapostada=$2, origem=$3, destino=$4, iniciodescarga=$5, terminodescarga=$6, tempodescarga=$7, ticket=$8, pesoreal=$9, tarifa=$10, nf=$11, cavalo=$12, motorista=$13, valorfrete=$14, obs=$15, produto=$16, caminhonf=$17 
       WHERE id=$18 RETURNING *`, 
      [d.data, d.horapostada, d.origem, d.destino, d.iniciodescarga, d.terminodescarga, d.tempodescarga, d.ticket, Number(d.pesoreal)||0, Number(d.tarifa)||0, d.nf, d.cavalo, d.motorista, Number(d.valorfrete)||0, d.obs, d.produto, f, id]
    ); 
    res.json(r.rows[0]); 
  } catch(e){ res.status(500).json({error: e.message}); }
});

app.delete('/lancamentos/:id', authenticateToken, async (req, res) => { 
  if (req.user.role === 'visualizador') return res.status(403).json({error: 'Acesso negado'});
  try { 
    const { id } = req.params;
    const { role, nome_completo } = req.user;
    const check = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (check.rowCount === 0) return res.status(404).json({error:'Não encontrado'});
    if (role !== 'master' && check.rows[0].motorista !== nome_completo) return res.status(403).json({error: 'Acesso negado'});
    if (check.rows[0].caminhonf) fs.unlink(path.join(__dirname, 'uploads', check.rows[0].caminhonf), ()=>{});
    await db.query('DELETE FROM lancamentos WHERE id=$1', [id]); 
    res.status(204).send(); 
  } catch(e){ res.status(500).json({error: e.message}); }
});

// --- ROTAS DE ADMIN/UTILIZADORES ---
app.get('/api/utilizadores', authenticateToken, authenticateMaster, async (req, res) => {
  try { const r = await db.query("SELECT id, username, nome_completo, cpf, cnh, placa_cavalo, placas_carretas, role FROM users WHERE role != 'master' ORDER BY nome_completo"); res.json(r.rows); } 
  catch(e) { res.status(500).json({error: e.message}); }
});
app.post('/api/utilizadores', authenticateToken, authenticateMaster, async (req, res) => {
  const { username, password, role, nome_completo, cpf, cnh, placa_cavalo, placas_carretas } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const r = await db.query(`INSERT INTO users (username, password, role, nome_completo, cpf, cnh, placa_cavalo, placas_carretas) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`, [username, hashed, role, nome_completo, cpf, cnh, placa_cavalo, placas_carretas]);
    const u = r.rows[0]; delete u.password; res.status(201).json(u);
  } catch(e) { res.status(500).json({error: e.message}); }
});
app.put('/api/utilizadores/:id', authenticateToken, authenticateMaster, async (req, res) => {
    const { id } = req.params;
    const { nome_completo, cpf, cnh, placa_cavalo, placas_carretas, password, role } = req.body;
    try {
        if (password) {
            const hashed = await bcrypt.hash(password, 10);
            await db.query(`UPDATE users SET nome_completo=$1, cpf=$2, cnh=$3, placa_cavalo=$4, placas_carretas=$5, password=$6, role=$7 WHERE id=$8`, [nome_completo, cpf, cnh, placa_cavalo, placas_carretas, hashed, role, id]);
        } else {
            await db.query(`UPDATE users SET nome_completo=$1, cpf=$2, cnh=$3, placa_cavalo=$4, placas_carretas=$5, role=$6 WHERE id=$7`, [nome_completo, cpf, cnh, placa_cavalo, placas_carretas, role, id]);
        }
        res.json({msg: "Atualizado"});
    } catch(e) { res.status(500).json({error: e.message}); }
});
app.delete('/api/utilizadores/:id', authenticateToken, authenticateMaster, async (req, res) => {
  try { await db.query("DELETE FROM users WHERE id=$1 AND role != 'master'", [req.params.id]); res.sendStatus(204); }
  catch(e) { res.status(500).json({error: e.message}); }
});

// --- ROTAS DE PRODUTOS / ORIGENS / DESTINOS / ANALYTICS ---
app.get('/api/produtos', authenticateToken, async (req, res) => { const r = await db.query("SELECT * FROM produtos ORDER BY nome"); res.json(r.rows); });
app.post('/api/produtos', authenticateToken, authenticateMaster, async (req, res) => { const r = await db.query("INSERT INTO produtos (nome) VALUES ($1) RETURNING *", [req.body.nome]); res.status(201).json(r.rows[0]); });
app.put('/api/produtos/:id', authenticateToken, authenticateMaster, async (req, res) => { await db.query("UPDATE produtos SET nome=$1 WHERE id=$2", [req.body.nome, req.params.id]); res.json({msg:"OK"}); });
app.delete('/api/produtos/:id', authenticateToken, authenticateMaster, async (req, res) => { await db.query("DELETE FROM produtos WHERE id=$1", [req.params.id]); res.sendStatus(204); });

app.get('/api/origens', authenticateToken, async (req, res) => { const r = await db.query("SELECT * FROM origens ORDER BY nome"); res.json(r.rows); });
app.post('/api/origens', authenticateToken, authenticateMaster, async (req, res) => { const r = await db.query("INSERT INTO origens (nome) VALUES ($1) RETURNING *", [req.body.nome]); res.status(201).json(r.rows[0]); });
app.put('/api/origens/:id', authenticateToken, authenticateMaster, async (req, res) => { await db.query("UPDATE origens SET nome=$1 WHERE id=$2", [req.body.nome, req.params.id]); res.json({msg:"OK"}); });
app.delete('/api/origens/:id', authenticateToken, authenticateMaster, async (req, res) => { await db.query("DELETE FROM origens WHERE id=$1", [req.params.id]); res.sendStatus(204); });

app.get('/api/destinos', authenticateToken, async (req, res) => { const r = await db.query("SELECT * FROM destinos ORDER BY nome"); res.json(r.rows); });
app.post('/api/destinos', authenticateToken, authenticateMaster, async (req, res) => { const r = await db.query("INSERT INTO destinos (nome) VALUES ($1) RETURNING *", [req.body.nome]); res.status(201).json(r.rows[0]); });
app.put('/api/destinos/:id', authenticateToken, authenticateMaster, async (req, res) => { await db.query("UPDATE destinos SET nome=$1 WHERE id=$2", [req.body.nome, req.params.id]); res.json({msg:"OK"}); });
app.delete('/api/destinos/:id', authenticateToken, authenticateMaster, async (req, res) => { await db.query("DELETE FROM destinos WHERE id=$1", [req.params.id]); res.sendStatus(204); });

app.get('/api/analytics/peso-por-motorista', authenticateToken, authenticateAnalyticsAccess, async (req, res) => {
  const r = await db.query("SELECT motorista, SUM(pesoreal) as total_peso FROM lancamentos WHERE motorista IS NOT NULL AND motorista != '' AND pesoreal > 0 GROUP BY motorista ORDER BY total_peso DESC");
  res.json(r.rows);
});
app.get('/api/analytics/valor-por-produto', authenticateToken, authenticateAnalyticsAccess, async (req, res) => {
  const r = await db.query("SELECT produto, SUM(valorfrete) as total_valor FROM lancamentos WHERE produto IS NOT NULL AND produto != '' AND valorfrete > 0 GROUP BY produto ORDER BY total_valor DESC");
  res.json(r.rows);
});

// Inicia o servidor
setupDatabase().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor backend rodando na porta ${PORT}`));
}).catch(err => {
  console.error('❌ Falha ao iniciar o banco de dados:', err);
  if (db) db.end();
});