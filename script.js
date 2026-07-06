const board = document.getElementById('board');
const newGameBtn = document.getElementById('new-game');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
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
  try {
    const stored = localStorage.getItem('memory-match-high-score');
    highScore = stored ? Number(stored) : 0;
  } catch (e) {
    highScore = 0;
  }
}

function saveHighScore() {
  try {
    localStorage.setItem('memory-match-high-score', String(highScore));
  } catch (e) {
    // ignore storage errors (e.g., private mode)
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
  card.setAttribute('aria-pressed', 'false');
  card.setAttribute('aria-label', 'Hidden card');

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
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      card.click();
    }
  });
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
}

function handleCardClick(card) {
  if (lockBoard || card.classList.contains('revealed') || card.classList.contains('matched')) return;

  card.classList.add('revealed');
  card.setAttribute('aria-pressed', 'true');
  card.setAttribute('aria-label', `Card showing ${card.dataset.emoji}`);

  if (!firstCard) {
    firstCard = card;
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
  firstCard.setAttribute('aria-pressed', 'true');
  secondCard.setAttribute('aria-pressed', 'true');
  const live = document.getElementById('sr-live');
  if (live) live.textContent = `Matched ${firstCard.dataset.emoji}`;
  score += 100;
  matchedPairs += 1;
  animateMatch(firstCard);
  animateMatch(secondCard);
  resetGameState();
  updateScoreBoard();

  if (matchedPairs === emojis.length) {
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    setTimeout(showVictoryModal, 450);
  }
}

function handleMismatch() {
  score = Math.max(0, score - 10);
  updateScoreBoard();
  setTimeout(() => {
    firstCard.classList.remove('revealed');
    secondCard.classList.remove('revealed');
    firstCard.setAttribute('aria-pressed', 'false');
    secondCard.setAttribute('aria-pressed', 'false');
    resetGameState();
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

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const concurrency = navigator.hardwareConcurrency || 4;
  const count = reduced ? 0 : Math.max(4, Math.min(12, Math.floor(concurrency * 2)));

  for (let i = 0; i < count; i++) {
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
  trapModalFocus(modal);
  launchCelebration();
}

function closeModal() {
  modal.classList.add('hidden');
  releaseModalFocus(modal);
}

// Modal focus trap utilities
let lastFocusedBeforeModal = null;
function trapModalFocus(modalEl) {
  lastFocusedBeforeModal = document.activeElement;
  const focusable = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  function keyHandler(e) {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    } else if (e.key === 'Escape') {
      closeModal();
    }
  }
  modalEl.__keyHandler = keyHandler;
  document.addEventListener('keydown', keyHandler);
  if (first) first.focus();
}

function releaseModalFocus(modalEl) {
  if (modalEl && modalEl.__keyHandler) {
    document.removeEventListener('keydown', modalEl.__keyHandler);
    delete modalEl.__keyHandler;
  }
  if (lastFocusedBeforeModal) lastFocusedBeforeModal.focus();
  lastFocusedBeforeModal = null;
}

function launchCelebration() {
  const layer = document.querySelector('.confetti-layer');
  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  layer.innerHTML = '';
  if (reduced) return;
  const colors = ['#ff7dfd', '#ffe36b', '#8bf0ff', '#8fffa4', '#ffba8f'];
  const concurrency = navigator.hardwareConcurrency || 4;
  const confettiCount = Math.max(16, Math.min(40, concurrency * 8));
  const sparkleCount = Math.max(6, Math.min(18, concurrency * 4));

  for (let i = 0; i < confettiCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.top = `${-10 - Math.random() * 10}vh`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    piece.style.animation = `confetti-fall ${1200 + Math.random() * 600}ms linear forwards`;
    layer.appendChild(piece);
  }

  for (let i = 0; i < sparkleCount; i++) {
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

// Responsive card sizing: compute exact size so 4x4 fits viewport
function updateCardSize() {
  const shell = document.querySelector('.page-shell');
  const header = document.querySelector('.game-header');
  const shellStyles = getComputedStyle(shell);
  const shellPaddingX = parseFloat(shellStyles.paddingLeft) + parseFloat(shellStyles.paddingRight);
  const availableWidth = Math.max(320, window.innerWidth - shellPaddingX - 24);
  const headerHeight = header ? header.getBoundingClientRect().height : 120;
  const availableHeight = Math.max(320, window.innerHeight - headerHeight - 160); // leave room for modal/other
  const maxByWidth = Math.floor(availableWidth / 4) - 12;
  const maxByHeight = Math.floor(availableHeight / 4) - 12;
  const size = Math.max(36, Math.min(160, Math.min(maxByWidth, maxByHeight)));
  document.documentElement.style.setProperty('--card-size', `${size}px`);
}

let resizeTimeout = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateCardSize, 120);
});

// init sizing then board
updateCardSize();
setupBoard();
