const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.static(path.join(__dirname, 'public')));

const players = new Map();
const activeGames = new Map();

io.on('connection', (socket) => {
    const ip = socket.handshake.address.includes('::ffff:') 
        ? socket.handshake.address.split('::ffff:')[1] 
        : socket.handshake.address;
    
    if (!players.has(socket.id)) {
        players.set(socket.id, {
            id: socket.id,
            ip: ip,
            side: Math.random() > 0.5 ? 'left' : 'right',
            wins: 0,
            losses: 0,
            draws: 0,
            inGame: false
        });
    }
    
    broadcastPlayerList();
    
    socket.on('disconnect', () => {
        players.delete(socket.id);
        broadcastPlayerList();
        
        activeGames.forEach((game, gameId) => {
            if (game.leftPlayer === socket.id || game.rightPlayer === socket.id) {
                const otherPlayer = game.leftPlayer === socket.id ? game.rightPlayer : game.leftPlayer;
                if (otherPlayer) {
                    io.to(otherPlayer).emit('gameEnded', { reason: 'opponentDisconnected' });
                    const player = players.get(otherPlayer);
                    if (player) player.inGame = false;
                }
                activeGames.delete(gameId);
            }
        });
    });
    
    socket.on('challenge', (targetId) => {
        const challenger = players.get(socket.id);
        const target = players.get(targetId);
        
        if (challenger && target && !challenger.inGame && !target.inGame) {
            challenger.inGame = true;
            target.inGame = true;
            
            const gameId = `game_${Date.now()}`;
            const leftPlayer = challenger.side === 'left' ? socket.id : targetId;
            const rightPlayer = challenger.side === 'right' ? socket.id : targetId;
            
            activeGames.set(gameId, {
                id: gameId,
                leftPlayer,
                rightPlayer,
                leftScore: 0,
                rightScore: 0,
                ball: { x: 300, y: 200, vx: 5, vy: 0 },
                leftPaddle: 150,
                rightPaddle: 150,
                gameTime: 0,
                running: true
            });
            
            io.to(leftPlayer).emit('gameStart', { side: 'left', gameId });
            io.to(rightPlayer).emit('gameStart', { side: 'right', gameId });
            
            broadcastPlayerList();
        }
    });
    
    socket.on('paddleMove', (data) => {
        activeGames.forEach((game) => {
            if (game.leftPlayer === socket.id) {
                game.leftPaddle = Math.max(0, Math.min(300, data.y));
            } else if (game.rightPlayer === socket.id) {
                game.rightPaddle = Math.max(0, Math.min(300, data.y));
            }
        });
    });
    
    socket.on('updateStats', (data) => {
        const player = players.get(socket.id);
        if (player) {
            if (data.win) player.wins++;
            else if (data.lose) player.losses++;
            else if (data.draw) player.draws++;
            player.inGame = false;
            broadcastPlayerList();
        }
    });
    
    broadcastPlayerList();
});

function broadcastPlayerList() {
    const playerList = Array.from(players.values());
    const leftPlayers = playerList.filter(p => p.side === 'left');
    const rightPlayers = playerList.filter(p => p.side === 'right');
    io.emit('playerListUpdate', { leftPlayers, rightPlayers });
}

setInterval(() => {
    activeGames.forEach((game, gameId) => {
        if (!game.running) return;
        
        game.gameTime++;
        
        game.ball.x += game.ball.vx;
        game.ball.y += game.ball.vy;
        
        if (game.ball.y <= 5 || game.ball.y >= 395) {
            game.ball.vy = -game.ball.vy;
            game.ball.y = game.ball.y <= 5 ? 5 : 395;
        }
        
        if (game.ball.x <= 35 && game.ball.x >= 25) {
            const paddleTop = game.leftPaddle;
            const paddleBottom = game.leftPaddle + 100;
            if (game.ball.y >= paddleTop && game.ball.y <= paddleBottom) {
                game.ball.vx = Math.abs(game.ball.vx) * 1.03;
                const hitPos = (game.ball.y - paddleTop) / 100;
                game.ball.vy = (hitPos - 0.5) * 10;
                game.ball.x = 36;
            }
        }
        
        if (game.ball.x >= 565 && game.ball.x <= 575) {
            const paddleTop = game.rightPaddle;
            const paddleBottom = game.rightPaddle + 100;
            if (game.ball.y >= paddleTop && game.ball.y <= paddleBottom) {
                game.ball.vx = -Math.abs(game.ball.vx) * 1.03;
                const hitPos = (game.ball.y - paddleTop) / 100;
                game.ball.vy = (hitPos - 0.5) * 10;
                game.ball.x = 564;
            }
        }
        
        if (game.ball.x < 0) {
            game.rightScore++;
            resetBall(game, 'right');
        } else if (game.ball.x > 600) {
            game.leftScore++;
            resetBall(game, 'left');
        }
        
        if (game.leftScore >= 11 || game.rightScore >= 11 || game.gameTime >= 6000) {
            game.running = false;
            io.to(game.leftPlayer).emit('gameEnd', { 
                leftScore: game.leftScore, 
                rightScore: game.rightScore,
                you: 'left'
            });
            io.to(game.rightPlayer).emit('gameEnd', { 
                leftScore: game.leftScore, 
                rightScore: game.rightScore,
                you: 'right'
            });
            activeGames.delete(gameId);
        } else {
            io.to(game.leftPlayer).emit('gameState', game);
            io.to(game.rightPlayer).emit('gameState', game);
        }
    });
}, 16);

function resetBall(game, scorer) {
    game.ball.x = 300;
    game.ball.y = 200;
    game.ball.vx = scorer === 'left' ? 5 : -5;
    game.ball.vy = (Math.random() - 0.5) * 4;
}

const PORT = 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`PONG server running on port ${PORT}`);
    console.log(`Connect via LAN: http://YOUR_IP:${PORT}`);
});
