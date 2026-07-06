const board = document.getElementById('board');
const newGameBtn = document.getElementById('new-game');
const movesEl = document.getElementById('moves');
const pairsEl = document.getElementById('pairs');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('high-score');
const statusEl = document.getElementById('game-status');
const soundToggle = document.getElementById('sound-toggle');
const modal = document.getElementById('victory-modal');
const modalReplay = document.getElementById('modal-replay');
const winMovesEl = document.getElementById('win-moves');
const winScoreEl = document.getElementById('win-score');
const winHighScoreEl = document.getElementById('win-high-score');

const emojis = ['👾', '🕹️', '💾', '📼', '💿', '🎧', '📟', '🚀'];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let moves = 0;
let matchedPairs = 0;
let score = 0;
let highScore = 0;
let soundEnabled = true;
let audioContext = null;

function getAudioContext() {
  if (!audioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioContext = new AudioContext();
  }
  if (audioContext?.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

function playTone(frequency, duration = 0.08, type = 'square', delay = 0, volume = 0.045) {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;

  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration);
}

function playSound(name) {
  const patterns = {
    flip: [[420, 0.045, 'square', 0]],
    match: [[523, 0.08, 'square', 0], [659, 0.08, 'square', 0.07], [784, 0.12, 'square', 0.14]],
    miss: [[210, 0.09, 'sawtooth', 0], [150, 0.13, 'sawtooth', 0.08]],
    start: [[330, 0.06, 'square', 0], [440, 0.06, 'square', 0.06], [660, 0.1, 'square', 0.12]],
    win: [[523, 0.1, 'square', 0], [659, 0.1, 'square', 0.1], [784, 0.1, 'square', 0.2], [1047, 0.24, 'square', 0.3]]
  };
  (patterns[name] || []).forEach(args => playTone(...args));
}

function loadSoundPreference() {
  try {
    soundEnabled = localStorage.getItem('pixel-pairs-sound') !== 'off';
  } catch (error) {
    soundEnabled = true;
  }
  updateSoundButton();
}

function updateSoundButton() {
  soundToggle.textContent = `Sound: ${soundEnabled ? 'on' : 'off'}`;
  soundToggle.setAttribute('aria-pressed', String(!soundEnabled));
  soundToggle.setAttribute('aria-label', soundEnabled ? 'Mute game sounds' : 'Enable game sounds');
}

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
  board.classList.add('is-shuffling');
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
  setStatus('New run loaded. Pick a tile.');
  playSound('start');
  setTimeout(() => board.classList.remove('is-shuffling'), 260);
}

function handleCardClick(card) {
  if (lockBoard || card.classList.contains('revealed') || card.classList.contains('matched')) return;

  card.classList.add('revealed');
  playSound('flip');
  card.setAttribute('aria-pressed', 'true');
  card.setAttribute('aria-label', `Card showing ${card.dataset.emoji}`);

  if (!firstCard) {
    firstCard = card;
    setStatus('Tile locked. Find its pair.');
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
  playSound('match');
  matchedPairs += 1;
  animateMatch(firstCard);
  animateMatch(secondCard);
  resetGameState();
  updateScoreBoard();
  setStatus('Match confirmed! Keep moving.');

  if (matchedPairs === emojis.length) {
    if (score > highScore) {
      highScore = score;
      saveHighScore();
    }
    setTimeout(() => {
      setStatus('Perfect clear! Stage complete.');
      showVictoryModal();
    }, 450);
  }
}

function handleMismatch() {
  score = Math.max(0, score - 10);
  playSound('miss');
  updateScoreBoard();
  setStatus('No match. Memorize and retry.');
  setTimeout(() => {
    firstCard.classList.remove('revealed');
    secondCard.classList.remove('revealed');
    firstCard.setAttribute('aria-pressed', 'false');
    secondCard.setAttribute('aria-pressed', 'false');
    resetGameState();
    setStatus('Tiles reset. Choose again.');
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
  playSound('win');
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
  const colors = ['#ff7dfd', '#ffe36b', '#8bf0ff', '#8fffa4', '#ffba8f'];
  const confettiCount = reduced ? 0 : 42;
  const sparkleCount = reduced ? 0 : 18;

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
soundToggle.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  try {
    localStorage.setItem('pixel-pairs-sound', soundEnabled ? 'on' : 'off');
  } catch (error) {
    // The preference remains active for this session.
  }
  updateSoundButton();
  if (soundEnabled) playTone(660, 0.08);
});
modalReplay.addEventListener('click', setupBoard);
modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

loadSoundPreference();
setupBoard();
