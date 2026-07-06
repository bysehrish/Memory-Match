const board = document.getElementById('board');
const newGameBtn = document.getElementById('new-game');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const statusEl = document.getElementById('game-status');
const modal = document.getElementById('victory-modal');
const modalReplay = document.getElementById('modal-replay');
const winMovesEl = document.getElementById('win-moves');
const winScoreEl = document.getElementById('win-score');
const winHighScoreEl = document.getElementById('win-high-score');

const emojis = ['⭐️','🍉','🎈','🍓','🐝','🧸','🦄','🌈'];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchedPairs = 0;
let score = 0;
let highScore = 0;

function shuffle(array) {
  return array
    .map(value => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
}

function loadHighScore() {
  const stored = localStorage.getItem('memory-match-high-score');
  highScore = stored ? Number(stored) : 0;
}

function saveHighScore() {
  localStorage.setItem('memory-match-high-score', String(highScore));
}

function setStatus(message) {
  if (statusEl) {
    statusEl.textContent = message;
  }
}

function updateScoreBoard() {
  movesEl.textContent = moves;
  pairsEl.textContent = `${matchedPairs} / ${emojis.length}`;
  scoreEl.textContent = score;
  highScoreEl.textContent = highScore > 0 ? highScore : '--';
}

function createCard(emoji) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'card';
  card.dataset.emoji = emoji;

  const inner = document.createElement('div');
  inner.className = 'card-inner';

  const front = document.createElement('div');
  front.className = 'card-front';

  const back = document.createElement('div');
  back.className = 'card-back';
  back.innerHTML = `<span class="emoji">${emoji}</span>`;

  inner.append(front, back);
  card.appendChild(inner);
  card.addEventListener('click', () => handleCardClick(card));
  return card;
}

function resetGameState() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function setupBoard() {
  board.innerHTML = '';
  const deck = shuffle([...emojis, ...emojis]);
  deck.forEach(emoji => board.appendChild(createCard(emoji)));

  moves = 0;
  matchedPairs = 0;
  score = 0;
  loadHighScore();
  updateScoreBoard();
  closeModal();
  resetGameState();
  setStatus('Fresh board ready — pick two leafy cards.');
}

function handleCardClick(card) {
  if (lockBoard || card.classList.contains('revealed') || card.classList.contains('matched')) return;

  card.classList.add('revealed');

  if (!firstCard) {
    firstCard = card;
    setStatus('Great start — flip one more card.');
    return;
  }

  secondCard = card;
  lockBoard = true;
  moves += 1;
  updateScoreBoard();

  if (firstCard.dataset.emoji === secondCard.dataset.emoji) {
    handleMatch();
  } else {
    handleMismatch();
  }
}

function handleMatch() {
  firstCard.classList.add('matched');
  secondCard.classList.add('matched');
  score += 100;
  matchedPairs += 1;
  animateMatch(firstCard);
  animateMatch(secondCard);
  resetGameState();
  updateScoreBoard();
  setStatus('Perfect match! Keep the streak going.');

  if (matchedPairs === emojis.length) {
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    setTimeout(() => {
      setStatus('You cleared the garden — lovely work!');
      showVictoryModal();
    }, 450);
  }
}

function handleMismatch() {
  score = Math.max(0, score - 10);
  updateScoreBoard();
  setStatus('Not a match — give it another try.');
  setTimeout(() => {
    firstCard.classList.remove('revealed');
    secondCard.classList.remove('revealed');
    resetGameState();
    setStatus('Try a new pair and keep the garden growing.');
  }, 900);
}

function animateMatch(card) {
  card.classList.add('matched');
  triggerMatchBurst(card);
  setTimeout(() => card.classList.remove('matched'), 300);
}

function triggerMatchBurst(card) {
  const layer = document.querySelector('.confetti-layer');
  const rect = card.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const particles = ['✨', '🎉', '🌟', '💖', '🎈'];

  for (let i = 0; i < 8; i++) {
    const piece = document.createElement('div');
    piece.className = 'match-burst-piece';
    piece.textContent = particles[Math.floor(Math.random() * particles.length)];

    const angle = Math.random() * Math.PI * 2;
    const distance = 70 + Math.random() * 70;
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const rot = `${Math.random() * 360}deg`;
    const duration = 520 + Math.random() * 180;

    piece.style.left = `${originX}px`;
    piece.style.top = `${originY}px`;
    piece.style.setProperty('--dx', `${dx}px`);
    piece.style.setProperty('--dy', `${dy}px`);
    piece.style.setProperty('--rot', rot);
    piece.style.animation = `match-burst ${duration}ms ease-out forwards`;

    layer.appendChild(piece);
    setTimeout(() => {
      if (piece.parentNode) piece.parentNode.removeChild(piece);
    }, duration + 50);
  }
}

function showVictoryModal() {
  winMovesEl.textContent = moves;
  winScoreEl.textContent = score;
  winHighScoreEl.textContent = highScore > 0 ? highScore : '--';
  modal.classList.remove('hidden');
  launchCelebration();
}

function closeModal() {
  modal.classList.add('hidden');
}

function launchCelebration() {
  const layer = document.querySelector('.confetti-layer');
  layer.innerHTML = '';
  const colors = ['#4f9d62', '#8ecf9b', '#ffe36b', '#7dd3fc', '#ffb36b'];

  for (let i = 0; i < 40; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = `${-10 - Math.random() * 10}vh`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.animation = `confetti-fall ${1200 + Math.random() * 600}ms linear forwards`;
    layer.appendChild(piece);
  }

  for (let i = 0; i < 18; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-piece';
    sparkle.style.background = colors[Math.floor(Math.random() * colors.length)];
    sparkle.style.left = `${20 + Math.random() * 60}vw`;
    sparkle.style.top = `${20 + Math.random() * 45}vh`;
    sparkle.style.animation = `sparkle-pop ${450 + Math.random() * 250}ms ease-out forwards`;
    layer.appendChild(sparkle);
  }

  setTimeout(() => layer.innerHTML = '', 2200);
}

newGameBtn.addEventListener('click', setupBoard);
modalReplay.addEventListener('click', setupBoard);
modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

setupBoard();
