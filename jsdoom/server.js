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

app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const players = {};
const enemies = [];
const enemyPositions = [
    { x: -25, z: -20 },
    { x: 25, z: -20 },
    { x: 0, z: -30 },
    { x: -15, z: 5 },
    { x: 15, z: 5 }
];

enemyPositions.forEach((pos, index) => {
    enemies.push({
        id: index,
        x: pos.x,
        z: pos.z,
        health: 100,
        y: 0
    });
});

const spawnPoints = [
    { x: 0, z: 30 },
    { x: 10, z: 30 },
    { x: -10, z: 30 },
    { x: 5, z: 35 },
    { x: -5, z: 35 }
];

let spawnIndex = 0;

io.on('connection', (socket) => {
    console.log('玩家连接:', socket.id);
    
    const spawn = spawnPoints[spawnIndex % spawnPoints.length];
    spawnIndex++;
    
    players[socket.id] = {
        id: socket.id,
        x: spawn.x,
        y: 1.7,
        z: spawn.z,
        yaw: 0,
        pitch: 0,
        health: 100,
        ammo: 30,
        totalAmmo: 90,
        team: Math.random() > 0.5 ? 'CT' : 'T',
        name: `玩家${Math.floor(Math.random() * 1000)}`
    };
    
    socket.emit('init', {
        player: players[socket.id],
        players: Object.values(players),
        enemies: enemies
    });
    
    socket.broadcast.emit('playerJoined', players[socket.id]);
    
    socket.on('playerUpdate', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            players[socket.id].z = data.z;
            players[socket.id].yaw = data.yaw;
            players[socket.id].pitch = data.pitch;
            players[socket.id].health = data.health;
            players[socket.id].ammo = data.ammo;
            players[socket.id].totalAmmo = data.totalAmmo;
            
            socket.broadcast.emit('playerMoved', {
                id: socket.id,
                ...data
            });
        }
    });
    
    socket.on('shoot', (data) => {
        socket.broadcast.emit('playerShoot', {
            id: socket.id,
            position: data.position,
            direction: data.direction
        });
    });
    
    socket.on('hitEnemy', (data) => {
        const enemy = enemies.find(e => e.id === data.enemyId);
        if (enemy) {
            enemy.health -= data.damage;
            
            io.emit('enemyHit', {
                enemyId: data.enemyId,
                damage: data.damage,
                health: enemy.health,
                shooter: socket.id
            });
            
            if (enemy.health <= 0) {
                setTimeout(() => {
                    const pos = enemyPositions[enemy.id];
                    enemy.x = pos.x;
                    enemy.z = pos.z;
                    enemy.health = 100;
                    io.emit('enemyRespawn', {
                        enemyId: enemy.id,
                        x: enemy.x,
                        z: enemy.z
                    });
                }, 5000);
            }
        }
    });
    
    socket.on('hitPlayer', (data) => {
        if (players[data.targetId]) {
            players[data.targetId].health -= data.damage;
            
            io.emit('playerHit', {
                targetId: data.targetId,
                damage: data.damage,
                health: players[data.targetId].health,
                shooter: socket.id
            });
            
            if (players[data.targetId].health <= 0) {
                const spawn = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
                players[data.targetId].x = spawn.x;
                players[data.targetId].z = spawn.z;
                players[data.targetId].health = 100;
                players[data.targetId].ammo = 30;
                players[data.targetId].totalAmmo = 90;
                
                io.emit('playerRespawn', {
                    id: data.targetId,
                    x: spawn.x,
                    z: spawn.z
                });
            }
        }
    });
    
    socket.on('chat', (data) => {
        io.emit('chat', {
            id: socket.id,
            name: players[socket.id]?.name || '未知',
            message: data.message
        });
    });
    
    socket.on('disconnect', () => {
        console.log('玩家断开:', socket.id);
        socket.broadcast.emit('playerLeft', socket.id);
        delete players[socket.id];
    });
});

setInterval(() => {
    enemies.forEach(enemy => {
        if (enemy.health <= 0) return;
        
        const playerList = Object.values(players);
        if (playerList.length === 0) return;
        
        let closestPlayer = null;
        let closestDist = Infinity;
        
        playerList.forEach(player => {
            const dx = player.x - enemy.x;
            const dz = player.z - enemy.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            if (dist < closestDist) {
                closestDist = dist;
                closestPlayer = player;
            }
        });
        
        if (closestPlayer && closestDist > 5 && closestDist < 30) {
            const speed = 0.05;
            const dx = closestPlayer.x - enemy.x;
            const dz = closestPlayer.z - enemy.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            enemy.x += (dx / dist) * speed;
            enemy.z += (dz / dist) * speed;
            
            io.emit('enemyUpdate', {
                id: enemy.id,
                x: enemy.x,
                z: enemy.z
            });
        }
    });
}, 50);

const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
    console.log('========================================');
    console.log('🚀 Browser CS 联机服务器已启动');
    console.log('📍 本地访问: http://localhost:' + PORT);
    console.log('🌐 局域网访问: http://[你的IP]:' + PORT);
    console.log('========================================');
});