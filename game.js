const CARD_POOL = [
  { id: 'ahri', name: 'Ahri', type: 'CHAMPION', cost: 2, power: 3, text: 'A nimble mage who brings pressure to the battlefield.' },
  { id: 'garen', name: 'Garen', type: 'CHAMPION', cost: 3, power: 5, text: 'A durable frontline fighter.' },
  { id: 'jinx', name: 'Jinx', type: 'CHAMPION', cost: 2, power: 4, text: 'A chaotic marksman with explosive potential.' },
  { id: 'lux', name: 'Lux', type: 'CHAMPION', cost: 3, power: 4, text: 'A powerful mage who controls the field.' },
  { id: 'teemo', name: 'Teemo', type: 'CHAMPION', cost: 1, power: 2, text: 'Small, quick and surprisingly dangerous.' },
  { id: 'vi', name: 'Vi', type: 'CHAMPION', cost: 2, power: 4, text: 'A relentless fighter who punches through defenses.' },
  { id: 'yasuo', name: 'Yasuo', type: 'CHAMPION', cost: 3, power: 5, text: 'A skilled duelist who dominates contested ground.' },
  { id: 'ekko', name: 'Ekko', type: 'CHAMPION', cost: 2, power: 3, text: 'A time-bending skirmisher.' },
];

const BATTLEFIELDS = ['Nexus Gate', 'Summoner\'s Rift', 'Shurima Crossing'];

let state;

const $ = (id) => document.getElementById(id);

function shuffledDeck() {
  const deck = [];
  for (let i = 0; i < 3; i++) deck.push(...CARD_POOL.map(card => ({ ...card })));
  return deck.sort(() => Math.random() - 0.5);
}

function createState() {
  const deck = shuffledDeck();
  return {
    turn: 1,
    activePlayer: 'player',
    resources: 1,
    resourceMax: 1,
    playerScore: 0,
    enemyScore: 0,
    deck,
    hand: deck.splice(0, 5),
    discard: [],
    playerField: [[], [], []],
    enemyField: [[], [], []],
    log: [],
    gameOver: false,
    extraDrawUsed: false,
  };
}

function addLog(message) {
  state.log.push(message);
  if (state.log.length > 30) state.log.shift();
}

function drawCard(actor = 'You') {
  if (state.deck.length === 0) {
    addLog('Your deck is empty.');
    render();
    return;
  }
  const card = state.deck.shift();
  state.hand.push(card);
  addLog(`<b>${actor}</b> drew a card.`);
  render();
}

function playCard(handIndex, battlefieldIndex) {
  if (state.gameOver || state.activePlayer !== 'player') return;
  const card = state.hand[handIndex];
  if (!card) return;
  if (card.cost > state.resources) {
    addLog(`Not enough resources to play <b>${card.name}</b>.`);
    render();
    return;
  }

  state.resources -= card.cost;
  state.hand.splice(handIndex, 1);
  state.playerField[battlefieldIndex].push(card);
  addLog(`<b>You</b> played <b>${card.name}</b> to ${BATTLEFIELDS[battlefieldIndex]}.`);
  calculateScores();
  render();
}

function calculateScores() {
  const player = state.playerField.reduce((sum, field) => sum + field.reduce((a, c) => a + c.power, 0), 0);
  const enemy = state.enemyField.reduce((sum, field) => sum + field.reduce((a, c) => a + c.power, 0), 0);
  state.playerScore = player;
  state.enemyScore = enemy;
}

function opponentTurn() {
  state.activePlayer = 'enemy';
  addLog('<b>Opponent</b> is taking a turn.');

  const affordable = CARD_POOL.filter(card => card.cost <= state.resourceMax);
  const card = affordable[Math.floor(Math.random() * affordable.length)];
  if (card && state.resourceMax >= card.cost) {
    let remaining = state.resourceMax;
    let placements = 0;
    while (remaining >= card.cost && placements < 2 && Math.random() > 0.35) {
      const copy = { ...card };
      const field = Math.floor(Math.random() * 3);
      state.enemyField[field].push(copy);
      remaining -= copy.cost;
      placements++;
      addLog(`<b>Opponent</b> played <b>${copy.name}</b> to ${BATTLEFIELDS[field]}.`);
    }
  }

  calculateScores();
  if (state.enemyScore >= 8) {
    finishGame('Opponent wins the prototype match.');
    return;
  }

  state.turn += 1;
  state.resourceMax = Math.min(8, state.resourceMax + 1);
  state.resources = state.resourceMax;
  state.activePlayer = 'player';
  state.extraDrawUsed = false;
  drawCard('You');
  addLog(`<b>Turn ${state.turn}</b> — your turn.`);
  render();
}

function endTurn() {
  if (state.gameOver || state.activePlayer !== 'player') return;
  calculateScores();
  if (state.playerScore >= 8) {
    finishGame('You win the prototype match!');
    return;
  }
  opponentTurn();
}

function finishGame(message) {
  state.gameOver = true;
  addLog(`<b>${message}</b>`);
  $('turnLabel').textContent = 'Game Over';
  $('playerStatus').textContent = message;
  $('enemyStatus').textContent = 'Match complete';
  render();
}

function cardHTML(card, index) {
  const disabled = state.gameOver || card.cost > state.resources || state.activePlayer !== 'player';
  return `<button class="card ${disabled ? 'disabled' : ''}" data-card-index="${index}" ${disabled ? 'disabled' : ''}>
    <span class="card-cost">${card.cost}</span>
    <span class="card-type">${card.type}</span>
    <h3>${card.name}</h3>
    <p>${card.text}</p>
    <div class="card-stats"><span>POWER</span><span>${card.power}</span></div>
  </button>`;
}

function fieldHTML(fields, owner) {
  return fields.map((field, index) => {
    const power = field.reduce((sum, card) => sum + card.power, 0);
    const cards = field.map(card => `<div class="mini-card"><strong>${card.name}</strong><span>${card.power} power</span></div>`).join('');
    return `<div class="battlefield ${field.length ? '' : 'empty'}" data-field="${index}" data-owner="${owner}">
      <div class="battlefield-name"><span>${BATTLEFIELDS[index]}</span><span class="battlefield-score">${power}</span></div>
      <div class="cards-on-field">${cards}</div>
    </div>`;
  }).join('');
}

function render() {
  $('resources').textContent = state.resources;
  $('resourceMax').textContent = state.resourceMax;
  $('resourceFill').style.width = `${Math.max(0, Math.min(100, (state.resources / state.resourceMax) * 100))}%`;
  $('playerScore').textContent = state.playerScore;
  $('enemyScore').textContent = state.enemyScore;
  $('turnNumber').textContent = `Turn ${state.turn}`;
  $('handCount').textContent = `${state.hand.length} card${state.hand.length === 1 ? '' : 's'}`;
  $('playerBattlefields').innerHTML = fieldHTML(state.playerField, 'player');
  $('opponentBattlefields').innerHTML = fieldHTML(state.enemyField, 'enemy');
  $('hand').innerHTML = state.hand.map(cardHTML).join('');
  $('gameLog').innerHTML = state.log.map(entry => `<div class="log-entry">${entry}</div>`).join('');
  $('endTurn').disabled = state.gameOver || state.activePlayer !== 'player';
  $('drawCard').disabled = state.gameOver || state.activePlayer !== 'player' || state.extraDrawUsed;
  $('drawCard').textContent = state.extraDrawUsed ? 'Extra Draw Used' : 'Draw Card';
  $('turnLabel').textContent = state.gameOver ? 'Game Over' : state.activePlayer === 'player' ? 'Your Turn' : 'Opponent Turn';

  document.querySelectorAll('[data-card-index]').forEach(button => {
    button.addEventListener('click', () => {
      const handIndex = Number(button.dataset.cardIndex);
      const battlefield = window.prompt('Choose a battlefield: 1 = Nexus Gate, 2 = Summoner\'s Rift, 3 = Shurima Crossing');
      const index = Number(battlefield) - 1;
      if (index >= 0 && index < 3) playCard(handIndex, index);
    });
  });
}

function newGame() {
  state = createState();
  addLog('<b>New match</b> started. You have the first turn.');
  addLog('Play a card, choose a battlefield, then end your turn.');
  render();
}

$('endTurn').addEventListener('click', endTurn);
$('drawCard').addEventListener('click', () => {
  if (state.gameOver || state.activePlayer !== 'player' || state.extraDrawUsed) return;
  state.extraDrawUsed = true;
  drawCard('You');
  addLog('<b>You</b> used the once-per-turn extra draw.');
  render();
});
$('newGame').addEventListener('click', newGame);

newGame();
