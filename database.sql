-- No pgAdmin, crie o banco trilha_estrelas e execute este arquivo nele.

CREATE TABLE IF NOT EXISTS perguntas (
  id INTEGER PRIMARY KEY,
  nivel VARCHAR(10) NOT NULL CHECK (nivel IN ('facil', 'medio', 'dificil')),
  pergunta TEXT NOT NULL,
  imagem TEXT NOT NULL,
  opcoes JSONB NOT NULL,
  resposta INTEGER NOT NULL CHECK (resposta >= 0 AND resposta < 4)
);

CREATE TABLE IF NOT EXISTS tentativas (
  id BIGSERIAL PRIMARY KEY,
  nome VARCHAR(18) NOT NULL,
  pergunta_id INTEGER NOT NULL REFERENCES perguntas(id),
  resposta INTEGER NOT NULL CHECK (resposta >= 0 AND resposta < 4),
  correta BOOLEAN NOT NULL,
  respondida_em TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tentativas DROP CONSTRAINT IF EXISTS tentativas_resposta_check;
ALTER TABLE tentativas ADD CONSTRAINT tentativas_resposta_check CHECK (resposta IS NULL OR (resposta >= 0 AND resposta < 4));

INSERT INTO perguntas (id, nivel, pergunta, imagem, opcoes, resposta) VALUES
(1, 'facil', 'Qual animal faz "miau"?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f431.png', '["Cachorro", "Gato", "Pato", "Cavalo"]', 1),
(2, 'facil', 'Quanto é 2 + 3?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', '["4", "5", "6", "7"]', 1),
(3, 'facil', 'Qual é a cor do sol nos desenhos?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2600.png', '["Azul", "Verde", "Amarelo", "Roxo"]', 2),
(4, 'facil', 'Quantas pernas tem uma borboleta?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f98b.png', '["4", "6", "8", "10"]', 1),
(5, 'medio', 'Qual fruta é conhecida por ser amarela e comprida?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f34c.png', '["Banana", "Maçã", "Uva", "Melancia"]', 0),
(6, 'medio', 'Qual destes animais vive na água?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f41f.png', '["Peixe", "Leão", "Coelho", "Galinha"]', 0),
(7, 'medio', 'Qual forma tem três lados?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f53a.png', '["Círculo", "Quadrado", "Triângulo", "Retângulo"]', 2),
(8, 'medio', 'Qual estação do ano costuma ser bem quentinha?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f324-fe0f.png', '["Inverno", "Verão", "Outono", "Primavera"]', 1),
(9, 'dificil', 'O que usamos para ouvir música?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3a7.png', '["Colher", "Travesseiro", "Fone", "Caderno"]', 2),
(10, 'dificil', 'Qual destes é um meio de transporte?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f6b2.png', '["Bicicleta", "Almofada", "Lápis", "Bolo"]', 0),
(11, 'dificil', 'Se você tem 10 balas e dá 3, com quantas fica?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f36c.png', '["5", "6", "7", "8"]', 2),
(12, 'dificil', 'Qual planeta é conhecido como planeta vermelho?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2642-fe0f.png', '["Marte", "Terra", "Júpiter", "Saturno"]', 0),
(13, 'facil', 'Qual objeto usamos para escrever?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/270f-fe0f.png', '["Lápis", "Sapato", "Prato", "Bola"]', 0),
(14, 'facil', 'Quantos dias tem uma semana?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f4c5.png', '["5", "6", "7", "8"]', 2),
(15, 'medio', 'Quantos meses formam um ano?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f5d3-fe0f.png', '["10", "11", "12", "13"]', 2),
(16, 'medio', 'Qual é o maior animal terrestre?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f418.png', '["Elefante", "Gato", "Macaco", "Cachorro"]', 0),
(17, 'dificil', 'Qual é o resultado de 6 x 4?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', '["20", "24", "28", "32"]', 1),
(18, 'dificil', 'Como se chama a água em estado sólido?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2744-fe0f.png', '["Vapor", "Chuva", "Gelo", "Neve"]', 2),
(19, 'facil', 'Qual destes objetos usamos para cortar papel?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2702-fe0f.png', '["Tesoura", "Colher", "Almofada", "Chapéu"]', 0),
(20, 'medio', 'Qual é o dobro de 8?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', '["12", "14", "16", "18"]', 2),
(21, 'dificil', 'Qual gás as plantas liberam durante a fotossíntese?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f33f.png', '["Oxigênio", "Fumaça", "Hélio", "Vapor"]', 0),
(22, 'facil', 'Qual animal tem uma longa tromba?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f418.png', '["Elefante", "Peixe", "Pinguim", "Rato"]', 0),
(23, 'medio', 'Quantas horas tem um dia?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/23f0.png', '["12", "18", "24", "30"]', 2),
(24, 'dificil', 'Qual é o maior planeta do sistema solar?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1fa90.png', '["Marte", "Júpiter", "Terra", "Mercúrio"]', 1),
(25, 'facil', 'Qual fruta é vermelha e tem sementes por fora?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f353.png', '["Morango", "Banana", "Limão", "Coco"]', 0),
(26, 'facil', 'Qual parte do corpo usamos para enxergar?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f441.png', '["Ouvidos", "Olhos", "Pés", "Mãos"]', 1),
(27, 'medio', 'Qual número vem depois do 99?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f522.png', '["98", "100", "101", "90"]', 1),
(28, 'medio', 'Qual instrumento tem teclas pretas e brancas?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f3b9.png', '["Tambor", "Piano", "Violão", "Flauta"]', 1),
(29, 'dificil', 'Quantos lados tem um hexágono?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/1f537.png', '["4", "5", "6", "8"]', 2),
(30, 'dificil', 'Qual órgão bombeia o sangue pelo corpo?', 'https://cdn.jsdelivr.net/gh/twitter/twemoji@latest/assets/72x72/2764-fe0f.png', '["Pulmão", "Cérebro", "Estômago", "Coração"]', 3)
ON CONFLICT (id) DO UPDATE SET nivel = EXCLUDED.nivel, pergunta = EXCLUDED.pergunta, imagem = EXCLUDED.imagem, opcoes = EXCLUDED.opcoes, resposta = EXCLUDED.resposta;