// Arquivo: backend/server.js (VERSÃO FINAL - LENDO A PORTA DO RENDER)

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

// ****** AQUI ESTÁ A CORREÇÃO IMPORTANTE ******
const PORT = process.env.PORT || 3001; // Lê a porta do Render ou usa 3001
const JWT_SECRET = 'SEU_SEGREDO_SUPER_SECRETO_PODE_SER_QUALQUER_FRASE_LONGA';

const DATABASE_URL = 'postgresql://bdpesos_user:UAnZKty8Q8FieCQPoW6wTNJEspOUfPbw@dpg-d3ra513e5dus73b586l0-a/bdpesos'; // Sua URL está aqui

const db = new Client({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname.replace(/\s/g, '_'));
  }
});
const upload = multer({ storage: storage });

async function setupDatabase() {
  await db.connect(); 
  
  await db.query(`
    CREATE TABLE IF NOT EXISTS lancamentos (
      id SERIAL PRIMARY KEY, data TEXT, horaPostada TEXT, origem TEXT,
      destino TEXT, inicioDescarga TEXT, terminoDescarga TEXT, tempoDescarga TEXT,
      ticket TEXT, pesoReal REAL, tarifa REAL, nf TEXT, cavalo TEXT,
      motorista TEXT, valorFrete REAL, obs TEXT, produto TEXT,
      caminhoNf TEXT
    )
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    )
  `);
}

// --- ROTAS DE AUTENTICAÇÃO --- (Sem mudanças)
app.post('/register', async (req, res) => { /* ... */ });
app.post('/login', async (req, res) => { /* ... */ });

// --- ROTAS DE LANÇAMENTOS --- (Sem mudanças)
app.get('/lancamentos', async (req, res) => { /* ... */ });
app.get('/lancamentos/:id', async (req, res) => { /* ... */ });
app.post('/lancamentos', upload.single('arquivoNf'), async (req, res) => { /* ... */ });
app.put('/lancamentos/:id', upload.single('arquivoNf'), async (req, res) => { /* ... */ });
app.delete('/lancamentos/:id', async (req, res) => { /* ... */ });

// --- CÓDIGO INTERNO DAS ROTAS (COPIADO DA SUA VERSÃO PARA GARANTIR) ---
// register
app.post('/register', async (req, res) => {
 try {
   const { username, password } = req.body;
   if (!username || !password) return res.status(400).json({ error: 'Usuário e senha são obrigatórios.' });
   const hashedPassword = await bcrypt.hash(password, 10);
   const result = await db.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id, username', [username, hashedPassword]);
   res.status(201).json(result.rows[0]);
 } catch (err) {
   if (err.code === '23505') return res.status(409).json({ error: 'Nome de usuário já existe.' });
   console.error('Erro ao registrar usuário:', err);
   res.status(500).json({ error: 'Erro interno do servidor.' });
 }
});
// login
app.post('/login', async (req, res) => {
 try {
   const { username, password } = req.body;
   const result = await db.query('SELECT * FROM users WHERE username = $1', [username]);
   if (result.rowCount === 0) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
   const user = result.rows[0];
   const isPasswordCorrect = await bcrypt.compare(password, user.password);
   if (!isPasswordCorrect) return res.status(401).json({ error: 'Usuário ou senha inválidos.' });
   const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
   res.json({ message: 'Login bem-sucedido!', token });
 } catch (err) {
   console.error('Erro no login:', err);
   res.status(500).json({ error: 'Erro interno do servidor.' });
 }
});
// get lancamentos
app.get('/lancamentos', async (req, res) => { 
 try { 
   const result = await db.query('SELECT * FROM lancamentos ORDER BY id DESC'); 
   res.json(result.rows); 
 } catch(e){ 
   res.status(500).json({e}) 
 } 
});
// get lancamento por id
app.get('/lancamentos/:id', async (req, res) => {
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
// post lancamento
app.post('/lancamentos', upload.single('arquivoNf'), async (req, res) => { 
 try { 
   const dados = req.body;
   const caminhoNf = req.file ? req.file.filename : null;
   const r = await db.query(
     `INSERT INTO lancamentos (data, horaPostada, origem, destino, inicioDescarga, terminoDescarga, tempoDescarga, ticket, pesoReal, tarifa, nf, cavalo, motorista, valorFrete, obs, produto, caminhoNf) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *`, 
     [dados.data,dados.horaPostada,dados.origem,dados.destino,dados.inicioDescarga,dados.terminoDescarga,dados.tempoDescarga,dados.ticket,Number(dados.pesoReal)||0,Number(dados.tarifa)||0,dados.nf,dados.cavalo,dados.motorista,Number(dados.valorFrete)||0,dados.obs,dados.produto,caminhoNf]
   ); 
   res.status(201).json(r.rows[0]); 
 } catch(e){ console.error(e); res.status(500).json({e}) } 
});
// put lancamento
app.put('/lancamentos/:id', upload.single('arquivoNf'), async (req, res) => { 
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
     `UPDATE lancamentos SET data=$1, horaPostada=$2, origem=$3, destino=$4, inicioDescarga=$5, terminoDescarga=$6, tempoDescarga=$7, ticket=$8, pesoReal=$9, tarifa=$10, nf=$11, cavalo=$12, motorista=$13, valorFrete=$14, obs=$15, produto=$16, caminhoNf=$17 
      WHERE id=$18 RETURNING *`, 
     [dados.data,dados.horaPostada,dados.origem,dados.destino,dados.inicioDescarga,dados.terminoDescarga,dados.tempoDescarga,dados.ticket,Number(dados.pesoReal)||0,Number(dados.tarifa)||0,dados.nf,dados.cavalo,dados.motorista,Number(dados.valorFrete)||0,dados.obs,dados.produto,caminhoNf,id]
   ); 
   res.json(r.rows[0]); 
 } catch(e){ console.error(e); res.status(500).json({e}) } 
});
// delete lancamento
app.delete('/lancamentos/:id', async (req, res) => { 
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
   if(r.rowCount===0) return res.status(404).json({e:'Não encontrado'}); 
   res.status(204).send(); 
 } catch(e){ console.error(e); res.status(500).json({e}) } 
});
// --- FIM DO CÓDIGO INTERNO DAS ROTAS ---

// Inicia o servidor
setupDatabase().then(() => {
  app.listen(PORT, () => console.log(`✅ Servidor backend rodando na porta ${PORT}`)); // Usa a variável PORT dinâmica
}).catch(err => {
  console.error('❌ Falha ao iniciar o banco de dados:', err);
  if (db) db.end();
});