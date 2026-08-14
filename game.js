const CARD_POOL = [
  { id: 'ahri', name: 'Ahri', type: 'CHAMPION', cost: 2, power: 3, text: 'A nimble mage who brings pressure to the battlefield.' },
  { id: 'garen', name: 'Garen', type: 'CHAMPION', cost: 3, power: 5, text: 'A durable frontline fighter.' },
  { id: 'jinx', name: 'Jinx', type: 'CHAMPION', cost: 2, power: 4, text: 'A chaotic marksman with explosive potential.' },
  { id: 'lux', name: 'Lux', type: 'CHAMPION', cost: 3, power: 4, text: 'A powerful mage who controls the field.' },
  { id: 'teemo', name: 'Teemo', type: 'CHAMPION', cost: 1, power: 2, text: 'Small, quick and surprisingly dangerous.' },
  { id: 'vi', name: 'Vi', type: 'CHAMPION', cost: 2, power: 4, text: 'A relentless fighter who punches through defenses.' },
  { id: 'yasuo', name: 'Yasuo', type: 'CHAMPION', cost: 3, power: 5, text: 'A skilled duelist who dominates contested ground.' },
  { id: 'ekko', name: 'Ekko', type: 'CHAMPION', cost: 2, power: 3, text: 'A time-bending skirmisher.' },
  { id: 'barrier', name: 'Barrier', type: 'SPELL', cost: 1, power: 0, text: 'A prototype spell. Playing it draws a card.' },
  { id: 'scout', name: 'Rift Scout', type: 'UNIT', cost: 1, power: 1, text: 'A cheap unit that helps contest early battlefields.' },
];

const BATTLEFIELDS = ['Nexus Gate', "Summoner's Rift", 'Shurima Crossing'];
let state;
let selectedCard = null;
let toastTimer;
const $ = (id) => document.getElementById(id);

function toast(message) {
  const el = $('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 1900);
}

function newGame() {
  state = RiftRules.createGame(CARD_POOL);
  state.extraDrawUsed = false;
  selectedCard = null;
  toast('A new match has begun');
  render();
}

function addLocalLog(message) {
  state.history.push({ turn: state.turn, actor: 'SYSTEM', message });
}

function playSelectedCard(fieldIndex) {
  if (selectedCard === null) return;
  const card = state.hands.player[selectedCard];
  const result = RiftRules.playCard(state, 'player', selectedCard, fieldIndex);
  if (!result.ok) {
    addLocalLog(result.reason);
    toast(result.reason);
  } else {
    toast(`${result.card.name} deployed to ${BATTLEFIELDS[fieldIndex]}`);
    if (result.card.type === 'SPELL') {
      RiftRules.draw(state, 'player', 1);
      state.history.push({ turn: state.turn, actor: 'PLAYER', message: 'Barrier resolved: drew 1 card.' });
    }
  }
  selectedCard = null;
  render();
}

function drawExtra() {
  if (state.gameOver || state.activePlayer !== 'player') return;
  if (!state.extraDrawUsed) {
    state.extraDrawUsed = true;
    RiftRules.draw(state, 'player', 1);
    addLocalLog('You used the once-per-turn draw action.');
    toast('Card drawn');
    render();
  }
}

function enemyAction() {
  if (state.gameOver || state.activePlayer !== 'enemy') return;
  const affordable = state.hands.enemy.map((card, index) => ({ card, index })).filter(x => x.card.cost <= state.resources.enemy);
  if (affordable.length) {
    affordable.sort((a, b) => b.card.power - a.card.power);
    const choice = affordable[0];
    const fields = [0, 1, 2].sort((a, b) => RiftRules.fieldPower(state, 'player', a) - RiftRules.fieldPower(state, 'player', b));
    const result = RiftRules.playCard(state, 'enemy', choice.index, fields[0]);
    if (result.ok && result.card.type === 'SPELL') RiftRules.draw(state, 'enemy', 1);
  }
  RiftRules.pass(state, 'enemy');
  state.extraDrawUsed = false;
  render();
}

function endTurn() {
  if (state.gameOver || state.activePlayer !== 'player') return;
  if (selectedCard !== null) {
    toast('Choose a battlefield or click the card again to cancel');
    return;
  }
  RiftRules.pass(state, 'player');
  render();
  if (!state.gameOver && state.activePlayer === 'enemy') setTimeout(enemyAction, 360);
}

function cardHTML(card, index) {
  const disabled = state.gameOver || card.cost > state.resources.player || state.activePlayer !== 'player';
  const selected = selectedCard === index;
  return `<button class="card ${disabled ? 'disabled' : ''} ${selected ? 'selected' : ''}" data-card-index="${index}" ${disabled ? 'disabled' : ''} aria-label="${card.name}, cost ${card.cost}, power ${card.power}">
    <span class="card-cost">${card.cost}</span><span class="card-type">${card.type}</span><h3>${card.name}</h3><p>${card.text}</p><div class="card-stats"><span>POWER</span><span>${card.power}</span></div>
  </button>`;
}

function fieldHTML(player) {
  return state.fields[player].map((field, index) => {
    const ownPower = RiftRules.fieldPower(state, player, index);
    const opponent = player === 'player' ? 'enemy' : 'player';
    const opposingPower = RiftRules.fieldPower(state, opponent, index);
    const controller = state.control[index];
    const cards = field.map(card => `<div class="mini-card"><strong>${card.name}</strong><span>${card.power} power</span></div>`).join('');
    const clickable = player === 'player' && selectedCard !== null && !state.gameOver;
    return `<div class="battlefield ${field.length ? '' : 'empty'} ${clickable ? 'targetable' : ''}" data-field="${index}" data-owner="${player}" title="${clickable ? 'Deploy selected card here' : BATTLEFIELDS[index]}">
      <div class="battlefield-name"><span>${BATTLEFIELDS[index]}</span><span class="battlefield-score">${ownPower} vs ${opposingPower}</span></div>
      <div class="control-badge ${controller || 'contested'}">${controller === player ? 'CONTROLLED' : controller ? 'OPPONENT CONTROL' : 'CONTESTED'}</div>
      <div class="cards-on-field">${cards}</div>
    </div>`;
  }).join('');
}

function render() {
  $('resources').textContent = state.resources.player;
  $('resourceMax').textContent = state.maxResources.player;
  $('resourceFill').style.width = `${Math.max(0, Math.min(100, (state.resources.player / state.maxResources.player) * 100))}%`;
  $('playerScore').textContent = state.score.player;
  $('enemyScore').textContent = state.score.enemy;
  $('scorePlayerBar').style.width = `${Math.min(100, state.score.player / 8 * 100)}%`;
  $('scoreEnemyBar').style.width = `${Math.min(100, state.score.enemy / 8 * 100)}%`;
  $('turnNumber').textContent = `TURN ${String(state.turn).padStart(2, '0')}`;
  $('handCount').textContent = `${state.hands.player.length} CARDS`;
  $('handHint').textContent = selectedCard === null ? 'Select a card to deploy' : 'Now choose a glowing battlefield';
  $('playerBattlefields').innerHTML = fieldHTML('player');
  $('opponentBattlefields').innerHTML = fieldHTML('enemy');
  $('hand').innerHTML = state.hands.player.map(cardHTML).join('');
  $('gameLog').innerHTML = state.history.slice(-30).reverse().map(entry => `<div class="log-entry"><b>${entry.actor}</b> · ${entry.message}</div>`).join('');
  $('turnLabel').textContent = state.gameOver ? 'MATCH COMPLETE' : state.activePlayer === 'player' ? 'YOUR ACTION' : 'OPPONENT ACTION';
  $('playerStatus').textContent = state.gameOver ? (state.winner === 'player' ? 'Victory secured' : 'Defeated') : `${state.resources.player} ENERGY AVAILABLE`;
  $('enemyStatus').textContent = state.gameOver ? 'Match complete' : `${state.resources.enemy} ENERGY AVAILABLE`;
  $('endTurn').disabled = state.gameOver || state.activePlayer !== 'player';
  $('drawCard').disabled = state.gameOver || state.activePlayer !== 'player' || state.extraDrawUsed;
  $('drawCard').textContent = state.extraDrawUsed ? 'DRAW USED' : 'DRAW CARD';
  $('endTurn').querySelector('span').textContent = state.gameOver ? (state.winner === 'player' ? 'VICTORY' : 'DEFEAT') : selectedCard === null ? 'PASS ACTION' : 'CHOOSE BATTLEFIELD';

  document.querySelectorAll('[data-card-index]').forEach(button => button.addEventListener('click', () => {
    const index = Number(button.dataset.cardIndex);
    if (selectedCard === index) { selectedCard = null; toast('Selection cancelled'); }
    else { selectedCard = index; toast(`Select a battlefield for ${state.hands.player[index].name}`); }
    render();
  }));
  document.querySelectorAll('[data-owner="player"][data-field]').forEach(field => field.addEventListener('click', () => playSelectedCard(Number(field.dataset.field))));
}

$('endTurn').addEventListener('click', endTurn);
$('drawCard').addEventListener('click', drawExtra);
$('newGame').addEventListener('click', newGame);
newGame();
