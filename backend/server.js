// Arquivo: backend/server.js (VERSÃO FINAL COM GESTÃO DE PRODUTOS)

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

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);

  // ****** NOVA TABELA DE PRODUTOS ******
  await db.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id SERIAL PRIMARY KEY,
      nome TEXT UNIQUE NOT NULL
    )
  `);
  // ****** FIM DA NOVA TABELA ******

  // --- MIGRAÇÃO AUTOMÁTICA (Garante que as colunas existem) ---
  try {
    await db.query(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'motorista'`);
    console.log("MIGRAÇÃO: Coluna 'role' adicionada.");
  } catch (err) {
    if (err.code === '42701') console.log("MIGRAÇÃO: Coluna 'role' já existe.");
    else if (err.code !== 'ENOTFOUND') throw err; // Ignora erros de DB temporários
  }
  
  try {
    await db.query(`ALTER TABLE users ADD COLUMN nome_completo TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN cpf TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN cnh TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN placa_cavalo TEXT`);
    await db.query(`ALTER TABLE users ADD COLUMN placas_carretas TEXT`);
    console.log("MIGRAÇÃO: Colunas de motorista adicionadas.");
  } catch (err) {
    if (err.code === '42701') console.log("MIGRAÇÃO: Colunas de motorista já existem.");
    else if (err.code !== 'ENOTFOUND') throw err; // Ignora erros de DB temporários
  }
}

// --- Middlewares de Segurança (sem mudanças) ---
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
  if (req.user.role !== 'master') {
    return res.status(403).json({ error: 'Acesso negado. Requer privilégios de Master.' });
  }
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

// --- ROTAS DE ADMIN/MOTORISTAS ---
app.get('/api/motoristas', authenticateToken, authenticateMaster, async (req, res) => {
  try {
    const result = await db.query("SELECT id, username, nome_completo, cpf, cnh, placa_cavalo, placas_carretas, role FROM users WHERE role = 'motorista' ORDER BY nome_completo");
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar motoristas:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/api/motoristas', authenticateToken, authenticateMaster, async (req, res) => {
  try {
    const { username, password, nome_completo, cpf, cnh, placa_cavalo, placas_carretas } = req.body;
    if (!username || !password || !nome_completo) {
      return res.status(400).json({ error: 'Login, senha e nome completo são obrigatórios.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      `INSERT INTO users (username, password, role, nome_completo, cpf, cnh, placa_cavalo, placas_carretas) 
       VALUES ($1, $2, 'motorista', $3, $4, $5, $6, $7) RETURNING *`,
      [username, hashedPassword, nome_completo, cpf, cnh, placa_cavalo, placas_carretas]
    );
    const novoMotorista = result.rows[0];
    delete novoMotorista.password;
    res.status(201).json(novoMotorista);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Esse nome de usuário (login) já existe.' });
    console.error('Erro ao criar motorista:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.put('/api/motoristas/:id', authenticateToken, authenticateMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome_completo, cpf, cnh, placa_cavalo, placas_carretas, password } = req.body;
    if (password && password.length > 0) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        `UPDATE users SET nome_completo = $1, cpf = $2, cnh = $3, placa_cavalo = $4, placas_carretas = $5, password = $6 
         WHERE id = $7 AND role = 'motorista'`,
        [nome_completo, cpf, cnh, placa_cavalo, placas_carretas, hashedPassword, id]
      );
    } else {
      await db.query(
        `UPDATE users SET nome_completo = $1, cpf = $2, cnh = $3, placa_cavalo = $4, placas_carretas = $5 
         WHERE id = $6 AND role = 'motorista'`,
        [nome_completo, cpf, cnh, placa_cavalo, placas_carretas, id]
      );
    }
    const result = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const motoristaAtualizado = result.rows[0];
    delete motoristaAtualizado.password;
    res.json(motoristaAtualizado);
  } catch (err) {
    console.error('Erro ao atualizar motorista:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.delete('/api/motoristas/:id', authenticateToken, authenticateMaster, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM users WHERE id = $1 AND role = 'motorista'", [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar motorista:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// ****** NOVAS ROTAS PARA GERENCIAR PRODUTOS ******
// (Protegidas por 'authenticateToken' E 'authenticateMaster')

// GET: Listar todos os produtos (Qualquer usuário logado pode ver)
app.get('/api/produtos', authenticateToken, async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM produtos ORDER BY nome");
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// POST: Criar um novo produto (Apenas 'master')
app.post('/api/produtos', authenticateToken, authenticateMaster, async (req, res) => {
  try {
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'O nome é obrigatório.' });
    
    const result = await db.query(
      `INSERT INTO produtos (nome) VALUES ($1) RETURNING *`, [nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Esse produto já existe.' });
    console.error('Erro ao criar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// PUT: Editar um produto (Apenas 'master')
app.put('/api/produtos/:id', authenticateToken, authenticateMaster, async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    if (!nome) return res.status(400).json({ error: 'O nome é obrigatório.' });

    const result = await db.query(
      `UPDATE produtos SET nome = $1 WHERE id = $2 RETURNING *`,
      [nome, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Produto não encontrado.' });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Esse produto já existe.' });
    console.error('Erro ao atualizar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// DELETE: Deletar um produto (Apenas 'master')
app.delete('/api/produtos/:id', authenticateToken, authenticateMaster, async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM produtos WHERE id = $1", [id]);
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao deletar produto:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});


// Inicia o servidor
setupDatabase().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor backend rodando na porta ${PORT}`));
}).catch(err => {
  console.error('❌ Falha ao iniciar o banco de dados:', err);
  if (db) db.end();
});