// Arquivo: backend/server.js (VERSÃO FINAL COMPLETA COM ROTA DE DETALHE)

const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
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

const PORT = 3001;
const JWT_SECRET = 'SEU_SEGREDO_SUPER_SECRETO_PODE_SER_QUALQUER_FRASE_LONGA';
let db;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'))
});
const upload = multer({ storage: storage });

async function setupDatabase() {
  db = await open({ filename: './database.db', driver: sqlite3.Database });
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS lancamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT, data TEXT, horaPostada TEXT, origem TEXT,
      destino TEXT, inicioDescarga TEXT, terminoDescarga TEXT, tempoDescarga TEXT,
      ticket TEXT, pesoReal REAL, tarifa REAL, nf TEXT, cavalo TEXT,
      motorista TEXT, valorFrete REAL, obs TEXT, produto TEXT,
      caminhoNf TEXT
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
}

// --- ROTAS DE AUTENTICAÇÃO --- (Sem mudanças)
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ id: result.lastID, username });
  } catch (err) {
    if (err.errno === 19) return res.status(409).json({ error: 'Nome de usuário já existe.' });
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ message: 'Login bem-sucedido!', token });
  } catch (err) {
    console.error('Erro no login:', err);
    res.status(500).json({ error: 'Erro interno do servidor.' });
  }
});

// --- ROTAS DE LANÇAMENTOS ---
app.get('/lancamentos', async (req, res) => { 
  try { 
    const data = await db.all('SELECT * FROM lancamentos ORDER BY id DESC'); 
    res.json(data); 
  } catch(e){ 
    res.status(500).json({e}) 
  } 
});

// ***** NOVO CÓDIGO AQUI *****
// GET (UM ITEM): Buscar um lançamento específico pelo ID
app.get('/lancamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lancamento = await db.get('SELECT * FROM lancamentos WHERE id = ?', [id]);
    
    if (!lancamento) {
      return res.status(404).json({ error: 'Lançamento não encontrado' });
    }
    
    res.json(lancamento);
  } catch (err) {
    console.error('Erro ao buscar lançamento:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
// ***** FIM DO NOVO CÓDIGO *****

app.post('/lancamentos', upload.single('arquivoNf'), async (req, res) => { 
  try { 
    const dados = req.body;
    const caminhoNf = req.file ? req.file.filename : null;
    const r = await db.run('INSERT INTO lancamentos (data, horaPostada, origem, destino, inicioDescarga, terminoDescarga, tempoDescarga, ticket, pesoReal, tarifa, nf, cavalo, motorista, valorFrete, obs, produto, caminhoNf) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', [dados.data,dados.horaPostada,dados.origem,dados.destino,dados.inicioDescarga,dados.terminoDescarga,dados.tempoDescarga,dados.ticket,Number(dados.pesoReal)||0,Number(dados.tarifa)||0,dados.nf,dados.cavalo,dados.motorista,Number(dados.valorFrete)||0,dados.obs,dados.produto,caminhoNf]); 
    const d = await db.get('SELECT * FROM lancamentos WHERE id = ?', r.lastID); 
    res.status(201).json(d); 
  } catch(e){ console.error(e); res.status(500).json({e}) } 
});

app.put('/lancamentos/:id', upload.single('arquivoNf'), async (req, res) => { 
  try { 
    const { id } = req.params;
    const dados = req.body;
    const lancamentoAtual = await db.get('SELECT * FROM lancamentos WHERE id = ?', id);
    if (!lancamentoAtual) return res.status(404).json({e:'Não encontrado'});
    let caminhoNf = lancamentoAtual.caminhoNf; 
    if (req.file) {
      if (lancamentoAtual.caminhoNf) {
        fs.unlink(path.join(__dirname, 'uploads', lancamentoAtual.caminhoNf), (err) => {
          if (err) console.error("Erro ao deletar arquivo antigo na edição:", err);
        });
      }
      caminhoNf = req.file.filename;
    }
    const r = await db.run('UPDATE lancamentos SET data=?,horaPostada=?,origem=?,destino=?,inicioDescarga=?,terminoDescarga=?,tempoDescarga=?,ticket=?,pesoReal=?,tarifa=?,nf=?,cavalo=?,motorista=?,valorFrete=?,obs=?,produto=?,caminhoNf=? WHERE id=?', 
      [dados.data,dados.horaPostada,dados.origem,dados.destino,dados.inicioDescarga,dados.terminoDescarga,dados.tempoDescarga,dados.ticket,Number(dados.pesoReal)||0,Number(dados.tarifa)||0,dados.nf,dados.cavalo,dados.motorista,Number(dados.valorFrete)||0,dados.obs,dados.produto,caminhoNf,id]
    ); 
    const d = await db.get('SELECT * FROM lancamentos WHERE id=?',id); 
    res.json(d); 
  } catch(e){ console.error(e); res.status(500).json({e}) } 
});

app.delete('/lancamentos/:id', async (req, res) => { 
  try { 
    const { id } = req.params;
    const lancamento = await db.get('SELECT * FROM lancamentos WHERE id = ?', id);
    if (lancamento && lancamento.caminhoNf) {
      fs.unlink(path.join(__dirname, 'uploads', lancamento.caminhoNf), (err) => {
        if (err) console.error("Erro ao deletar arquivo:", err);
      });
    }
    const r = await db.run('DELETE FROM lancamentos WHERE id=?', id); 
    if(r.changes===0) return res.status(404).json({e:'Não encontrado'}); 
    res.status(204).send(); 
  } catch(e){ console.error(e); res.status(500).json({e}) } 
});

setupDatabase().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor backend rodando na porta ${PORT}`));
}).catch(err => console.error('❌ Falha ao iniciar o banco de dados:', err));