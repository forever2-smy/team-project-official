class MockGameClient {
    constructor(options = {}) {
        this.mockServer = options.mockServer || null;
        this.autoRespond = options.autoRespond !== false;
        this.responseDelay = options.responseDelay || 100;
        this.gameState = {
            players: {},
            map: { width: 800, height: 600, tiles: [] },
            messages: []
        };
        this.playerId = null;
        this.eventHandlers = {};
        this.connected = false;
    }

    connect(url = 'ws://localhost:3001') {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.playerId = 'mock-' + Math.random().toString(36).substr(2, 9);
                this.connected = true;
                this.trigger('connect');
                if (this.autoRespond) {
                    this.mockServer = this.createMockServer();
                }
                resolve();
            }, this.responseDelay);
        });
    }

    createMockServer() {
        if (!this.mockServer) {
            this.mockServer = {
                players: {},
                map: { width: 800, height: 600, tiles: [] },
                messages: []
            };
            this.generateMap();
        }
        return this.mockServer;
    }

    generateMap() {
        this.mockServer.tiles = [];
        for (let y = 0; y < 15; y++) {
            for (let x = 0; x < 20; x++) {
                const isWater = (x === 5 && y < 10) || (x === 12 && y > 5);
                this.mockServer.tiles.push({
                    x: x * 40,
                    y: y * 40,
                    type: isWater ? 'water' : 'grass',
                    walkable: !isWater
                });
            }
        }
    }

    emit(event, data) {
        return new Promise((resolve) => {
            setTimeout(() => {
                this.handleEvent(event, data);
                resolve();
            }, this.getDelay(event));
        });
    }

    getDelay(event) {
        const delays = {
            'player-join': 100,
            'player-move': 50,
            'send-message': 30
        };
        return delays[event] || 50;
    }

    handleEvent(event, data) {
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
        if (!data.name || data.name.length < 1 || data.name.length > 20) {
            this.trigger('connect_error', { code: 400, message: '昵称长度必须在1-20字符之间' });
            return;
        }

        const player = {
            id: this.playerId,
            name: data.name,
            x: Math.floor(Math.random() * 700) + 50,
            y: Math.floor(Math.random() * 500) + 50,
            color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
            lastUpdate: Date.now()
        };

        this.mockServer.players[this.playerId] = player;
        this.trigger('game-state', {
            players: this.mockServer.players,
            map: { width: 800, height: 600, tiles: this.mockServer.tiles },
            messages: this.mockServer.messages.slice(-10)
        });
        this.trigger('player-joined', player);
    }

    handlePlayerMove(data) {
        const player = this.mockServer.players[this.playerId];
        if (!player) return;

        if (data.dx < -50 || data.dx > 50 || data.dy < -50 || data.dy > 50) {
            return;
        }

        const newX = player.x + data.dx;
        const newY = player.y + data.dy;

        if (newX < 0 || newX > 770 || newY < 0 || newY > 570) {
            return;
        }

        player.x = newX;
        player.y = newY;
        this.trigger('player-moved', { id: this.playerId, x: newX, y: newY });
    }

    handleSendMessage(data) {
        const player = this.mockServer.players[this.playerId];
        if (!player) return;

        if (!data.text || data.text.length < 1 || data.text.length > 200) {
            return;
        }

        const msg = {
            id: Date.now(),
            player: player.name,
            text: data.text,
            timestamp: new Date().toLocaleTimeString(),
            type: 'chat'
        };

        this.mockServer.messages.push(msg);
        if (this.mockServer.messages.length > 10) {
            this.mockServer.messages = this.mockServer.messages.slice(-10);
        }
        this.trigger('new-message', msg);
    }

    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }

    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }

    trigger(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => handler(data));
        }
    }

    disconnect() {
        this.connected = false;
        if (this.mockServer && this.mockServer.players[this.playerId]) {
            delete this.mockServer.players[this.playerId];
            this.trigger('player-left', this.playerId);
        }
        this.trigger('disconnect');
    }

    getGameState() {
        return this.gameState;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MockGameClient };
}