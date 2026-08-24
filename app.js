const state = { nome: '', perguntas: [], atual: 0, acertos: 0, erros: 0, sequencia: 0, melhorSequencia: 0, tempos: [], respondida: false, dicaUsada: false, inicioPergunta: 0 };
const TOTAL_ESTRELAS = 20;
const TEMPO_DICA = 5;
const nomesNiveis = { facil: 'FÁCIL', medio: 'MÉDIO', dificil: 'DIFÍCIL' };
const loginScreen = document.querySelector('#login-screen');
const gameScreen = document.querySelector('#game-screen');
const finishScreen = document.querySelector('#finish-screen');
const progressFill = document.querySelector('#progress-fill');
const stars = document.querySelector('#stars');
const socket = io();
let modoSala = 'entrar';
let codigoSala = '';

function embaralhar(lista) {
  return [...lista].sort(() => Math.random() - 0.5);
}

function organizarPerguntas(perguntas) {
  return ['facil', 'medio', 'dificil'].flatMap((nivel) => embaralhar(perguntas.filter((pergunta) => pergunta.nivel === nivel)));
}

async function carregarPerguntas() {
  const response = await fetch('/api/perguntas');
  state.perguntas = organizarPerguntas(await response.json());
  renderizarPergunta();
}

function renderizarPergunta() {
  const pergunta = state.perguntas[state.atual];
  state.respondida = false;
  state.dicaUsada = false;
  state.inicioPergunta = Date.now();
  document.querySelector('#question-number').textContent = `NÍVEL ${nomesNiveis[pergunta.nivel]} • PERGUNTA ${state.atual + 1}`;
  document.querySelector('#question-text').textContent = pergunta.pergunta;
  const image = document.querySelector('#question-image');
  image.src = pergunta.imagem.replace('2600-fe0f.png', '2600.png');
  image.alt = `Imagem da pergunta: ${pergunta.pergunta}`;
  document.querySelector('#score-label').textContent = `${state.acertos} acerto${state.acertos === 1 ? '' : 's'}`;
  document.querySelector('#feedback').textContent = '';
  document.querySelector('#feedback').className = 'feedback';
  document.querySelector('#explanation').textContent = '';
  document.querySelector('#hint-button').disabled = false;
  document.querySelector('#hint-button').textContent = '💡 Dica';
  const options = document.querySelector('#options');
  options.innerHTML = '';
  pergunta.opcoes.forEach((opcao, indice) => {
    const button = document.createElement('button');
    button.className = 'option';
    button.type = 'button';
    button.textContent = opcao;
    button.addEventListener('click', () => responder(indice, button));
    options.appendChild(button);
  });
  atualizarProgresso();
}

function usarDica() {
  if (state.respondida || state.dicaUsada) return;
  state.dicaUsada = true;
  const pergunta = state.perguntas[state.atual];
  const incorretas = embaralhar(pergunta.opcoes.map((_, indice) => indice).filter((indice) => indice !== pergunta.resposta)).slice(0, 2);
  incorretas.forEach((indice) => { document.querySelectorAll('.option')[indice].disabled = true; document.querySelectorAll('.option')[indice].classList.add('hint-removed'); });
  document.querySelector('#hint-button').textContent = '💡 Dica usada';
  document.querySelector('#hint-button').disabled = true;
}

async function responder(resposta, button) {
  if (state.respondida) return;
  state.respondida = true;
  const pergunta = state.perguntas[state.atual];
  const resultado = await new Promise((resolve) => socket.emit('responder-online', { perguntaId: pergunta.id, resposta }, resolve));
  state.tempos.push((Date.now() - state.inicioPergunta) / 1000);
  document.querySelectorAll('.option').forEach((item) => { item.disabled = true; });
  button.classList.add(resultado.correta ? 'correct' : 'wrong');
  if (resultado.correta) { state.acertos += 1; state.sequencia += 1; state.melhorSequencia = Math.max(state.melhorSequencia, state.sequencia); }
  else { state.erros += 1; state.sequencia = 0; }
  const feedback = document.querySelector('#feedback');
  feedback.textContent = resultado.correta ? 'Muito bem! Você acendeu uma estrela! ✨' : 'Quase! A aventura continua!';
  feedback.classList.toggle('error', !resultado.correta);
  document.querySelector('#explanation').textContent = resultado.explicacao;
  document.querySelector('#streak-label').textContent = `🔥 Sequência: ${state.sequencia}`;
  if (resultado.correta) document.querySelector('.question-card').classList.add('star-pop');
  document.querySelector('#score-label').textContent = `${state.acertos} acerto${state.acertos === 1 ? '' : 's'}`;
  setTimeout(() => {
    state.atual += 1;
    document.querySelector('.question-card').classList.remove('star-pop');
    if (state.acertos === TOTAL_ESTRELAS) finalizar();
    else if (state.atual < state.perguntas.length) renderizarPergunta();
    else {
      state.atual = 0;
      state.perguntas = organizarPerguntas(state.perguntas);
      renderizarPergunta();
    }
  }, 1000);
}

function atualizarProgresso() {
  const total = TOTAL_ESTRELAS;
  const percentual = total ? (state.acertos / total) * 100 : 0;
  progressFill.style.width = `${percentual}%`;
  document.querySelector('#progress-count').textContent = `${state.acertos}/${total}`;
  stars.innerHTML = Array.from({ length: total }, (_, index) => `<span>${index < state.acertos ? '★' : '☆'}</span>`).join('');
}

function finalizar() {
  gameScreen.classList.add('hidden');
  finishScreen.classList.remove('hidden');
  document.querySelector('#final-score').textContent = `${state.acertos}/${TOTAL_ESTRELAS}`;
  document.querySelector('#finish-message').textContent = `Parabéns, ${state.nome}! Todas as estrelas são suas.`;
  document.querySelector('#stat-correct').textContent = state.acertos;
  document.querySelector('#stat-wrong').textContent = state.erros;
  document.querySelector('#stat-time').textContent = `${(state.tempos.reduce((total, tempo) => total + tempo, 0) / state.tempos.length || 0).toFixed(1)}s`;
  document.querySelector('#stat-streak').textContent = state.melhorSequencia;
  salvarRanking();
  renderizarRanking();
  soltarConfetes();
  atualizarProgresso();
}

function salvarRanking() {
  const ranking = JSON.parse(localStorage.getItem('trilha-ranking') || '[]');
  ranking.push({ nome: state.nome, acertos: state.acertos, tempo: state.tempos.reduce((total, tempo) => total + tempo, 0) });
  ranking.sort((a, b) => b.acertos - a.acertos || a.tempo - b.tempo);
  localStorage.setItem('trilha-ranking', JSON.stringify(ranking.slice(0, 5)));
}

function renderizarRanking() {
  const ranking = JSON.parse(localStorage.getItem('trilha-ranking') || '[]');
  document.querySelector('#ranking-list').innerHTML = ranking.length ? ranking.map((jogador, indice) => `<li><span>${indice + 1}. ${jogador.nome}</span><strong>${jogador.acertos} ★</strong></li>`).join('') : '<li>Seja o primeiro a jogar!</li>';
}

function soltarConfetes() {
  const confetti = document.querySelector('#confetti');
  confetti.innerHTML = Array.from({ length: 36 }, (_, indice) => `<i style="--i:${indice}; --h:${(indice * 47) % 360}deg"></i>`).join('');
  setTimeout(() => { confetti.innerHTML = ''; }, 4000);
}

document.querySelector('#login-form').addEventListener('submit', (event) => {
  event.preventDefault();
  state.nome = document.querySelector('#player-name').value.trim();
  if (!state.nome) return;
  const evento = modoSala === 'criar' ? 'criar-sala' : 'entrar-sala';
  const dados = modoSala === 'criar' ? { nome: state.nome } : { nome: state.nome, codigo: document.querySelector('#room-code').value };
  socket.emit(evento, dados, (resultado) => {
    if (resultado.erro) return window.alert(resultado.erro);
    codigoSala = resultado.codigo;
    state.perguntas = organizarPerguntas(resultado.perguntas);
    document.querySelector('#player-label').textContent = state.nome;
    document.querySelector('#room-code-label').textContent = codigoSala;
    document.querySelector('#room-status').textContent = resultado.admin ? 'Você criou esta sala' : 'Jogando com sua turma';
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    renderizarPergunta();
  });
});

document.querySelector('#join-mode').addEventListener('click', () => {
  modoSala = 'entrar';
  document.querySelector('#join-mode').classList.add('active');
  document.querySelector('#host-mode').classList.remove('active');
  document.querySelector('#room-code-field').classList.remove('hidden');
});

document.querySelector('#host-mode').addEventListener('click', () => {
  modoSala = 'criar';
  document.querySelector('#host-mode').classList.add('active');
  document.querySelector('#join-mode').classList.remove('active');
  document.querySelector('#room-code-field').classList.add('hidden');
});

socket.on('placar-atualizado', (placar) => {
  document.querySelector('#online-scoreboard').innerHTML = placar.length
    ? placar.map((jogador, indice) => `<li class="${jogador.nome === state.nome ? 'current-player' : ''}"><span><b>${indice + 1}</b>${jogador.nome}</span><strong>${jogador.acertos} ★</strong></li>`).join('')
    : '<li>Aguardando jogadores...</li>';
  document.querySelector('#room-status').textContent = `${placar.length}/10 jogadores online`;
});

socket.on('resultado-online', (resultado) => {
  window.dispatchEvent(new CustomEvent('resultado-online-recebido', { detail: resultado }));
});

document.querySelector('#hint-button').addEventListener('click', usarDica);
renderizarRanking();

document.querySelector('#exit-button').addEventListener('click', () => {
  gameScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
});

document.querySelector('#restart-button').addEventListener('click', () => {
  state.atual = 0;
  state.acertos = 0;
  state.erros = 0;
  state.sequencia = 0;
  state.melhorSequencia = 0;
  state.tempos = [];
  finishScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  carregarPerguntas();
});
