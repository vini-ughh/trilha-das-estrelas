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
const io = new Server(httpServer, {
  transports: ['websocket', 'polling'],
  pingTimeout: 20000,
  pingInterval: 25000,
  upgradeTimeout: 20000,
  cors: { origin: '*' }
});
const PORT = process.env.PORT || 3000;
const pool = process.env.DATABASE_URL ? new Pool({ connectionString: process.env.DATABASE_URL }) : null;
const salas = new Map();

const perguntas = [
  { id: 1, nivel: 'facil', pergunta: 'Qual animal faz "miau"?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f431.png', opcoes: ['Cachorro', 'Gato', 'Pato', 'Cavalo'], resposta: 1 },
  { id: 2, nivel: 'facil', pergunta: 'Quanto é 2 + 3?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['4', '5', '6', '7'], resposta: 1 },
  { id: 3, nivel: 'facil', pergunta: 'Qual é a cor do sol?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2600.png', opcoes: ['Azul', 'Verde', 'Amarelo', 'Roxo'], resposta: 2 },
  { id: 4, nivel: 'facil', pergunta: 'Quantas pernas tem uma borboleta?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f98b.png', opcoes: ['4', '6', '8', '10'], resposta: 1 },
  { id: 5, nivel: 'facil', pergunta: 'O que usamos para escrever?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/270f.png', opcoes: ['Lápis', 'Sapato', 'Prato', 'Bola'], resposta: 0 },
  { id: 6, nivel: 'facil', pergunta: 'Quantos dias tem uma semana?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4c5.png', opcoes: ['5', '6', '7', '8'], resposta: 2 },
  { id: 7, nivel: 'facil', pergunta: 'Qual animal tem uma longa tromba?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f418.png', opcoes: ['Elefante', 'Peixe', 'Pinguim', 'Rato'], resposta: 0 },
  { id: 8, nivel: 'facil', pergunta: 'Qual fruta é vermelha e redonda?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f347.png', opcoes: ['Maçã', 'Limão', 'Banana', 'Melancia'], resposta: 0 },
  { id: 9, nivel: 'facil', pergunta: 'Qual objeto cortamos papel?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2702.png', opcoes: ['Tesoura', 'Colher', 'Almofada', 'Chapéu'], resposta: 0 },
  { id: 10, nivel: 'facil', pergunta: 'Qual parte do corpo vemos com?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f441.png', opcoes: ['Ouvidos', 'Olhos', 'Pés', 'Mãos'], resposta: 1 },
  { id: 11, nivel: 'facil', pergunta: 'Quanto é 5 + 2?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['6', '7', '8', '9'], resposta: 1 },
  { id: 12, nivel: 'facil', pergunta: 'Qual fruta é amarela e comprida?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34c.png', opcoes: ['Banana', 'Maçã', 'Uva', 'Melancia'], resposta: 0 },
  { id: 13, nivel: 'facil', pergunta: 'Quantos pés tem um cachorro?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f436.png', opcoes: ['2', '3', '4', '5'], resposta: 2 },
  { id: 14, nivel: 'facil', pergunta: 'O que sobe quando chove?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f32b.png', opcoes: ['Neve', 'Arco-íris', 'Sol', 'Lua'], resposta: 1 },
  { id: 15, nivel: 'facil', pergunta: 'Quanto é 3 + 4?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['6', '7', '8', '9'], resposta: 1 },
  { id: 16, nivel: 'medio', pergunta: 'Qual fruta é conhecida por ser amarela e comprida?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f34c.png', opcoes: ['Banana', 'Maçã', 'Uva', 'Melancia'], resposta: 0 },
  { id: 17, nivel: 'medio', pergunta: 'Qual animal vive na água?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f41f.png', opcoes: ['Peixe', 'Leão', 'Coelho', 'Galinha'], resposta: 0 },
  { id: 18, nivel: 'medio', pergunta: 'Qual forma tem três lados?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f53a.png', opcoes: ['Círculo', 'Quadrado', 'Triângulo', 'Retângulo'], resposta: 2 },
  { id: 19, nivel: 'medio', pergunta: 'Qual estação é quente?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f308.png', opcoes: ['Inverno', 'Verão', 'Outono', 'Primavera'], resposta: 1 },
  { id: 20, nivel: 'medio', pergunta: 'Quantos meses tem um ano?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f5d3.png', opcoes: ['10', '11', '12', '13'], resposta: 2 },
  { id: 21, nivel: 'medio', pergunta: 'Qual é o maior animal terrestre?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f418.png', opcoes: ['Elefante', 'Gato', 'Macaco', 'Cachorro'], resposta: 0 },
  { id: 22, nivel: 'medio', pergunta: 'Quantas horas tem um dia?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/23f0.png', opcoes: ['12', '18', '24', '30'], resposta: 2 },
  { id: 23, nivel: 'medio', pergunta: 'Qual número vem depois de 99?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['98', '100', '101', '90'], resposta: 1 },
  { id: 24, nivel: 'medio', pergunta: 'Qual instrumento tem teclas?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3b9.png', opcoes: ['Tambor', 'Piano', 'Violão', 'Flauta'], resposta: 1 },
  { id: 25, nivel: 'medio', pergunta: 'Qual é o dobro de 5?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['8', '9', '10', '11'], resposta: 2 },
  { id: 26, nivel: 'dificil', pergunta: 'O que usamos para ouvir música?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f3a7.png', opcoes: ['Colher', 'Travesseiro', 'Fone', 'Caderno'], resposta: 2 },
  { id: 27, nivel: 'dificil', pergunta: 'Qual é um meio de transporte?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f6b2.png', opcoes: ['Bicicleta', 'Almofada', 'Lápis', 'Bolo'], resposta: 0 },
  { id: 28, nivel: 'dificil', pergunta: 'Se tem 10 balas e dá 3, fica com?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f36c.png', opcoes: ['5', '6', '7', '8'], resposta: 2 },
  { id: 29, nivel: 'dificil', pergunta: 'Qual planeta é vermelho?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1fa90.png', opcoes: ['Marte', 'Terra', 'Júpiter', 'Saturno'], resposta: 0 },
  { id: 30, nivel: 'dificil', pergunta: 'Quanto é 6 x 4?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['20', '24', '28', '32'], resposta: 1 },
  { id: 31, nivel: 'dificil', pergunta: 'Água sólida é chamada de?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2744.png', opcoes: ['Vapor', 'Chuva', 'Gelo', 'Neve'], resposta: 2 },
  { id: 32, nivel: 'dificil', pergunta: 'Qual gás as plantas liberam?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f33f.png', opcoes: ['Oxigênio', 'Fumaça', 'Hélio', 'Vapor'], resposta: 0 },
  { id: 33, nivel: 'dificil', pergunta: 'Qual é o maior planeta?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1fa90.png', opcoes: ['Marte', 'Júpiter', 'Terra', 'Mercúrio'], resposta: 1 },
  { id: 34, nivel: 'dificil', pergunta: 'Quantos lados tem hexágono?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f537.png', opcoes: ['4', '5', '6', '8'], resposta: 2 },
  { id: 35, nivel: 'dificil', pergunta: 'Qual órgão bombeia sangue?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/2764.png', opcoes: ['Pulmão', 'Cérebro', 'Estômago', 'Coração'], resposta: 3 },
  { id: 36, nivel: 'facil', pergunta: 'Qual é a cor da grama?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f33f.png', opcoes: ['Vermelho', 'Azul', 'Verde', 'Amarelo'], resposta: 2 },
  { id: 37, nivel: 'facil', pergunta: 'Quanto é 1 + 1?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['1', '2', '3', '4'], resposta: 1 },
  { id: 38, nivel: 'facil', pergunta: 'Qual animal late?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f436.png', opcoes: ['Gato', 'Cachorro', 'Pato', 'Passarinho'], resposta: 1 },
  { id: 39, nivel: 'facil', pergunta: 'Qual fruta é vermelha?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f353.png', opcoes: ['Morango', 'Banana', 'Limão', 'Coco'], resposta: 0 },
  { id: 40, nivel: 'facil', pergunta: 'Quanto é 4 + 1?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['3', '4', '5', '6'], resposta: 2 },
  { id: 41, nivel: 'medio', pergunta: 'Quantas rodas tem um carro?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f697.png', opcoes: ['2', '3', '4', '5'], resposta: 2 },
  { id: 42, nivel: 'medio', pergunta: 'Qual animal voa?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f985.png', opcoes: ['Peixe', 'Passarinho', 'Leão', 'Cachorro'], resposta: 1 },
  { id: 43, nivel: 'medio', pergunta: 'Qual cor é o céu?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f30c.png', opcoes: ['Verde', 'Azul', 'Vermelho', 'Amarelo'], resposta: 1 },
  { id: 44, nivel: 'medio', pergunta: 'Quantas patas tem um gato?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f431.png', opcoes: ['2', '3', '4', '5'], resposta: 2 },
  { id: 45, nivel: 'medio', pergunta: 'Qual é o dobro de 8?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['12', '14', '16', '18'], resposta: 2 },
  { id: 46, nivel: 'dificil', pergunta: 'Quanto é 7 + 5?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['10', '11', '12', '13'], resposta: 2 },
  { id: 47, nivel: 'dificil', pergunta: 'Qual é o resultado 8 x 3?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['20', '24', '28', '32'], resposta: 1 },
  { id: 48, nivel: 'dificil', pergunta: 'Qual é 15 - 7?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['6', '7', '8', '9'], resposta: 2 },
  { id: 49, nivel: 'dificil', pergunta: 'Qual é a metade de 20?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['8', '9', '10', '11'], resposta: 2 },
  { id: 50, nivel: 'dificil', pergunta: 'Quanto é 12 ÷ 3?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['3', '4', '5', '6'], resposta: 1 },
  { id: 51, nivel: 'facil', pergunta: 'Qual cor tem o tomate?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f345.png', opcoes: ['Verde', 'Amarelo', 'Vermelho', 'Roxo'], resposta: 2 },
  { id: 52, nivel: 'facil', pergunta: 'Quantas orelhas tem um coelho?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f430.png', opcoes: ['1', '2', '3', '4'], resposta: 1 },
  { id: 53, nivel: 'facil', pergunta: 'Qual animal dá leite?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f404.png', opcoes: ['Ovelha', 'Vaca', 'Cavalo', 'Porco'], resposta: 1 },
  { id: 54, nivel: 'facil', pergunta: 'Qual é a cor do mar?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f30a.png', opcoes: ['Verde', 'Azul', 'Marrom', 'Branco'], resposta: 1 },
  { id: 55, nivel: 'facil', pergunta: 'Quanto é 8 + 2?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['8', '9', '10', '11'], resposta: 2 },
  { id: 56, nivel: 'medio', pergunta: 'Qual animal tem chifres?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f410.png', opcoes: ['Cachorro', 'Cabra', 'Gato', 'Pato'], resposta: 1 },
  { id: 57, nivel: 'medio', pergunta: 'Quanto é 3 x 3?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['6', '7', '8', '9'], resposta: 3 },
  { id: 58, nivel: 'medio', pergunta: 'Qual forma é uma bola?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4de.png', opcoes: ['Quadrado', 'Triângulo', 'Esfera', 'Retângulo'], resposta: 2 },
  { id: 59, nivel: 'medio', pergunta: 'Quantos dedos tem uma mão?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f44b.png', opcoes: ['3', '4', '5', '6'], resposta: 2 },
  { id: 60, nivel: 'dificil', pergunta: 'Qual é 9 x 9?', imagem: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f522.png', opcoes: ['72', '81', '90', '99'], resposta: 1 }
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

app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
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

function perguntasDaSala(lista = perguntas) {
  return lista.map(({ resposta, ...pergunta }) => pergunta);
}

function placarDaSala(sala) {
  return [...sala.jogadores.values()].map((jogador) => ({ nome: jogador.nome, acertos: jogador.acertos, respondidas: jogador.respondidas.size }))
    .sort((a, b) => b.acertos - a.acertos || a.nome.localeCompare(b.nome));
}

function transmitirPlacar(codigo) {
  const sala = salas.get(codigo);
  if (sala) io.to(codigo).emit('placar-atualizado', placarDaSala(sala));
}

function transmitirEstadoSala(codigo) {
  const sala = salas.get(codigo);
  if (sala) io.to(codigo).emit('estado-sala', { status: sala.status, quantidade: sala.perguntas.length, nivel: sala.nivel });
}

io.on('connection', (socket) => {
  socket.on('criar-sala', ({ nome, quantidade = 20, nivel = 'todos' }, callback) => {
    const perguntasDisponiveis = perguntas.filter((pergunta) => nivel === 'todos' || pergunta.nivel === nivel);
    const quantidadeValida = Math.min(Math.max(Number(quantidade) || 1, 1), perguntasDisponiveis.length);
    if (!perguntasDisponiveis.length) return callback({ erro: 'Escolha uma dificuldade válida.' });
    const codigo = gerarCodigo();
    const sala = { jogadores: new Map(), perguntas: perguntasDaSala(perguntasDisponiveis.sort(() => Math.random() - 0.5).slice(0, quantidadeValida)), status: 'aguardando', nivel };
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
    if (!callback) callback = () => {};
    if (!sala || !pergunta) return callback({ erro: 'Pergunta inválida.' });
    if (sala.status !== 'iniciada') return callback({ erro: sala.status === 'pausada' ? 'A partida está pausada.' : 'A partida ainda não começou.' });
    if (jogador.respondidas.has(pergunta.id)) return callback({ erro: 'Você já respondeu esta pergunta.' });
    jogador.respondidas.add(pergunta.id);
    const perguntaCompleta = perguntas.find((item) => item.id === pergunta.id);
    const correta = perguntaCompleta.resposta === Number(resposta);
    if (correta) jogador.acertos += 1;
    if (pool) {
      try { await pool.query('INSERT INTO tentativas (nome, pergunta_id, resposta, correta) VALUES ($1, $2, $3, $4)', [jogador.nome, pergunta.id, Number(resposta) === -1 ? null : resposta, correta]); } catch (erro) { console.error('Não foi possível salvar a tentativa online:', erro.message); }
    }
    const resultado = { correta, explicacao: `A resposta correta é ${perguntaCompleta.opcoes[perguntaCompleta.resposta]}.` };
    callback(resultado);
    socket.emit('resultado-online', resultado);
    transmitirPlacar(jogador.codigo);
  });

  socket.on('usar-dica', ({ perguntaId }, callback = () => {}) => {
    const jogador = socket.data.jogador;
    const sala = jogador && salas.get(jogador.codigo);
    const pergunta = sala && perguntas.find((item) => item.id === Number(perguntaId));
    if (!sala || !pergunta || sala.status !== 'iniciada') return callback({ erro: 'A dica só pode ser usada durante a partida.' });
    const removidas = pergunta.opcoes.map((_, indice) => indice).filter((indice) => indice !== pergunta.resposta).sort(() => Math.random() - 0.5).slice(0, 2);
    callback({ sucesso: true, removidas });
  });

  socket.on('controle-sala', ({ acao }, callback = () => {}) => {
    const jogador = socket.data.jogador;
    const sala = jogador && salas.get(jogador.codigo);
    if (!sala || !jogador.admin) return callback({ erro: 'Apenas o administrador pode controlar a sala.' });
    if (!['iniciar', 'pausar', 'encerrar'].includes(acao)) return callback({ erro: 'Ação inválida.' });
    if (sala.timer) clearInterval(sala.timer);
    if (acao === 'iniciar') {
      sala.status = 'contando';
      callback({ sucesso: true, status: sala.status });
      transmitirEstadoSala(jogador.codigo);
      let contagem = 3;
      io.to(jogador.codigo).emit('contagem-regressiva', contagem);
      sala.timer = setInterval(() => {
        contagem -= 1;
        io.to(jogador.codigo).emit('contagem-regressiva', contagem);
        if (contagem === 0) {
          clearInterval(sala.timer);
          sala.timer = null;
          sala.status = 'iniciada';
          transmitirEstadoSala(jogador.codigo);
        }
      }, 1000);
      return;
    }
    sala.status = acao === 'pausar' ? 'pausada' : 'encerrada';
    callback({ sucesso: true, status: sala.status });
    transmitirEstadoSala(jogador.codigo);
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
  callback({ sucesso: true, codigo, perguntas: sala.perguntas, admin, status: sala.status, nivel: sala.nivel });
  transmitirPlacar(codigo);
  transmitirEstadoSala(codigo);
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
