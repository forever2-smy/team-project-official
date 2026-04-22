class MUDGame {
    static CONFIG = {
        SERVER_URL: 'http://localhost:3001',
        MOVE_STEP: 10
    };

    constructor() {
        this.socket = null;
        this.playerId = null;
        this.gameState = { players: {}, map: { tiles: [] } };
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.init();
    }

    init() {
        this.bindEvents();
        this.gameLoop();
    }

    bindEvents() {
        document.getElementById('joinButton').onclick = () => this.joinGame();
        document.getElementById('sendButton').onclick = () => this.sendMessage();

        document.querySelectorAll('.move-btn').forEach(btn => {
            btn.onclick = (e) => {
                const dx = parseInt(e.target.dataset.dx);
                const dy = parseInt(e.target.dataset.dy);
                this.movePlayer(dx, dy);
            };
        });

        document.addEventListener('keydown', (e) => {
            const step = MUDGame.CONFIG.MOVE_STEP;
            switch(e.key) {
                case 'ArrowUp': this.movePlayer(0, -step); break;
                case 'ArrowDown': this.movePlayer(0, step); break;
                case 'ArrowLeft': this.movePlayer(-step, 0); break;
                case 'ArrowRight': this.movePlayer(step, 0); break;
            }
        });
    }

    joinGame() {
        const name = document.getElementById('playerName').value.trim();
        if (!name) return;

        this.socket = io('http://localhost:3001');

        this.socket.on('connect', () => {
            this.updateConn(true);
            this.socket.emit('player-join', { name });
        });

        this.socket.on('game-state', (state) => {
            this.gameState = state;
            this.playerId = this.socket.id;
            this.enableUI();
        });

        this.socket.on('player-joined', (p) => {
            this.gameState.players[p.id] = p;
        });

        this.socket.on('player-moved', (data) => {
            if (this.gameState.players[data.id]) {
                this.gameState.players[data.id].x = data.x;
                this.gameState.players[data.id].y = data.y;
            }
        });

        this.socket.on('new-message', (msg) => {
            this.addMsg(msg.player, msg.text);
        });

        this.socket.on('player-left', (id) => {
            delete this.gameState.players[id];
        });
    }

    movePlayer(dx, dy) {
        if (this.socket) this.socket.emit('player-move', { dx, dy });
    }

    sendMessage() {
        const text = document.getElementById('messageInput').value;
        if (text && this.socket) {
            this.socket.emit('send-message', { text });
            document.getElementById('messageInput').value = '';
        }
    }

    updateConn(ok) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('connectionStatus');
        if (ok) {
            dot.classList.add('connected');
            text.textContent = '已连接';
        }
    }

    enableUI() {
        document.getElementById('messageInput').disabled = false;
        document.getElementById('sendButton').disabled = false;
    }

    addMsg(from, text) {
        const box = document.getElementById('chatBox');
        const div = document.createElement('div');
        div.className = 'message';
        div.innerHTML = `<div class="player-name">${from}</div><div>${text}</div>`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    render() {
        this.ctx.clearRect(0,0,800,600);

        if (this.gameState.map.tiles) {
            this.gameState.map.tiles.forEach(t => {
                this.ctx.fillStyle = t.type === 'grass' ? '#2d6a4f' : '#1d3557';
                this.ctx.fillRect(t.x, t.y, 40, 40);
            });
        }

        Object.values(this.gameState.players).forEach(p => {
            this.ctx.beginPath();
            this.ctx.arc(p.x+15, p.y+15, 15, 0, Math.PI*2);
            this.ctx.fillStyle = p.color;
            this.ctx.fill();
            this.ctx.strokeStyle = 'white';
            this.ctx.stroke();
        });
    }

    gameLoop() {
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

new MUDGame();
