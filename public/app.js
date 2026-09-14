const state = { nome: '', perguntas: [], atual: 0, acertos: 0, erros: 0, sequencia: 0, melhorSequencia: 0, tempos: [], respondida: false, dicaUsada: false, inicioPergunta: 0, faseAtual: 0, bonusAtual: 1 };
let totalEstrelas = 20;
const TEMPO_DICA = 5;
const nomesNiveis = { facil: 'FÁCIL', medio: 'MÉDIO', dificil: 'DIFÍCIL' };
const fases = [
  { nome: 'Céu de Cristal', bonus: 'x1', descricao: 'A aventura começa a brilhar' },
  { nome: 'Floresta de Luz', bonus: 'x2', descricao: 'As estrelas já se acenderam' },
  { nome: 'Planeta Azul', bonus: 'x3', descricao: 'Você está no meio da trilha' },
  { nome: 'Teto das Estrelas', bonus: 'x4', descricao: 'A constelação te escolheu' }
];
const loginScreen = document.querySelector('#login-screen');
const gameScreen = document.querySelector('#game-screen');
const finishScreen = document.querySelector('#finish-screen');
const progressFill = document.querySelector('#progress-fill');
const stars = document.querySelector('#stars');
const socket = io({
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  timeout: 20000
});
let modoSala = 'criar';
let codigoSala = '';

function atualizarMundos() {
  const bubbles = document.querySelectorAll('.world-bubble');
  const faseIndex = Math.min(Math.max(state.faseAtual || 0, 0), bubbles.length - 1);
  bubbles.forEach((bubble, index) => bubble.classList.toggle('active', index === faseIndex));
}

function atualizarModoSala() {
  const joinButton = document.querySelector('#join-mode');
  const hostButton = document.querySelector('#host-mode');
  const roomField = document.querySelector('#room-code-field');
  const createOptions = document.querySelector('#create-options');
  if (!joinButton || !hostButton || !roomField || !createOptions) {
    console.warn('Elementos de seleção de modo não encontrados');
    return;
  }

  const modoCriar = modoSala === 'criar';
  joinButton.classList.toggle('active', !modoCriar);
  hostButton.classList.toggle('active', modoCriar);
  
  if (modoCriar) {
    roomField.classList.add('hidden');
    createOptions.classList.remove('hidden');
  } else {
    roomField.classList.remove('hidden');
    createOptions.classList.add('hidden');
  }
}

function calcularMultiplicador() {
  return Math.min(4, Math.max(1, 1 + Math.floor((state.sequencia || 0) / 2)));
}

function obterFaseAtual() {
  const indice = Math.min(Math.floor(state.acertos / 5), fases.length - 1);
  return fases[indice] || fases[0];
}

function atualizarFaseDisplay() {
  const fase = obterFaseAtual();
  const bonus = calcularMultiplicador();
  state.faseAtual = fases.indexOf(fase);
  state.bonusAtual = bonus;
  const faseNome = document.querySelector('#phase-name');
  const faseBonus = document.querySelector('#phase-bonus');
  if (faseNome) faseNome.textContent = `Mundo ${state.faseAtual + 1} · ${fase.nome}`;
  if (faseBonus) faseBonus.textContent = `x${bonus}`;
  atualizarMundos();
}

function embaralhar(lista) {
  const nova = [...lista];
  for (let i = nova.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nova[i], nova[j]] = [nova[j], nova[i]];
  }
  return nova;
}

function organizarPerguntas(perguntas) {
  const embaralhadas = embaralhar(perguntas);
  return embaralhadas.sort((a, b) => {
    const ordemNivel = { facil: 0, medio: 1, dificil: 2 };
    return ordemNivel[a.nivel] - ordemNivel[b.nivel];
  });
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
  atualizarFaseDisplay();
  document.querySelector('#question-number').textContent = `NÍVEL ${nomesNiveis[pergunta.nivel]} • PERGUNTA ${state.atual + 1}`;
  document.querySelector('#question-text').textContent = pergunta.pergunta;
  const image = document.querySelector('#question-image');
  image.src = pergunta.imagem;
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
  const pergunta = state.perguntas[state.atual];
  socket.emit('usar-dica', { perguntaId: pergunta.id }, (resultado) => {
    if (resultado.erro) return window.alert(resultado.erro);
    state.dicaUsada = true;
    resultado.removidas.forEach((indice) => { document.querySelectorAll('.option')[indice].disabled = true; document.querySelectorAll('.option')[indice].classList.add('hint-removed'); });
    document.querySelector('#hint-button').textContent = '💡 Dica usada';
    document.querySelector('#hint-button').disabled = true;
  });
}

async function responder(resposta, button) {
  if (state.respondida) return;
  state.respondida = true;
  const pergunta = state.perguntas[state.atual];
  const resultado = await new Promise((resolve) => socket.emit('responder-online', { perguntaId: pergunta.id, resposta }, resolve));
  if (!resultado || resultado.erro) { state.respondida = false; return window.alert(resultado?.erro || 'Não foi possível registrar sua resposta.'); }
  state.tempos.push((Date.now() - state.inicioPergunta) / 1000);
  document.querySelectorAll('.option').forEach((item) => { item.disabled = true; });
  button.classList.add(resultado.correta ? 'correct' : 'wrong');
  const feedback = document.querySelector('#feedback');

  if (resultado.correta) {
    state.acertos += 1;
    state.sequencia += 1;
    state.melhorSequencia = Math.max(state.melhorSequencia, state.sequencia);
    const multiplicador = calcularMultiplicador();
    const bonusLabel = `x${multiplicador}`;
    const faseBonus = document.querySelector('#phase-bonus');
    if (faseBonus) faseBonus.textContent = bonusLabel;
    feedback.textContent = `Muito bem! Bônus de sequência ${bonusLabel}! ✨`;
  } else {
    state.erros += 1;
    state.sequencia = 0;
    feedback.textContent = 'Quase! A aventura continua!';
  }
  feedback.classList.toggle('error', !resultado.correta);
  document.querySelector('#explanation').textContent = resultado.explicacao;
  document.querySelector('#streak-label').textContent = `🔥 Sequência: ${state.sequencia}`;
  atualizarFaseDisplay();
  if (resultado.correta) document.querySelector('.question-card').classList.add('star-pop');
  document.querySelector('#score-label').textContent = `${state.acertos} acerto${state.acertos === 1 ? '' : 's'}`;
  setTimeout(() => {
    state.atual += 1;
    document.querySelector('.question-card').classList.remove('star-pop');
    if (state.acertos === totalEstrelas) finalizar();
    else if (state.atual < state.perguntas.length) renderizarPergunta();
    else {
      state.atual = 0;
      state.perguntas = organizarPerguntas(state.perguntas);
      renderizarPergunta();
    }
  }, 1000);
}

function atualizarProgresso() {
  const total = totalEstrelas;
  const percentual = total ? (state.acertos / total) * 100 : 0;
  progressFill.style.width = `${percentual}%`;
  document.querySelector('#progress-count').textContent = `${state.acertos}/${total}`;
  stars.innerHTML = Array.from({ length: total }, (_, index) => `<span>${index < state.acertos ? '★' : '☆'}</span>`).join('');
}

function finalizar() {
  gameScreen.classList.add('hidden');
  finishScreen.classList.remove('hidden');
  document.querySelector('#final-score').textContent = `${state.acertos}/${totalEstrelas}`;
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
  const dados = modoSala === 'criar' ? { nome: state.nome, quantidade: Number(document.querySelector('#question-count').value), nivel: document.querySelector('#question-level').value } : { nome: state.nome, codigo: document.querySelector('#room-code').value };
  socket.emit(evento, dados, (resultado) => {
    if (resultado.erro) return window.alert(resultado.erro);
    codigoSala = resultado.codigo;
    totalEstrelas = resultado.perguntas.length;
    state.perguntas = organizarPerguntas(resultado.perguntas);
    document.querySelector('#player-label').textContent = state.nome;
    document.querySelector('#room-code-label').textContent = codigoSala;
    const adminPanel = document.querySelector('#admin-panel');
    if (resultado.admin) {
      document.querySelector('#room-status').textContent = '✨ Você criou esta sala • Clique em "Iniciar" para começar!';
      adminPanel.classList.remove('hidden');
    } else {
      document.querySelector('#room-status').textContent = '👥 Jogando com sua turma • Aguarde o administrador iniciar';
      adminPanel.classList.add('hidden');
    }
    loginScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    renderizarPergunta();
  });
});

document.querySelector('#join-mode').addEventListener('click', () => {
  modoSala = 'entrar';
  atualizarModoSala();
});

document.querySelector('#host-mode').addEventListener('click', () => {
  modoSala = 'criar';
  atualizarModoSala();
});

socket.on('placar-atualizado', (placar) => {
  document.querySelector('#online-scoreboard').innerHTML = placar.length
    ? placar.map((jogador, indice) => `<li class="${jogador.nome === state.nome ? 'current-player' : ''}"><span><b>${indice + 1}</b>${jogador.nome}</span><strong>${jogador.acertos} ★ <small>${Number(jogador.respondidas) || 0} resp.</small></strong></li>`).join('')
    : '<li>Aguardando jogadores...</li>';
  document.querySelector('#room-status').textContent = `${placar.length}/10 jogadores online`;
});

socket.on('resultado-online', (resultado) => {
  window.dispatchEvent(new CustomEvent('resultado-online-recebido', { detail: resultado }));
});

function voltarAoInicio() {
  gameScreen.classList.add('hidden');
  finishScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  document.querySelector('#admin-panel').classList.add('hidden');
  document.querySelector('#room-code').value = '';
  modoSala = 'entrar';
  atualizarModoSala();
  state.atual = 0;
  state.acertos = 0;
  state.erros = 0;
  state.sequencia = 0;
  state.melhorSequencia = 0;
  state.tempos = [];
  state.faseAtual = 0;
  state.bonusAtual = 1;
}

socket.on('estado-sala', ({ status, quantidade }) => {
  if (status !== 'contando') document.querySelector('#countdown-overlay').classList.add('hidden');
  if (status === 'encerrada') return voltarAoInicio();
  const nomes = { aguardando: 'Aguardando o administrador iniciar', contando: 'Prepare-se! A partida vai começar', iniciada: `${quantidade} perguntas • partida em andamento`, pausada: 'Partida pausada pelo administrador', encerrada: 'Partida encerrada' };
  document.querySelector('#room-status').textContent = nomes[status] || nomes.aguardando;
  document.querySelectorAll('.option').forEach((item) => { item.disabled = status !== 'iniciada'; });
  document.querySelector('#hint-button').disabled = status !== 'iniciada';
  document.querySelector('#start-game').disabled = status === 'iniciada' || status === 'contando' || status === 'encerrada';
  document.querySelector('#pause-game').disabled = status !== 'iniciada';
  document.querySelector('#end-game').disabled = status === 'encerrada';
});

socket.on('contagem-regressiva', (numero) => {
  const overlay = document.querySelector('#countdown-overlay');
  if (numero === 0) return overlay.classList.add('hidden');
  overlay.textContent = numero;
  overlay.classList.remove('hidden');
});

document.querySelectorAll('.admin-actions button').forEach((button) => button.addEventListener('click', () => {
  const acoes = { 'start-game': 'iniciar', 'pause-game': 'pausar', 'end-game': 'encerrar' };
  const acao = acoes[button.id];
  socket.emit('controle-sala', { acao }, (resultado) => { if (resultado.erro) window.alert(resultado.erro); });
}));

document.querySelector('#hint-button').addEventListener('click', usarDica);
renderizarRanking();
atualizarModoSala();

document.querySelector('#exit-button').addEventListener('click', () => {
  gameScreen.classList.add('hidden');
  loginScreen.classList.remove('hidden');
  document.querySelector('#admin-panel').classList.add('hidden');
  modoSala = 'entrar';
  atualizarModoSala();
});

document.querySelector('#restart-button').addEventListener('click', () => {
  state.atual = 0;
  state.acertos = 0;
  state.erros = 0;
  state.sequencia = 0;
  state.melhorSequencia = 0;
  state.tempos = [];
  state.faseAtual = 0;
  state.bonusAtual = 1;
  finishScreen.classList.add('hidden');
  gameScreen.classList.remove('hidden');
  carregarPerguntas();
});
