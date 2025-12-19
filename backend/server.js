const express = require('express');
const { Pool } = require('pg');
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

// Conexão Inteligente: Usa Variável de Ambiente (Vercel) ou String Direta (Local)
const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_UIbJmSlA7Yx1@ep-snowy-art-acuhaiwf-pooler.sa-east-1.aws.neon.tech/neondb?sslmode=require';

const db = new Pool({
  connectionString: connectionString,
  ssl: { rejectUnauthorized: false }
});

// Configuração de Upload de Arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './uploads';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage: storage });

// Setup inicial do Banco de Dados
async function setupDatabase() {
  try {
    await db.query('SELECT NOW()');
    console.log("✅ Conexão com Neon PostgreSQL (Pool) ativa!");
    
    // Tabela de Usuários
    await db.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, 
      username TEXT UNIQUE NOT NULL, 
      password TEXT NOT NULL, 
      role TEXT DEFAULT 'motorista', 
      nome_completo TEXT, 
      cpf TEXT, 
      cnh TEXT, 
      placa_cavalo TEXT, 
      placas_carretas TEXT
    )`);

    // Tabela de Lançamentos
    await db.query(`CREATE TABLE IF NOT EXISTS lancamentos (
      id SERIAL PRIMARY KEY, data TEXT, horapostada TEXT, origem TEXT, destino TEXT, 
      iniciodescarga TEXT, terminodescarga TEXT, tempodescarga TEXT, ticket TEXT, 
      pesoreal REAL, tarifa REAL, nf TEXT, cavalo TEXT, motorista TEXT, 
      valorfrete REAL, obs TEXT, produto TEXT, caminhonf TEXT
    )`);

    // Tabelas Auxiliares
    await db.query(`CREATE TABLE IF NOT EXISTS produtos (id SERIAL PRIMARY KEY, nome TEXT UNIQUE NOT NULL)`);
    await db.query(`CREATE TABLE IF NOT EXISTS origens (id SERIAL PRIMARY KEY, nome TEXT UNIQUE NOT NULL)`);
    await db.query(`CREATE TABLE IF NOT EXISTS destinos (id SERIAL PRIMARY KEY, nome TEXT UNIQUE NOT NULL)`);

    console.log("✅ Tabelas verificadas/criadas no Neon.");
  } catch (err) {
    console.error("❌ Erro no setup do banco:", err);
  }
}

// --- MIDDLEWARES DE SEGURANÇA ---

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (!token) return res.sendStatus(401); 
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); 
    req.user = user;
    next(); 
  });
}

function isAdmin(req, res, next) {
  if (req.user.role !== 'master') return res.status(403).json({ error: 'Acesso negado. Somente Master.' });
  next();
}

function isNotAuditor(req, res, next) {
  if (req.user.role === 'auditor') return res.status(403).json({ error: 'Auditores não podem alterar registros.' });
  next();
}

// --- ROTAS DE AUTENTICAÇÃO ---

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const r = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (r.rowCount === 0) return res.status(401).json({error: 'Usuário inválido'});
    const user = r.rows[0];
    if (await bcrypt.compare(password, user.password)) {
      const token = jwt.sign({ 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        nome_completo: user.nome_completo 
      }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ 
        token, 
        role: user.role, 
        nome_completo: user.nome_completo, 
        placa_cavalo: user.placa_cavalo 
      });
    } else {
      res.status(401).json({error: 'Senha incorreta'});
    }
  } catch(e) { res.status(500).json({error: e.message}); }
});

// --- ROTAS DE LANÇAMENTOS ---

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
  } catch(e){ res.status(500).json({error: e.message}) } 
});

app.post('/lancamentos', authenticateToken, isNotAuditor, upload.single('arquivoNf'), async (req, res) => { 
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

app.put('/lancamentos/:id', authenticateToken, isNotAuditor, upload.single('arquivoNf'), async (req, res) => { 
  try { 
    const { id } = req.params;
    const d = req.body;
    const { role, nome_completo } = req.user;
    const check = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (check.rowCount === 0) return res.status(404).json({error:'Não encontrado'});
    if (role === 'motorista' && check.rows[0].motorista !== nome_completo) return res.status(403).json({error: 'Acesso negado'});

    let f = check.rows[0].caminhonf; 
    if (req.file) f = req.file.filename;
    
    const r = await db.query(
      `UPDATE lancamentos SET data=$1, horapostada=$2, origem=$3, destino=$4, iniciodescarga=$5, terminodescarga=$6, tempodescarga=$7, ticket=$8, pesoreal=$9, tarifa=$10, nf=$11, cavalo=$12, motorista=$13, valorfrete=$14, obs=$15, produto=$16, caminhonf=$17 WHERE id=$18 RETURNING *`, 
      [d.data, d.horapostada, d.origem, d.destino, d.iniciodescarga, d.terminodescarga, d.tempodescarga, d.ticket, Number(d.pesoreal)||0, Number(d.tarifa)||0, d.nf, d.cavalo, d.motorista, Number(d.valorfrete)||0, d.obs, d.produto, f, id]
    ); 
    res.json(r.rows[0]); 
  } catch(e){ res.status(500).json({error: e.message}); }
});

app.delete('/lancamentos/:id', authenticateToken, isNotAuditor, async (req, res) => { 
  try { 
    const { id } = req.params;
    const { role, nome_completo } = req.user;
    const check = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (check.rowCount === 0) return res.status(404).json({error:'Não encontrado'});
    if (role === 'motorista' && check.rows[0].motorista !== nome_completo) return res.status(403).json({error: 'Acesso negado'});
    
    if (check.rows[0].caminhonf) {
        const filePath = path.join(__dirname, 'uploads', check.rows[0].caminhonf);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    
    await db.query('DELETE FROM lancamentos WHERE id=$1', [id]); 
    res.status(204).send(); 
  } catch(e){ res.status(500).json({error: e.message}); }
});

// --- GESTÃO DE UTILIZADORES (SÓ MASTER) ---

app.get('/api/utilizadores', authenticateToken, isAdmin, async (req, res) => {
  try {
    const r = await db.query("SELECT id, username, nome_completo, cpf, cnh, placa_cavalo, placas_carretas, role FROM users ORDER BY nome_completo");
    res.json(r.rows);
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.post('/api/utilizadores', authenticateToken, isAdmin, async (req, res) => {
  const { username, password, role, nome_completo, cpf, cnh, placa_cavalo, placas_carretas } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const r = await db.query(
      `INSERT INTO users (username, password, role, nome_completo, cpf, cnh, placa_cavalo, placas_carretas) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, username, role`, 
      [username, hashed, role, nome_completo, cpf, cnh, placa_cavalo, placas_carretas]
    );
    res.status(201).json(r.rows[0]);
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.put('/api/utilizadores/:id', authenticateToken, isAdmin, async (req, res) => {
  const { id } = req.params;
  const { nome_completo, cpf, cnh, placa_cavalo, placas_carretas, password, role } = req.body;
  try {
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await db.query(`UPDATE users SET nome_completo=$1, cpf=$2, cnh=$3, placa_cavalo=$4, placas_carretas=$5, password=$6, role=$7 WHERE id=$8`, [nome_completo, cpf, cnh, placa_cavalo, placas_carretas, hashed, role, id]);
    } else {
      await db.query(`UPDATE users SET nome_completo=$1, cpf=$2, cnh=$3, placa_cavalo=$4, placas_carretas=$5, role=$6 WHERE id=$7`, [nome_completo, cpf, cnh, placa_cavalo, placas_carretas, role, id]);
    }
    res.json({msg: "OK"});
  } catch(e) { res.status(500).json({error: e.message}); }
});

app.delete('/api/utilizadores/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id=$1", [req.params.id]);
    res.sendStatus(204);
  } catch(e) { res.status(500).json({error: e.message}); }
});

// --- ROTAS AUXILIARES ---

app.get('/api/produtos', authenticateToken, async (req, res) => { 
    try { const r = await db.query("SELECT * FROM produtos ORDER BY nome"); res.json(r.rows); } catch(e) { res.status(500).send(e.message); }
});
app.get('/api/origens', authenticateToken, async (req, res) => { 
    try { const r = await db.query("SELECT * FROM origens ORDER BY nome"); res.json(r.rows); } catch(e) { res.status(500).send(e.message); }
});
app.get('/api/destinos', authenticateToken, async (req, res) => { 
    try { const r = await db.query("SELECT * FROM destinos ORDER BY nome"); res.json(r.rows); } catch(e) { res.status(500).send(e.message); }
});

// --- ANALYTICS PARA GRÁFICOS ---

app.get('/api/analytics/peso-por-produto', authenticateToken, async (req, res) => {
  try {
    const r = await db.query("SELECT produto, SUM(pesoreal) as total FROM lancamentos GROUP BY produto");
    res.json(r.rows);
  } catch(e) { res.status(500).send(e.message); }
});

// --- LÓGICA DE INICIALIZAÇÃO ---

if (process.env.NODE_ENV !== 'production') {
  setupDatabase().then(() => {
    app.listen(PORT, () => console.log(`✅ Servidor rodando localmente na porta ${PORT}`));
  });
} else {
  setupDatabase();
}

// Export para Vercel
module.exports = app;

// --- ROTAS DE SUPORTE/CONFIGURAÇÃO ---

app.get('/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT id, username, role FROM users');
    res.json({ status: "Conexão OK!", usuarios: result.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/setup-master', async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE username = 'admin'");
    const hashed = await bcrypt.hash('123', 10);
    await db.query(`INSERT INTO users (username, password, role, nome_completo) VALUES ('admin', $1, 'master', 'Administrador Master')`, [hashed]);
    res.send("✅ Master 'admin' criado com senha '123'!");
  } catch (err) { res.status(500).send(err.message); }
});