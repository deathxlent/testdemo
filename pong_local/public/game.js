const socket = io();
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const leftPlayersEl = document.getElementById('leftPlayers');
const rightPlayersEl = document.getElementById('rightPlayers');

let myId = null;
let mySide = null;
let gameState = null;
let lastGameState = null;
let inGame = false;
let paddleY = 150;
const keys = {};
const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

let audioContext = null;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

function playSound(frequency, duration, type = 'square') {
    if (!audioContext) return;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function playPaddleHit() {
    playSound(440, 0.1);
}

function playWallHit() {
    playSound(330, 0.08);
}

function playScore() {
    playSound(880, 0.2);
}

socket.on('connect', () => {
    myId = socket.id;
    
    const controlsEl = document.getElementById('controls');
    if (isTouchDevice) {
        controlsEl.textContent = 'Touch and drag on screen to move paddle';
    }
});

socket.on('playerListUpdate', (data) => {
    updatePlayerList(leftPlayersEl, data.leftPlayers);
    updatePlayerList(rightPlayersEl, data.rightPlayers);
});

function updatePlayerList(container, players) {
    container.innerHTML = '';
    players.forEach(player => {
        const div = document.createElement('div');
        div.className = `player-item ${player.id === myId ? 'self' : ''} ${player.inGame ? 'in-game' : ''}`;
        div.innerHTML = `
            <div>${player.ip} ${player.id === myId ? '(You)' : ''}</div>
            <div class="player-stats">W:${player.wins} L:${player.losses} D:${player.draws}</div>
        `;
        if (player.id !== myId && !player.inGame) {
            div.ondblclick = () => challengePlayer(player.id);
        }
        container.appendChild(div);
    });
}

function challengePlayer(playerId) {
    socket.emit('challenge', playerId);
}

socket.on('gameStart', (data) => {
    initAudio();
    mySide = data.side;
    inGame = true;
    lastGameState = null;
    statusEl.textContent = `Game started! You are on the ${mySide} side`;
});

socket.on('gameState', (state) => {
    gameState = state;
    
    if (lastGameState && inGame) {
        if (state.sound === 'paddle') {
            playPaddleHit();
        } else if (state.sound === 'wall') {
            playWallHit();
        } else if (state.sound === 'score') {
            playScore();
        }
    }
    
    lastGameState = {...state};
    render();
});

socket.on('gameEnd', (data) => {
    inGame = false;
    const myScore = data.you === 'left' ? data.leftScore : data.rightScore;
    const oppScore = data.you === 'left' ? data.rightScore : data.leftScore;
    
    let result = '';
    let statsData = {};
    if (myScore > oppScore) {
        result = 'You win!';
        statsData = { win: true };
    } else if (myScore < oppScore) {
        result = 'You lose!';
        statsData = { lose: true };
    } else {
        result = 'Draw!';
        statsData = { draw: true };
    }
    
    socket.emit('updateStats', statsData);
    statusEl.textContent = `${result} Final: ${data.leftScore} - ${data.rightScore}`;
    playScore();
});

socket.on('gameEnded', (data) => {
    inGame = false;
    statusEl.textContent = 'Opponent disconnected';
});

document.addEventListener('keydown', (e) => {
    keys[e.key] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function handleTouch(e) {
    if (!inGame) return;
    e.preventDefault();
    
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const touchY = touch.clientY - rect.top;
    const scaleY = canvas.height / rect.height;
    paddleY = Math.max(0, Math.min(300, (touchY * scaleY) - 50));
}

if (isTouchDevice) {
    canvas.addEventListener('touchstart', (e) => {
        initAudio();
        handleTouch(e);
    }, { passive: false });
    
    canvas.addEventListener('touchmove', handleTouch, { passive: false });
}

function updatePaddle() {
    if (!inGame) return;
    
    const speed = 5;
    if (keys['w'] || keys['W'] || keys['ArrowUp']) {
        paddleY = Math.max(0, paddleY - speed);
    }
    if (keys['s'] || keys['S'] || keys['ArrowDown']) {
        paddleY = Math.min(300, paddleY + speed);
    }
    
    socket.emit('paddleMove', { y: paddleY });
}

function render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    
    for (let y = 10; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(canvas.width / 2, y);
        ctx.lineTo(canvas.width / 2, y + 10);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#fff';
    if (gameState) {
        ctx.fillRect(20, gameState.leftPaddle, 10, 100);
        ctx.fillRect(570, gameState.rightPaddle, 10, 100);
        ctx.fillRect(gameState.ball.x - 5, gameState.ball.y - 5, 10, 10);
        
        ctx.font = '40px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText(gameState.leftScore, 200, 60);
        ctx.fillText(gameState.rightScore, 400, 60);
        
        const timeLeft = Math.max(0, Math.floor((6000 - gameState.gameTime) / 60));
        ctx.font = '16px Courier New';
        ctx.fillText(`Time: ${timeLeft}s`, canvas.width / 2, 30);
    }
}

function gameLoop() {
    updatePaddle();
    requestAnimationFrame(gameLoop);
}

gameLoop();
