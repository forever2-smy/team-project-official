const { deductGold } = require('../gold-system');

describe('金币扣减系统测试', () => {

    describe('正常情况', () => {
        test('金币充足（100金币，花费30）→ 剩余70，成功', () => {
            const [remainingGold, success] = deductGold(100, 30);
            expect(remainingGold).toBe(70);
            expect(success).toBe(true);
        });

        test('金币刚好够（100金币，花费100）→ 剩余0，成功', () => {
            const [remainingGold, success] = deductGold(100, 100);
            expect(remainingGold).toBe(0);
            expect(success).toBe(true);
        });

        test('花费为0（100金币，花费0）→ 剩余100，成功', () => {
            const [remainingGold, success] = deductGold(100, 0);
            expect(remainingGold).toBe(100);
            expect(success).toBe(true);
        });

        test('大额金币扣减', () => {
            const [remainingGold, success] = deductGold(1000, 500);
            expect(remainingGold).toBe(500);
            expect(success).toBe(true);
        });
    });

    describe('边界情况', () => {
        test('金币比花费少1（50金币，花费51）→ 剩余50，失败', () => {
            const [remainingGold, success] = deductGold(50, 51);
            expect(remainingGold).toBe(50);
            expect(success).toBe(false);
        });

        test('花费为0（最小值边界）→ 剩余不变，成功', () => {
            const [remainingGold, success] = deductGold(0, 0);
            expect(remainingGold).toBe(0);
            expect(success).toBe(true);
        });

        test('扣减后金币为0（刚好花光）→ 剩余0，成功', () => {
            const [remainingGold, success] = deductGold(100, 100);
            expect(remainingGold).toBe(0);
            expect(success).toBe(true);
        });

        test('金币为0，花费为正数 → 失败', () => {
            const [remainingGold, success] = deductGold(0, 10);
            expect(remainingGold).toBe(0);
            expect(success).toBe(false);
        });

        test('极小差值测试（1金币，花费2）→ 失败', () => {
            const [remainingGold, success] = deductGold(1, 2);
            expect(remainingGold).toBe(1);
            expect(success).toBe(false);
        });
    });

    describe('异常情况', () => {
        test('玩家金币为负数（-100金币，花费50）→ 抛出异常', () => {
            expect(() => {
                deductGold(-100, 50);
            }).toThrow('玩家金币不能为负数');
        });

        test('花费为负数（100金币，花费-10）→ 抛出异常', () => {
            expect(() => {
                deductGold(100, -10);
            }).toThrow('花费金额不能为负数');
        });

        test('两个参数都为负数 → 抛出异常（优先检查玩家金币）', () => {
            expect(() => {
                deductGold(-50, -30);
            }).toThrow('玩家金币不能为负数');
        });

        test('花费超过玩家金币上限（999999金币，花费1000000）→ 失败', () => {
            const [remainingGold, success] = deductGold(999999, 1000000);
            expect(remainingGold).toBe(999999);
            expect(success).toBe(false);
        });

        test('极大数值测试', () => {
            const [remainingGold, success] = deductGold(Number.MAX_SAFE_INTEGER, 1);
            expect(remainingGold).toBe(Number.MAX_SAFE_INTEGER - 1);
            expect(success).toBe(true);
        });
    });

    describe('类型检查', () => {
        test('非数字类型参数应抛出异常', () => {
            expect(() => {
                deductGold('100', 50);
            }).toThrow();
        });

        test('浮点数参数应正确处理', () => {
            const [remainingGold, success] = deductGold(100.5, 30.2);
            expect(remainingGold).toBeCloseTo(70.3);
            expect(success).toBe(true);
        });
    });

    describe('返回值验证', () => {
        test('返回值类型验证 - 成功情况', () => {
            const result = deductGold(100, 30);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(typeof result[0]).toBe('number');
            expect(typeof result[1]).toBe('boolean');
        });

        test('返回值类型验证 - 失败情况', () => {
            const result = deductGold(50, 100);
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
            expect(typeof result[0]).toBe('number');
            expect(typeof result[1]).toBe('boolean');
        });
    });

});