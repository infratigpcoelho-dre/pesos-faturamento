// Arquivo: backend/server.js (VERSÃO NEON + PERMISSÕES MASTER/AUDITOR/MOTORISTA)

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
// Puxando o Secret das variáveis que você configurou na Vercel
const JWT_SECRET = process.env.JWT_SECRET || 'bE3r]=98Gne<c=$^iezw7Bf68&5zPU319rW#pPa9iegutMeJ1y1y18moHW8Z[To5'; 

// Conexão com o Neon usando a URL que você confirmou
const db = new Client({
  connectionString: process.env.POSTGRES_URL_NO_SSL + "?sslmode=require",
  ssl: { rejectUnauthorized: false }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage: storage });

async function setupDatabase() {
  try {
    await db.connect();
    console.log("✅ Conectado ao Neon com sucesso!");

    // Criar Tabela de Lançamentos
    await db.query(`
      CREATE TABLE IF NOT EXISTS lancamentos (
        id SERIAL PRIMARY KEY, data TEXT, horapostada TEXT, origem TEXT,
        destino TEXT, iniciodescarga TEXT, terminodescarga TEXT, tempodescarga TEXT,
        ticket TEXT, pesoreal REAL, tarifa REAL, nf TEXT, cavalo TEXT,
        motorista TEXT, valorfrete REAL, obs TEXT, produto TEXT, caminhonf TEXT
      )
    `);

    // Criar Tabela de Usuários com suporte a ROLES
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'motorista',
        nome_completo TEXT,
        cpf TEXT,
        cnh TEXT,
        placa_cavalo TEXT,
        placas_carretas TEXT
      )
    `);

    // --- CRIAÇÃO AUTOMÁTICA DO SEU MASTER ---
    const userCheck = await db.query("SELECT * FROM users WHERE username = 'patrickmaster'");
    if (userCheck.rowCount === 0) {
      const hashedPass = await bcrypt.hash('0o9i8u1q2w3e', 10);
      await db.query(
        "INSERT INTO users (username, password, role, nome_completo) VALUES ($1, $2, $3, $4)",
        ['patrickmaster', hashedPass, 'master', 'Patrick Audrey']
      );
      console.log("⭐ Usuário patrickmaster criado com sucesso!");
    }

  } catch (err) {
    console.error('❌ Erro no setup do banco:', err);
  }
}

// --- Middlewares de Segurança ---
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) return res.sendStatus(401); 

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); 
    req.user = user; // Aqui o Node salva os dados do usuário logado
    next(); 
  });
}

// --- ROTAS DE AUTENTICAÇÃO ---
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });

    const user = result.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });

    // IMPORTANTE: Incluindo role e nome no Token
    const token = jwt.sign({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      nome_completo: user.nome_completo 
    }, JWT_SECRET, { expiresIn: '8h' });

    res.json({ message: 'Login bem-sucedido!', token, role: user.role, nome_completo: user.nome_completo });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno' });
  }
});

// --- ROTAS DE LANÇAMENTOS (COM FILTRO DE MASTER) ---
app.get('/lancamentos', authenticateToken, async (req, res) => { 
  try { 
    const { role, nome_completo } = req.user;
    let query = 'SELECT * FROM lancamentos';
    let params = [];

    // LÓGICA DE VISÃO: Se for motorista, filtra. Se for master/auditor, SELECT total.
    if (role === 'motorista') {
      query += ' WHERE motorista = $1';
      params.push(nome_completo);
    }

    query += ' ORDER BY id DESC';
    const result = await db.query(query, params); 
    res.json(result.rows); 
  } catch(e){ res.status(500).json({e}) } 
});

// ROTA POST (Lancamentos)
app.post('/lancamentos', authenticateToken, upload.single('arquivoNf'), async (req, res) => { 
  if (req.user.role === 'visualizador') return res.status(403).json({ error: 'Auditores não podem criar.' });
  try { 
    const dados = req.body;
    const caminhoNf = req.file ? req.file.filename : null;
    const r = await db.query(
      `INSERT INTO lancamentos (data, horapostada, origem, destino, iniciodescarga, terminodescarga, tempodescarga, ticket, pesoreal, tarifa, nf, cavalo, motorista, valorfrete, obs, produto, caminhonf) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`, 
      [dados.data, dados.horapostada, dados.origem, dados.destino, dados.iniciodescarga, dados.terminodescarga, dados.tempodescarga, dados.ticket, Number(dados.pesoreal)||0, Number(dados.tarifa)||0, dados.nf, dados.cavalo, dados.motorista, Number(dados.valorfrete)||0, dados.obs, dados.produto, caminhoNf]
    ); 
    res.status(201).json(r.rows[0]); 
  } catch(e){ res.status(500).json({error: e.message}) } 
});

// ROTA PUT (Editar)
app.put('/lancamentos/:id', authenticateToken, upload.single('arquivoNf'), async (req, res) => { 
  if (req.user.role === 'visualizador') return res.status(403).json({ error: 'Auditores não podem editar.' });
  try { 
    const { id } = req.params;
    const dados = req.body;
    
    const check = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (check.rowCount === 0) return res.status(404).json({error: 'Não encontrado'});

    let f = check.rows[0].caminhonf; 
    if (req.file) f = req.file.filename;

    const r = await db.query(
      `UPDATE lancamentos SET data=$1, horapostada=$2, origem=$3, destino=$4, iniciodescarga=$5, terminodescarga=$6, tempodescarga=$7, ticket=$8, pesoreal=$9, tarifa=$10, nf=$11, cavalo=$12, motorista=$13, valorfrete=$14, obs=$15, produto=$16, caminhonf=$17 WHERE id=$18 RETURNING *`, 
      [dados.data, dados.horapostada, dados.origem, dados.destino, dados.iniciodescarga, dados.terminodescarga, dados.tempodescarga, dados.ticket, Number(dados.pesoreal)||0, Number(dados.tarifa)||0, dados.nf, dados.cavalo, dados.motorista, Number(dados.valorfrete)||0, dados.obs, dados.produto, f, id]
    ); 
    res.json(r.rows[0]); 
  } catch(e){ res.status(500).json({error: e.message}) } 
});

// --- ROTAS DE UTILIZADORES (ADMIN) ---
app.get('/api/utilizadores', authenticateToken, async (req, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Apenas Master.' });
  const r = await db.query("SELECT id, username, nome_completo, role FROM users WHERE role != 'master'");
  res.json(r.rows);
});

app.post('/api/utilizadores', authenticateToken, async (req, res) => {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Apenas Master.' });
  const { username, password, role, nome_completo } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  const r = await db.query(
    `INSERT INTO users (username, password, role, nome_completo) VALUES ($1, $2, $3, $4) RETURNING id, username, role`,
    [username, hashed, role, nome_completo]
  );
  res.status(201).json(r.rows[0]);
});

// Inicia
setupDatabase().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor ON na porta ${PORT}`));
});