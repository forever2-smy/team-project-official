/**
 * 战斗伤害计算系统
 * @module combat-system
 */

/**
 * 计算战斗伤害
 * @param {number} attack - 攻击力
 * @param {number} defense - 防御力
 * @param {number} critRate - 暴击率 (0-1)
 * @returns {number} 最终伤害值
 * @throws {Error} 当参数无效时抛出异常
 */
function calculateDamage(attack, defense, critRate) {
    // 参数验证
    if (typeof attack !== 'number' || typeof defense !== 'number' || typeof critRate !== 'number') {
        throw new Error('所有参数必须为数字类型');
    }

    if (attack < 0) {
        throw new Error('攻击值不能为负数');
    }

    if (defense < 0) {
        throw new Error('防御值不能为负数');
    }

    if (critRate < 0 || critRate > 1) {
        throw new Error('暴击率必须在0-1之间');
    }

    // 基础伤害计算：攻击力 - 防御力
    let baseDamage = attack - defense;

    // 保底伤害：至少造成1点伤害
    if (baseDamage < 1) {
        baseDamage = 1;
    }

    // 暴击判定
    const isCrit = Math.random() < critRate;
    if (isCrit) {
        return attack; // 暴击时造成全额攻击伤害
    }

    return baseDamage;
}

/**
 * 计算连击伤害
 * @param {number} attack - 攻击力
 * @param {number} defense - 防御力
 * @param {number} comboCount - 连击次数
 * @returns {number} 总伤害
 */
function calculateComboDamage(attack, defense, comboCount) {
    if (comboCount <= 0) {
        throw new Error('连击次数必须大于0');
    }

    let totalDamage = 0;
    for (let i = 0; i < comboCount; i++) {
        totalDamage += calculateDamage(attack, defense, 0);
    }

    return totalDamage;
}

module.exports = {
    calculateDamage,
    calculateComboDamage
};