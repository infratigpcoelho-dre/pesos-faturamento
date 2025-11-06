// Arquivo: backend/server.js (VERSÃO FINAL COM MIGRAÇÃO AUTOMÁTICA)

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

// ATENÇÃO: Confirme que sua URL do Render está aqui
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
  await db.connect(); 
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS lancamentos (
      id SERIAL PRIMARY KEY, data TEXT, horapostada TEXT, origem TEXT,
      destino TEXT, iniciodescarga TEXT, terminodescarga TEXT, tempodescarga TEXT,
      ticket TEXT, pesoreal REAL, tarifa REAL, nf TEXT, cavalo TEXT,
      motorista TEXT, valorfrete REAL, obs TEXT, produto TEXT,
      caminhonf TEXT
    )
  `);

  // Cria a tabela 'users' (pode ser a versão antiga sem 'role')
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
  
  // ****** NOSSA MIGRAÇÃO AUTOMÁTICA ******
  // Adiciona a coluna 'role' SE ELA NÃO EXISTIR
  try {
    await db.query(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'motorista'`);
    console.log("MIGRAÇÃO: Coluna 'role' adicionada com sucesso.");
  } catch (err) {
    if (err.code === '42701') {
      // 42701 = "duplicate_column" (coluna já existe)
      console.log("MIGRAÇÃO: Coluna 'role' já existe. Pulando.");
    } else {
      // Se for outro erro, nós queremos saber
      console.error("Erro na migração da coluna 'role':", err);
      throw err;
    }
  }
  // ****** FIM DA MIGRAÇÃO ******
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
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id, username, role', 
      [username, hashedPassword, 'master']
    );
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
    const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rowCount === 0) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    const user = result.rows[0];
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login bem-sucedido!', token, role: user.role });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// ****** NOSSO "SEGURANÇA" (Middleware) ******
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  if (token == null) return res.sendStatus(401); 
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erro de token:', err.message);
      return res.sendStatus(403); 
    }
    req.user = user;
    next(); 
  });
}

// --- ROTAS DE LANÇAMENTOS (PROTEGIDAS) ---
app.get('/lancamentos', authenticateToken, async (req, res) => { 
  try { 
    const result = await db.query('SELECT * FROM lancamentos ORDER BY id DESC'); 
    res.json(result.rows); 
  } catch(e){ 
    res.status(500).json({e}) 
  } 
});

app.get('/lancamentos/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao buscar lançamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

app.post('/lancamentos', authenticateToken, upload.single('arquivoNf'), async (req, res) => { 
  try { 
    const dados = req.body;
    const caminhoNf = req.file ? req.file.filename : null;
    const r = await db.query(
      `INSERT INTO lancamentos (data, horapostada, origem, destino, iniciodescarga, terminodescarga, tempodescarga, ticket, pesoreal, tarifa, nf, cavalo, motorista, valorfrete, obs, produto, caminhonf) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`, 
      [dados.data || null, dados.horapostada || null, dados.origem || null, dados.destino || null, dados.iniciodescarga || null,
       dados.terminodescarga || null, dados.tempodescarga || null, dados.ticket || null,
       Number(dados.pesoreal)||0, Number(dados.tarifa)||0,
       dados.nf || null, dados.cavalo || null, dados.motorista || null,
       Number(dados.valorfrete)||0, dados.obs || null, dados.produto || null,
       caminhoNf]
    ); 
    res.status(201).json(r.rows[0]); 
  } catch(e){ console.error("Erro no POST:", e); res.status(500).json({error: e.message}) } 
});

app.put('/lancamentos/:id', authenticateToken, upload.single('arquivoNf'), async (req, res) => { 
  try { 
    const { id } = req.params;
    const dados = req.body;
    const lancamentoAtualResult = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (lancamentoAtualResult.rowCount === 0) return res.status(404).json({e:'Não encontrado'});
    const lancamentoAtual = lancamentoAtualResult.rows[0];
    let caminhoNf = lancamentoAtual.caminhonf; 
    if (req.file) {
      if (lancamentoAtual.caminhonf) {
        fs.unlink(path.join(__dirname, 'uploads', lancamentoAtual.caminhonf), (err) => {
          if (err) console.error("Erro ao deletar arquivo antigo na edição:", err);
        });
      }
      caminhoNf = req.file.filename;
    }
    const r = await db.query(
      `UPDATE lancamentos SET data=$1, horapostada=$2, origem=$3, destino=$4, iniciodescarga=$5, terminodescarga=$6, tempodescarga=$7, ticket=$8, pesoreal=$9, tarifa=$10, nf=$11, cavalo=$12, motorista=$13, valorfrete=$14, obs=$15, produto=$16, caminhonf=$17 
       WHERE id=$18 RETURNING *`, 
      [dados.data || null, dados.horapostada || null, dados.origem || null, dados.destino || null, dados.iniciodescarga || null,
       dados.terminodescarga || null, dados.tempodescarga || null, dados.ticket || null,
       Number(dados.pesoreal)||0, Number(dados.tarifa)||0,
       dados.nf || null, dados.cavalo || null, dados.motorista || null,
       Number(dados.valorfrete)||0, dados.obs || null, dados.produto || null,
       caminhoNf, id]
    ); 
    res.json(r.rows[0]); 
  } catch(e){ console.error("Erro no PUT:", e); res.status(500).json({error: e.message}) } 
});

app.delete('/lancamentos/:id', authenticateToken, async (req, res) => { 
  try { 
    const { id } = req.params;
    const lancamentoResult = await db.query('SELECT * FROM lancamentos WHERE id = $1', [id]);
    if (lancamentoResult.rowCount > 0) {
      const lancamento = lancamentoResult.rows[0];
      if (lancamento.caminhonf) {
        fs.unlink(path.join(__dirname, 'uploads', lancamento.caminhonf), (err) => {
          if (err) console.error("Erro ao deletar arquivo:", err);
        });
      }
    }
    const r = await db.query('DELETE FROM lancamentos WHERE id=$1', [id]); 
    if(r.rowCount === 0) return res.status(404).json({e:'Não encontrado'}); 
    res.status(204).send(); 
  } catch(e){ console.error("Erro no DELETE:", e); res.status(500).json({error: e.message}) } 
});

// Inicia o servidor
setupDatabase().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor backend rodando na porta ${PORT}`));
}).catch(err => {
  console.error('❌ Falha ao iniciar o banco de dados:', err);
  if (db) db.end();
});