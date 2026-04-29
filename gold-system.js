/**
 * 扣减玩家金币
 * @param {number} playerGold - 玩家当前金币数量
 * @param {number} cost - 需要扣减的金币数量
 * @returns {Array} [剩余金币, 是否成功]
 * - 成功：playerGold >= cost，返回 [playerGold - cost, true]
 * - 失败：playerGold < cost，返回 [playerGold, false]
 * @throws {Error} 当参数为负数时抛出异常
 */
function deductGold(playerGold, cost) {
    // 类型检查
    if (typeof playerGold !== 'number' || typeof cost !== 'number') {
        throw new Error('参数必须为数字类型');
    }

    // 参数验证
    if (playerGold < 0) {
        throw new Error('玩家金币不能为负数');
    }
    if (cost < 0) {
        throw new Error('花费金额不能为负数');
    }

    // 金币不足
    if (playerGold < cost) {
        return [playerGold, false];
    }

    // 金币充足，正常扣减
    return [playerGold - cost, true];
}

module.exports = { deductGold };