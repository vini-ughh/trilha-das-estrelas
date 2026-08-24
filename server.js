require('dotenv').config();
const express = require('express');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { Server } = require('socket.io');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer);
const PORT = process.env.PORT || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
const salas = new Map();

const perguntas = [
  { id: 1, nivel: 'facil', pergunta: 'Qual animal faz "miau"?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f431.png', opcoes: ['Cachorro', 'Gato', 'Pato', 'Cavalo'], resposta: 1 },
  { id: 2, nivel: 'facil', pergunta: 'Quanto é 2 + 3?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', opcoes: ['4', '5', '6', '7'], resposta: 1 },
  { id: 3, nivel: 'facil', pergunta: 'Qual é a cor do sol nos desenhos?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2600.png', opcoes: ['Azul', 'Verde', 'Amarelo', 'Roxo'], resposta: 2 },
  { id: 4, nivel: 'facil', pergunta: 'Quantas pernas tem uma borboleta?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f98b.png', opcoes: ['4', '6', '8', '10'], resposta: 1 },
  { id: 13, nivel: 'facil', pergunta: 'Qual objeto usamos para escrever?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/270f-fe0f.png', opcoes: ['Lápis', 'Sapato', 'Prato', 'Bola'], resposta: 0 },
  { id: 14, nivel: 'facil', pergunta: 'Quantos dias tem uma semana?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4c5.png', opcoes: ['5', '6', '7', '8'], resposta: 2 },
  { id: 5, nivel: 'medio', pergunta: 'Qual fruta é conhecida por ser amarela e comprida?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f34c.png', opcoes: ['Banana', 'Maçã', 'Uva', 'Melancia'], resposta: 0 },
  { id: 6, nivel: 'medio', pergunta: 'Qual destes animais vive na água?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f41f.png', opcoes: ['Peixe', 'Leão', 'Coelho', 'Galinha'], resposta: 0 },
  { id: 7, nivel: 'medio', pergunta: 'Qual forma tem três lados?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f53a.png', opcoes: ['Círculo', 'Quadrado', 'Triângulo', 'Retângulo'], resposta: 2 },
  { id: 8, nivel: 'medio', pergunta: 'Qual estação do ano costuma ser bem quentinha?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f324-fe0f.png', opcoes: ['Inverno', 'Verão', 'Outono', 'Primavera'], resposta: 1 },
  { id: 15, nivel: 'medio', pergunta: 'Quantos meses formam um ano?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f5d3-fe0f.png', opcoes: ['10', '11', '12', '13'], resposta: 2 },
  { id: 16, nivel: 'medio', pergunta: 'Qual é o maior animal terrestre?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f418.png', opcoes: ['Elefante', 'Gato', 'Macaco', 'Cachorro'], resposta: 0 },
  { id: 9, nivel: 'dificil', pergunta: 'O que usamos para ouvir música?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3a7.png', opcoes: ['Colher', 'Travesseiro', 'Fone', 'Caderno'], resposta: 2 },
  { id: 10, nivel: 'dificil', pergunta: 'Qual destes é um meio de transporte?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f6b2.png', opcoes: ['Bicicleta', 'Almofada', 'Lápis', 'Bolo'], resposta: 0 },
  { id: 11, nivel: 'dificil', pergunta: 'Se você tem 10 balas e dá 3, com quantas fica?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f36c.png', opcoes: ['5', '6', '7', '8'], resposta: 2 },
  { id: 12, nivel: 'dificil', pergunta: 'Qual planeta é conhecido como planeta vermelho?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2642-fe0f.png', opcoes: ['Marte', 'Terra', 'Júpiter', 'Saturno'], resposta: 0 },
  { id: 17, nivel: 'dificil', pergunta: 'Qual é o resultado de 6 x 4?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', opcoes: ['20', '24', '28', '32'], resposta: 1 },
  { id: 18, nivel: 'dificil', pergunta: 'Como se chama a água em estado sólido?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2744-fe0f.png', opcoes: ['Vapor', 'Chuva', 'Gelo', 'Neve'], resposta: 2 },
  { id: 19, nivel: 'facil', pergunta: 'Qual destes objetos usamos para cortar papel?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2702-fe0f.png', opcoes: ['Tesoura', 'Colher', 'Almofada', 'Chapéu'], resposta: 0 },
  { id: 20, nivel: 'medio', pergunta: 'Qual é o dobro de 8?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', opcoes: ['12', '14', '16', '18'], resposta: 2 },
  { id: 21, nivel: 'dificil', pergunta: 'Qual gás as plantas liberam durante a fotossíntese?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f33f.png', opcoes: ['Oxigênio', 'Fumaça', 'Hélio', 'Vapor'], resposta: 0 },
  { id: 22, nivel: 'facil', pergunta: 'Qual animal tem uma longa tromba?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f418.png', opcoes: ['Elefante', 'Peixe', 'Pinguim', 'Rato'], resposta: 0 },
  { id: 23, nivel: 'medio', pergunta: 'Quantas horas tem um dia?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/23f0.png', opcoes: ['12', '18', '24', '30'], resposta: 2 },
  { id: 24, nivel: 'dificil', pergunta: 'Qual é o maior planeta do sistema solar?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1fa90.png', opcoes: ['Marte', 'Júpiter', 'Terra', 'Mercúrio'], resposta: 1 },
  { id: 25, nivel: 'facil', pergunta: 'Qual fruta é vermelha e tem sementes por fora?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f353.png', opcoes: ['Morango', 'Banana', 'Limão', 'Coco'], resposta: 0 },
  { id: 26, nivel: 'facil', pergunta: 'Qual parte do corpo usamos para enxergar?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f441.png', opcoes: ['Ouvidos', 'Olhos', 'Pés', 'Mãos'], resposta: 1 },
  { id: 27, nivel: 'medio', pergunta: 'Qual número vem depois do 99?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', opcoes: ['98', '100', '101', '90'], resposta: 1 },
  { id: 28, nivel: 'medio', pergunta: 'Qual instrumento tem teclas pretas e brancas?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3b9.png', opcoes: ['Tambor', 'Piano', 'Violão', 'Flauta'], resposta: 1 },
  { id: 29, nivel: 'dificil', pergunta: 'Quantos lados tem um hexágono?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f537.png', opcoes: ['4', '5', '6', '8'], resposta: 2 },
  { id: 30, nivel: 'dificil', pergunta: 'Qual órgão bombeia o sangue pelo corpo?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2764-fe0f.png', opcoes: ['Pulmão', 'Cérebro', 'Estômago', 'Coração'], resposta: 3 }
];

const swaggerDocument = {
  openapi: '3.0.0',
  info: { title: 'Trilha das Estrelas API', version: '1.0.0', description: 'API simples para o quiz infantil.' },
  servers: [{ url: `http://localhost:${PORT}` }],
  paths: {
    '/api/perguntas': {
      get: {
        summary: 'Lista as perguntas do quiz',
        responses: { 200: { description: 'Perguntas sem revelar as respostas.' } }
      }
    },
    '/api/progresso': {
      post: {
        summary: 'Registra uma resposta e retorna o progresso',
        requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', properties: { perguntaId: { type: 'integer' }, resposta: { type: 'integer' } } } } } },
        responses: { 200: { description: 'Resultado da resposta.' } }
      }
    }
  }
};

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/jogo', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.get('/api/perguntas', async (req, res) => {
  if (pool) {
    try {
      const resultado = await pool.query('SELECT id, nivel, pergunta, imagem, opcoes FROM perguntas ORDER BY id');
      return res.json(resultado.rows);
    } catch (erro) {
      console.error('Banco indisponível ao carregar perguntas:', erro.message);
    }
  }

  res.json(perguntas.map(({ resposta, ...pergunta }) => pergunta));
});

app.post('/api/progresso', async (req, res) => {
  const { perguntaId, resposta, nome = 'Anônimo' } = req.body;
  let pergunta = perguntas.find((item) => item.id === Number(perguntaId));

  if (pool) {
    try {
      const resultado = await pool.query('SELECT id, nivel, pergunta, imagem, opcoes, resposta FROM perguntas WHERE id = $1', [perguntaId]);
      pergunta = resultado.rows[0] || pergunta;
    } catch (erro) {
      console.error('Banco indisponível ao registrar resposta:', erro.message);
    }
  }

  if (!pergunta || !Number.isInteger(resposta)) return res.status(400).json({ erro: 'Dados da resposta invalidos.' });

  const correta = pergunta.resposta === resposta;
  if (pool) {
    try {
      await pool.query('INSERT INTO tentativas (nome, pergunta_id, resposta, correta) VALUES ($1, $2, $3, $4)', [nome.slice(0, 18), pergunta.id, resposta, correta]);
    } catch (erro) {
      console.error('Não foi possível salvar a tentativa:', erro.message);
    }
  }

  res.json({ correta, mensagem: correta ? 'Muito bem!' : 'Quase! Tente a proxima.', total: perguntas.length, respostaCorreta: pergunta.opcoes[pergunta.resposta], explicacao: `A resposta correta é ${pergunta.opcoes[pergunta.resposta]}.` });
});

app.use((req, res) => res.status(404).send('Pagina nao encontrada'));

function gerarCodigo() {
  let codigo;
  do codigo = Math.random().toString(36).slice(2, 8).toUpperCase(); while (salas.has(codigo));
  return codigo;
}

function perguntasDaSala() {
  return perguntas.map(({ resposta, ...pergunta }) => pergunta);
}

function placarDaSala(sala) {
  return [...sala.jogadores.values()].sort((a, b) => b.acertos - a.acertos || a.nome.localeCompare(b.nome));
}

function transmitirPlacar(codigo) {
  const sala = salas.get(codigo);
  if (sala) io.to(codigo).emit('placar-atualizado', placarDaSala(sala));
}

io.on('connection', (socket) => {
  socket.on('criar-sala', ({ nome }, callback) => {
    const codigo = gerarCodigo();
    const sala = { jogadores: new Map(), perguntas: perguntasDaSala() };
    salas.set(codigo, sala);
    entrarNaSala(socket, sala, codigo, nome, callback, true);
  });

  socket.on('entrar-sala', ({ nome, codigo }, callback) => {
    const sala = salas.get(String(codigo || '').trim().toUpperCase());
    if (!sala) return callback({ erro: 'Sala não encontrada. Confira o código.' });
    if (sala.jogadores.size >= 10) return callback({ erro: 'Esta sala já está cheia (máximo de 10 jogadores).' });
    entrarNaSala(socket, sala, String(codigo).trim().toUpperCase(), nome, callback, false);
  });

  socket.on('responder-online', async ({ perguntaId, resposta }, callback) => {
    const jogador = socket.data.jogador;
    const sala = jogador && salas.get(jogador.codigo);
    const pergunta = sala && sala.perguntas.find((item) => item.id === Number(perguntaId));
    if (!sala || !pergunta || jogador.respondidas.has(pergunta.id)) return;
    jogador.respondidas.add(pergunta.id);
    const perguntaCompleta = perguntas.find((item) => item.id === pergunta.id);
    const correta = perguntaCompleta.resposta === Number(resposta);
    if (correta) jogador.acertos += 1;
    if (pool) {
      try { await pool.query('INSERT INTO tentativas (nome, pergunta_id, resposta, correta) VALUES ($1, $2, $3, $4)', [jogador.nome, pergunta.id, resposta, correta]); } catch (erro) { console.error('Não foi possível salvar a tentativa online:', erro.message); }
    }
    const resultado = { correta, explicacao: `A resposta correta é ${perguntaCompleta.opcoes[perguntaCompleta.resposta]}.` };
    callback(resultado);
    socket.emit('resultado-online', resultado);
    transmitirPlacar(jogador.codigo);
  });

  socket.on('disconnect', () => {
    const jogador = socket.data.jogador;
    if (!jogador) return;
    const sala = salas.get(jogador.codigo);
    if (!sala) return;
    sala.jogadores.delete(socket.id);
    if (!sala.jogadores.size) salas.delete(jogador.codigo);
    else transmitirPlacar(jogador.codigo);
  });
});

function entrarNaSala(socket, sala, codigo, nome, callback, admin) {
  const jogador = { nome: String(nome || '').trim().slice(0, 18), acertos: 0, respondidas: new Set(), codigo, admin };
  if (!jogador.nome) return callback({ erro: 'Digite seu nome para entrar.' });
  sala.jogadores.set(socket.id, jogador);
  socket.data.jogador = jogador;
  socket.join(codigo);
  callback({ sucesso: true, codigo, perguntas: sala.perguntas, admin });
  transmitirPlacar(codigo);
}

async function iniciarServidor() {
  if (pool) {
    await pool.query(fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8'));
    console.log('PostgreSQL conectado e banco preparado.');
  }
  httpServer.listen(PORT, '0.0.0.0', () => console.log(`Trilha das Estrelas rodando na porta ${PORT}`));
}

iniciarServidor().catch((erro) => {
  console.error('Não foi possível iniciar o banco de dados:', erro.message);
  process.exit(1);
});
