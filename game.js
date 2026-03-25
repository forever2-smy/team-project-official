// 图形化 MUD 游戏客户端
class MUDGame {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.playerColor = '#4cc9f0';
        this.gameState = {
            players: {},
            map: { width: 800, height: 600, tiles: [] },
            messages: []
        };
        
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.init();
    }
    
    init() {
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
        
        // 绑定事件
        document.getElementById('joinButton').addEventListener('click', () => this.joinGame());
        document.getElementById('sendButton').addEventListener('click', () => this.sendMessage());
        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        // 绑定移动按钮
        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dx = parseInt(e.target.dataset.dx);
                const dy = parseInt(e.target.dataset.dy);
                this.movePlayer(dx, dy);
            });
        });
        
        // 键盘控制
        document.addEventListener('keydown', (e) => {
            if (!this.socket || !this.socket.connected) return;
            
            let dx = 0, dy = 0;
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    dy = -10;
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    dy = 10;
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    dx = -10;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    dx = 10;
                    break;
            }
            
            if (dx !== 0 || dy !== 0) {
                this.movePlayer(dx, dy);
            }
        });
        
        // 初始渲染
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updateTime() {
        const now = new Date();
        document.getElementById('currentTime').textContent = 
            `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    }
    
    joinGame() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            this.addMessage('系统', '请输入昵称！', 'system');
            return;
        }
        
        // 连接服务器
        this.socket = io('http://localhost:3001');
        
        this.socket.on('connect', () => {
            console.log('已连接到服务器');
            this.updateConnectionStatus(true);
            
            // 发送加入游戏请求
            this.socket.emit('player-join', { name: playerName });
        });
        
        this.socket.on('game-state', (state) => {
            console.log('收到游戏状态:', state);
            this.gameState = state;
            this.playerId = this.socket.id;
            
            // 更新玩家颜色
            if (this.gameState.players[this.playerId]) {
                this.playerColor = this.gameState.players[this.playerId].color;
                document.getElementById('playerColor').style.backgroundColor = this.playerColor;
                document.getElementById('playerStatus').textContent = 
                    `${this.gameState.players[this.playerId].name} (在线)`;
            }
            
            // 更新玩家数量
            this.updatePlayerCount();
            
            // 启用聊天和移动
            document.getElementById('messageInput').disabled = false;
            document.getElementById('sendButton').disabled = false;
            document.getElementById('moveButtons').style.display = 'block';
            document.getElementById('joinButton').disabled = true;
            document.getElementById('playerName').disabled = true;
        });
        
        this.socket.on('player-joined', (player) => {
            console.log('新玩家加入:', player);
            this.gameState.players[player.id] = player;
            this.addMessage('系统', `${player.name} 加入了游戏`, 'system');
            this.updatePlayerCount();
        });
        
        this.socket.on('player-moved', (data) => {
            if (this.gameState.players[data.id]) {
                this.gameState.players[data.id].x = data.x;
                this.gameState.players[data.id].y = data.y;
            }
        });
        
        this.socket.on('new-message', (message) => {
            this.addMessage(message.player, message.text, message.type);
        });
        
        this.socket.on('player-left', (playerId) => {
            if (this.gameState.players[playerId]) {
                const playerName = this.gameState.players[playerId].name;
                delete this.gameState.players[playerId];
                this.addMessage('系统', `${playerName} 离开了游戏`, 'system');
                this.updatePlayerCount();
            }
        });
        
        this.socket.on('disconnect', () => {
            console.log('与服务器断开连接');
            this.updateConnectionStatus(false);
            this.addMessage('系统', '与服务器断开连接', 'system');
            
            // 禁用聊天和移动
            document.getElementById('messageInput').disabled = true;
            document.getElementById('sendButton').disabled = true;
            document.getElementById('moveButtons').style.display = 'none';
            document.getElementById('joinButton').disabled = false;
            document.getElementById('playerName').disabled = false;
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('连接错误:', error);
            this.addMessage('系统', '连接服务器失败，请检查服务器是否运行', 'system');
            this.updateConnectionStatus(false);
        });
    }
    
    updateConnectionStatus(connected) {
        const statusDot = document.getElementById('statusDot');
        const connectionStatus = document.getElementById('connectionStatus');
        
        if (connected) {
            statusDot.classList.add('connected');
            connectionStatus.textContent = '已连接';
            connectionStatus.style.color = '#4cc9f0';
        } else {
            statusDot.classList.remove('connected');
            connectionStatus.textContent = '断开连接';
            connectionStatus.style.color = '#f72585';
        }
    }
    
    updatePlayerCount() {
        const count = Object.keys(this.gameState.players).length;
        document.getElementById('playerCount').textContent = `在线玩家: ${count}`;
    }
    
    movePlayer(dx, dy) {
        if (this.socket && this.socket.connected) {
            this.socket.emit('player-move', { dx, dy });
        }
    }
    
    sendMessage() {
        const input = document.getElementById('messageInput');
        const text = input.value.trim();
        
        if (text && this.socket && this.socket.connected) {
            this.socket.emit('send-message', { text });
            input.value = '';
            input.focus();
        }
    }
    
    addMessage(player, text, type = 'chat') {
        const chatBox = document.getElementById('chatBox');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        messageDiv.innerHTML = `
            <div class="message-header">
                <span class="player-name">${player}</span>
                <span class="message-time">${timeStr}</span>
            </div>
            <div class="message-text">${text}</div>
        `;
        
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
    
    render() {
        // 清空画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 绘制地图
        if (this.gameState.map.tiles && this.gameState.map.tiles.length > 0) {
            this.gameState.map.tiles.forEach(tile => {
                this.ctx.fillStyle = tile.type === 'grass' ? '#2d6a4f' : '#1d3557';
                this.ctx.fillRect(tile.x, tile.y, 40, 40);
                
                // 绘制网格线
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(tile.x, tile.y, 40, 40);
            });
        }
        
        // 绘制玩家
        Object.values(this.gameState.players).forEach(player => {
            // 绘制玩家圆形
            this.ctx.beginPath();
            this.ctx.arc(player.x + 15, player.y + 15, 15, 0, Math.PI * 2);
            this.ctx.fillStyle = player.color;
            this.ctx.fill();
            
            // 绘制玩家边框
            this.ctx.strokeStyle = 'white';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // 绘制玩家名字
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(player.name, player.x + 15, player.y + 40);
            
            // 如果是当前玩家，绘制高亮效果
            if (player.id === this.playerId) {
                this.ctx.beginPath();
                this.ctx.arc(player.x + 15, player.y + 15, 18, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#4cc9f0';
                this.ctx.lineWidth = 3;
                this.ctx.stroke();
            }
        });
        
        // 绘制游戏信息
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`玩家数量: ${Object.keys(this.gameState.players).length}`, 20, 35);
        this.ctx.fillText(`地图大小: ${this.gameState.map.width}x${this.gameState.map.height}`, 20, 55);
        
        if (this.playerId && this.gameState.players[this.playerId]) {
            const player = this.gameState.players[this.playerId];
            this.ctx.fillText(`位置: (${Math.floor(player.x)}, ${Math.floor(player.y)})`, 20, 75);
        }
    }
    
    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    new MUDGame();
});