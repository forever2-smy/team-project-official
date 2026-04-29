const { calculateDamage, calculateComboDamage } = require('../combat-system');

describe('战斗伤害计算系统', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('正常伤害计算', () => {
    test('攻击100，防御50，暴击率0 → 伤害50', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(100, 50, 0)).toBe(50);
    });

    test('攻击100，防御50，暴击率1 → 暴击伤害100', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.0);
      expect(calculateDamage(100, 50, 1)).toBe(100);
    });

    test('防御为0 → 伤害等于攻击', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(100, 0, 0)).toBe(100);
    });

    test('防御大于攻击 → 保底伤害1', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(50, 100, 0)).toBe(1);
    });

    test('攻击为0 → 保底伤害1', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(0, 50, 0)).toBe(1);
    });
  });

  describe('暴击机制测试', () => {
    test('暴击率0.5，随机数0.3 → 触发暴击', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.3);
      expect(calculateDamage(100, 50, 0.5)).toBe(100);
    });

    test('暴击率0.5，随机数0.7 → 不触发暴击', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.7);
      expect(calculateDamage(100, 50, 0.5)).toBe(50);
    });

    test('边界暴击率0.0 → 绝不暴击', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.0);
      expect(calculateDamage(100, 50, 0.0)).toBe(50);
    });

    test('边界暴击率1.0 → 必定暴击', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.9);
      expect(calculateDamage(100, 50, 1.0)).toBe(100);
    });
  });

  describe('异常处理测试', () => {
    test('负数攻击值 → 抛出异常', () => {
      expect(() => calculateDamage(-10, 50, 0)).toThrow('攻击值不能为负数');
    });

    test('负数防御值 → 抛出异常', () => {
      expect(() => calculateDamage(100, -10, 0)).toThrow('防御值不能为负数');
    });

    test('暴击率>1 → 抛出异常', () => {
      expect(() => calculateDamage(100, 50, 1.5)).toThrow('暴击率必须在0-1之间');
    });

    test('暴击率<0 → 抛出异常', () => {
      expect(() => calculateDamage(100, 50, -0.1)).toThrow('暴击率必须在0-1之间');
    });

    test('非数字参数 → 抛出异常', () => {
      expect(() => calculateDamage('100', 50, 0)).toThrow('所有参数必须为数字类型');
      expect(() => calculateDamage(100, '50', 0)).toThrow('所有参数必须为数字类型');
      expect(() => calculateDamage(100, 50, '0')).toThrow('所有参数必须为数字类型');
    });
  });

  describe('边界值测试', () => {
    test('极大数值处理', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(999999, 1, 0)).toBe(999998);
    });

    test('浮点数精确计算', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(100.5, 50.3, 0)).toBeCloseTo(50.2);
    });

    test('相同攻防值 → 保底伤害1', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(100, 100, 0)).toBe(1);
    });

    test('攻击力比防御力小1 → 保底伤害1', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      expect(calculateDamage(99, 100, 0)).toBe(1);
    });
  });

  describe('连击伤害计算', () => {
    test('单次连击等于普通攻击', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const normalDamage = calculateDamage(100, 50, 0);
      const comboDamage = calculateComboDamage(100, 50, 1);
      expect(comboDamage).toBe(normalDamage);
    });

    test('三次连击伤害计算', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const singleDamage = calculateDamage(100, 50, 0);
      const comboDamage = calculateComboDamage(100, 50, 3);
      expect(comboDamage).toBe(singleDamage * 3);
    });

    test('连击次数为0 → 抛出异常', () => {
      expect(() => calculateComboDamage(100, 50, 0)).toThrow('连击次数必须大于0');
    });

    test('负连击次数 → 抛出异常', () => {
      expect(() => calculateComboDamage(100, 50, -1)).toThrow('连击次数必须大于0');
    });
  });

  describe('随机性测试', () => {
    test('多次调用产生不同结果（无暴击）', () => {
      const results = new Set();

      // 由于我们无法控制Math.random在多次调用中的行为，这里测试边界情况
      jest.spyOn(Math, 'random').mockReturnValueOnce(0.1).mockReturnValueOnce(0.9);

      const damage1 = calculateDamage(100, 50, 0.5); // 应该暴击
      const damage2 = calculateDamage(100, 50, 0.5); // 不应该暴击

      expect(damage1).toBe(100); // 暴击伤害
      expect(damage2).toBe(50);  // 普通伤害
    });
  });
});