const { MockGameClient } = require('../mock/mock-game-client.js');

class GameBoundaryTests {
    constructor() {
        this.results = [];
        this.client = null;
    }

    async runAllTests() {
        console.log('=== MUD 游戏边界测试 ===\n');

        await this.testNormalJoin();
        await this.testEmptyName();
        await this.testLongName();
        await this.testSpecialCharsName();
        await this.testNormalMove();
        await this.testBoundaryMove();
        await this.testOverBoundaryMove();
        await this.testInvalidMoveDelta();
        await this.testNormalChat();
        await this.testEmptyMessage();
        await this.testLongMessage();
        await this.testSpecialCharsMessage();
        await this.testReconnection();

        this.printResults();
        return this.results;
    }

    async testNormalJoin() {
        this.client = new MockGameClient();
        await this.client.connect();
        const result = await this.emitAndWait('player-join', { name: '测试玩家' });
        this.assert('正常加入游戏', result.gameState !== null, `收到game-state事件`);
        this.assert('玩家名称正确', this.client.mockServer.players[this.client.playerId]?.name === '测试玩家');
        this.client.disconnect();
    }

    async testEmptyName() {
        this.client = new MockGameClient();
        await this.client.connect();
        let errorReceived = false;
        this.client.on('connect_error', () => { errorReceived = true; });
        await this.client.emit('player-join', { name: '' });
        await new Promise(r => setTimeout(r, 200));
        this.assert('空名称应拒绝', errorReceived, '收到错误事件');
        this.client.disconnect();
    }

    async testLongName() {
        this.client = new MockGameClient();
        await this.client.connect();
        let errorReceived = false;
        this.client.on('connect_error', () => { errorReceived = true; });
        const longName = 'A'.repeat(21);
        await this.client.emit('player-join', { name: longName });
        await new Promise(r => setTimeout(r, 200));
        this.assert('超长名称应拒绝', errorReceived, `名称长度: ${longName.length}`);
        this.client.disconnect();
    }

    async testSpecialCharsName() {
        this.client = new MockGameClient();
        await this.client.connect();
        const result = await this.emitAndWait('player-join', { name: '玩家<>script' });
        this.assert('特殊字符名称', result.gameState !== null, '特殊字符名称应该接受');
        this.client.disconnect();
    }

    async testNormalMove() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '移动测试' });
        const initialX = this.client.mockServer.players[this.client.playerId].x;
        const initialY = this.client.mockServer.players[this.client.playerId].y;
        await this.emitAndWait('player-move', { dx: 10, dy: 0 });
        const newX = this.client.mockServer.players[this.client.playerId].x;
        this.assert('正常移动', newX === initialX + 10, `X从${initialX}变为${newX}`);
        this.client.disconnect();
    }

    async testBoundaryMove() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '边界测试' });
        this.client.mockServer.players[this.client.playerId].x = 0;
        this.client.mockServer.players[this.client.playerId].y = 0;
        await this.emitAndWait('player-move', { dx: -10, dy: -10 });
        this.assert('左边界移动', this.client.mockServer.players[this.client.playerId].x >= 0);
        this.assert('上边界移动', this.client.mockServer.players[this.client.playerId].y >= 0);
        this.client.disconnect();
    }

    async testOverBoundaryMove() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '越界测试' });
        this.client.mockServer.players[this.client.playerId].x = 770;
        this.client.mockServer.players[this.client.playerId].y = 570;
        const initialX = this.client.mockServer.players[this.client.playerId].x;
        const initialY = this.client.mockServer.players[this.client.playerId].y;
        await this.emitAndWait('player-move', { dx: 10, dy: 10 });
        this.assert('右边界越界', this.client.mockServer.players[this.client.playerId].x <= 770);
        this.assert('下边界越界', this.client.mockServer.players[this.client.playerId].y <= 570);
        this.client.disconnect();
    }

    async testInvalidMoveDelta() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '无效移动测试' });
        const initialX = this.client.mockServer.players[this.client.playerId].x;
        await this.emitAndWait('player-move', { dx: 100, dy: 0 });
        this.assert('超大幅度移动应拒绝', this.client.mockServer.players[this.client.playerId].x === initialX);
        this.client.disconnect();
    }

    async testNormalChat() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '聊天测试' });
        let messageReceived = false;
        this.client.on('new-message', () => { messageReceived = true; });
        await this.emitAndWait('send-message', { text: '你好，世界！' });
        this.assert('正常聊天消息', messageReceived, '收到new-message事件');
        this.client.disconnect();
    }

    async testEmptyMessage() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '空消息测试' });
        let messageReceived = false;
        this.client.on('new-message', () => { messageReceived = true; });
        await this.emitAndWait('send-message', { text: '' });
        this.assert('空消息应拒绝', !messageReceived, '不应收到new-message事件');
        this.client.disconnect();
    }

    async testLongMessage() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '长消息测试' });
        let messageReceived = false;
        this.client.on('new-message', () => { messageReceived = true; });
        const longMessage = 'A'.repeat(201);
        await this.emitAndWait('send-message', { text: longMessage });
        this.assert('超长消息应拒绝', !messageReceived, '不应收到new-message事件');
        this.client.disconnect();
    }

    async testSpecialCharsMessage() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '特殊消息测试' });
        let messageReceived = false;
        let receivedText = '';
        this.client.on('new-message', (msg) => {
            messageReceived = true;
            receivedText = msg.text;
        });
        await this.emitAndWait('send-message', { text: '<script>alert("xss")</script>' });
        this.assert('特殊字符消息', messageReceived, '收到特殊字符消息');
        this.client.disconnect();
    }

    async testReconnection() {
        this.client = new MockGameClient();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '重连测试' });
        const oldPlayerId = this.client.playerId;
        this.client.disconnect();
        await this.client.connect();
        await this.emitAndWait('player-join', { name: '重连测试2' });
        this.assert('重连后新ID', this.client.playerId !== oldPlayerId, `新ID: ${this.client.playerId}`);
        this.client.disconnect();
    }

    async emitAndWait(event, data, timeoutMs = 500) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                resolve({ type: 'timeout' });
            }, timeoutMs);
            
            this.client.on('game-state', (state) => { clearTimeout(timeout); resolve({ type: 'game-state', state }); });
            this.client.on('player-joined', (player) => { clearTimeout(timeout); resolve({ type: 'player-joined', player }); });
            this.client.on('player-moved', (data) => { clearTimeout(timeout); resolve({ type: 'player-moved', data }); });
            this.client.on('new-message', (msg) => { clearTimeout(timeout); resolve({ type: 'new-message', msg }); });
            this.client.on('connect_error', (err) => { clearTimeout(timeout); resolve({ type: 'connect_error', error: err }); });
            this.client.emit(event, data);
        });
    }

    assert(name, condition, detail = '') {
        const result = { name, passed: condition, detail };
        this.results.push(result);
        const status = condition ? '✓' : '✗';
        console.log(`${status} ${name}${detail ? ': ' + detail : ''}`);
    }

    printResults() {
        const passed = this.results.filter(r => r.passed).length;
        const failed = this.results.filter(r => !r.passed).length;
        console.log(`\n=== 测试结果: ${passed} 通过, ${failed} 失败 ===`);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameBoundaryTests };
}

const tests = new GameBoundaryTests();
(async () => {
    try {
        await tests.runAllTests();
        tests.printResults();
    } catch (err) {
        console.error('测试执行失败:', err);
    }
    process.exit(0);
})();