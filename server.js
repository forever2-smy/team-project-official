const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// 1. 把静态目录改成当前项目根目录
app.use(express.static(__dirname));
app.use(cors());

// 2. 首页路由，访问 / 时返回 index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 下面是你原来的所有代码，完全不动！
const gameState = {
  players: {},
  messages: [],
  map: {
    width: 800,
    height: 600,
    tiles: []
  }
};

function initMap() {
  const tiles = [];
  for (let y = 0; y < 20; y++) {
    for (let x = 0; x < 20; x++) {
      tiles.push({
        x: x * 40,
        y: y * 40,
        type: Math.random() > 0.2 ? 'grass' : 'water',
        walkable: Math.random() > 0.2
      });
    }
  }
  gameState.map.tiles = tiles;
}

initMap();

io.on('connection', (socket) => {
  console.log('新玩家连接:', socket.id);

  socket.on('player-join', (playerData) => {
    const playerId = socket.id;
    gameState.players[playerId] = {
      id: playerId,
      name: playerData.name || `玩家_${playerId.substring(0, 4)}`,
      x: Math.floor(Math.random() * 700) + 50,
      y: Math.floor(Math.random() * 500) + 50,
      color: `hsl(${Math.random() * 360}, 70%, 60%)`,
      lastUpdate: Date.now()
    };

    socket.emit('game-state', {
      players: gameState.players,
      map: gameState.map,
      messages: gameState.messages.slice(-10)
    });

    socket.broadcast.emit('player-joined', gameState.players[playerId]);
    
    const welcomeMsg = {
      id: Date.now(),
      player: '系统',
      text: `${gameState.players[playerId].name} 加入了游戏`,
      timestamp: new Date().toLocaleTimeString(),
      type: 'system'
    };
    gameState.messages.push(welcomeMsg);
    io.emit('new-message', welcomeMsg);
  });

  socket.on('player-move', (moveData) => {
    const player = gameState.players[socket.id];
    if (player) {
      const newX = player.x + moveData.dx;
      const newY = player.y + moveData.dy;
      
      if (newX >= 0 && newX <= gameState.map.width - 30 && 
          newY >= 0 && newY <= gameState.map.height - 30) {
        player.x = newX;
        player.y = newY;
        player.lastUpdate = Date.now();
        
        socket.broadcast.emit('player-moved', {
          id: socket.id,
          x: player.x,
          y: player.y
        });
      }
    }
  });

  socket.on('send-message', (messageData) => {
    const player = gameState.players[socket.id];
    if (player && messageData.text.trim()) {
      const msg = {
        id: Date.now(),
        player: player.name,
        text: messageData.text,
        timestamp: new Date().toLocaleTimeString(),
        type: 'chat'
      };
      gameState.messages.push(msg);
      io.emit('new-message', msg);
    }
  });

  socket.on('disconnect', () => {
    const player = gameState.players[socket.id];
    if (player) {
      socket.broadcast.emit('player-left', socket.id);
      
      const leaveMsg = {
        id: Date.now(),
        player: '系统',
        text: `${player.name} 离开了游戏`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      };
      gameState.messages.push(leaveMsg);
      io.emit('new-message', leaveMsg);
      
      delete gameState.players[socket.id];
    }
    console.log('玩家断开连接:', socket.id);
  });
});

setInterval(() => {
  const now = Date.now();
  const timeout = 30000;
  Object.keys(gameState.players).forEach(playerId => {
    if (now - gameState.players[playerId].lastUpdate > timeout) {
      delete gameState.players[playerId];
      io.emit('player-left', playerId);
    }
  });
}, 10000);

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`MUD 游戏服务器运行在 http://localhost:${PORT}`);
  console.log('等待玩家连接...');
});
