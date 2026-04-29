const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.static('public'));
app.use('/mock', express.static('public'));
app.use('/mock-game-client.js', express.static('mock/mock-game-client.js'));

// 游戏状态
const gameState = {
  players: {},
  messages: [],
  map: {
    width: 800,
    height: 600,
    tiles: []
  }
};

// 初始化地图
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

// Socket.io 连接处理
io.on('connection', (socket) => {
  console.log('新玩家连接:', socket.id);

  // 新玩家加入
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

    // 发送当前游戏状态给新玩家
    socket.emit('game-state', {
      players: gameState.players,
      map: gameState.map,
      messages: gameState.messages.slice(-10) // 最近10条消息
    });

    // 广播新玩家加入
    socket.broadcast.emit('player-joined', gameState.players[playerId]);
    
    // 发送欢迎消息
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

  // 玩家移动
  socket.on('player-move', (moveData) => {
    const player = gameState.players[socket.id];
    if (player) {
      // 简单边界检查
      const newX = player.x + moveData.dx;
      const newY = player.y + moveData.dy;
      
      if (newX >= 0 && newX <= gameState.map.width - 30 && 
          newY >= 0 && newY <= gameState.map.height - 30) {
        player.x = newX;
        player.y = newY;
        player.lastUpdate = Date.now();
        
        // 广播玩家位置更新
        socket.broadcast.emit('player-moved', {
          id: socket.id,
          x: player.x,
          y: player.y
        });
      }
    }
  });

  // 发送聊天消息
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

  // 玩家断开连接
  socket.on('disconnect', () => {
    const player = gameState.players[socket.id];
    if (player) {
      // 广播玩家离开
      socket.broadcast.emit('player-left', socket.id);
      
      // 发送离开消息
      const leaveMsg = {
        id: Date.now(),
        player: '系统',
        text: `${player.name} 离开了游戏`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system'
      };
      gameState.messages.push(leaveMsg);
      io.emit('new-message', leaveMsg);
      
      // 从游戏状态中移除
      delete gameState.players[socket.id];
    }
    console.log('玩家断开连接:', socket.id);
  });
});

// 定期清理不活跃玩家
setInterval(() => {
  const now = Date.now();
  const timeout = 30000; // 30秒
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
