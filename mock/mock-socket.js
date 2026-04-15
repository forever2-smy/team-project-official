const EventEmitter = require('events');
const { v4: uuidv4 } = require('uuid');

class MockSocket extends EventEmitter {
    constructor(id) {
        super();
        this.id = id || 'mock-' + Math.random().toString(36).substr(2, 9);
        this.connected = false;
    }

    emit(event, data) {
        setTimeout(() => {
            this.triggerEvent(event, data);
        }, this.getDelay(event));
    }

    getDelay(event) {
        const delays = {
            'connect': 100,
            'player-join': 100,
            'player-move': 50,
            'send-message': 30
        };
        return delays[event] || 50;
    }

    triggerEvent(event, data) {
        switch(event) {
            case 'player-join':
                this.handlePlayerJoin(data);
                break;
            case 'player-move':
                this.handlePlayerMove(data);
                break;
            case 'send-message':
                this.handleSendMessage(data);
                break;
        }
    }

    handlePlayerJoin(data) {
        const player = {
            id: this.id,
            name: data.name,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
            lastUpdate: Date.now()
        };
        this.player = player;
        this.gameState.players[this.id] = player;
        this.emit('game-state', this.gameState);
        this.emit('player-joined', player);
    }

    handlePlayerMove(data) {
        if (this.player) {
            const newX = this.player.x + data.dx;
            const newY = this.player.y + data.dy;
            if (newX >= 0 && newX <= 770 && newY >= 0 && newY <= 570) {
                this.player.x = newX;
                this.player.y = newY;
                this.emit('player-moved', {
                    id: this.id,
                    x: newX,
                    y: newY
                });
            }
        }
    }

    handleSendMessage(data) {
        if (this.player && data.text.trim()) {
            const msg = {
                id: Date.now(),
                player: this.player.name,
                text: data.text,
                timestamp: new Date().toLocaleTimeString(),
                type: 'chat'
            };
            this.gameState.messages.push(msg);
            if (this.gameState.messages.length > 10) {
                this.gameState.messages = this.gameState.messages.slice(-10);
            }
            this.emit('new-message', msg);
        }
    }

    connect(gameState) {
        this.gameState = gameState || this.getDefaultGameState();
        this.connected = true;
        setTimeout(() => {
            this.emit('connect');
        }, 100);
    }

    disconnect() {
        this.connected = false;
        this.emit('disconnect', 'client disconnect');
    }

    getDefaultGameState() {
        return {
            players: {},
            map: {
                width: 800,
                height: 600,
                tiles: this.generateTiles()
            },
            messages: []
        };
    }

    generateTiles() {
        const tiles = [];
        for (let y = 0; y < 20; y++) {
            for (let x = 0; x < 20; x++) {
                const isWater = Math.random() > 0.8;
                tiles.push({
                    x: x * 40,
                    y: y * 40,
                    type: isWater ? 'water' : 'grass',
                    walkable: !isWater
                });
            }
        }
        return tiles;
    }
}

class MockServer extends EventEmitter {
    constructor() {
        super();
        this.sockets = new Map();
        this.gameState = this.initGameState();
        this.playerTimeouts = new Map();
    }

    initGameState() {
        return {
            players: {},
            map: {
                width: 800,
                height: 600,
                tiles: this.generateTiles()
            },
            messages: []
        };
    }

    generateTiles() {
        const tiles = [];
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                const isWater = (x === 5 && y < 10) || (x === 12 && y > 5);
                tiles.push({
                    x: x * 40,
                    y: y * 40,
                    type: isWater ? 'water' : 'grass',
                    walkable: !isWater
                });
            }
        }
        return tiles;
    }

    handleConnection(socket) {
        this.sockets.set(socket.id, socket);
        socket.connect(this.gameState);
    }

    handlePlayerJoin(socketId, playerData) {
        const player = {
            id: socketId,
            name: playerData.name || `玩家_${socketId.substring(0, 4)}`,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
            lastUpdate: Date.now()
        };
        this.gameState.players[socketId] = player;
        this.playerTimeouts.set(socketId, Date.now());
    }

    cleanupInactivePlayers() {
        const now = Date.now();
        const timeout = 30000;
        for (const [playerId, lastUpdate] of this.playerTimeouts) {
            if (now - lastUpdate > timeout) {
                delete this.gameState.players[playerId];
                this.playerTimeouts.delete(playerId);
            }
        }
    }
}

module.exports = { MockSocket, MockServer };