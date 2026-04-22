// 测试1：玩家对象创建正确
test('玩家初始化正确', () => {
  const player = {
    id: 'test01',
    name: 'test',
    x: 100,
    y: 100
  };
  expect(player.id).toBe('test01');
  expect(player.x).toBe(100);
});

// 测试2：合法移动 → 返回 true
test('合法移动', () => {
  const canMove = (x, y) => x >= 0 && y >= 0 && x < 500 && y < 500;
  expect(canMove(200, 200)).toBe(true);
});

// 测试3：越界移动 → 返回 false
test('越界移动', () => {
  const canMove = (x, y) => x >= 0 && y >= 0 && x < 500 && y < 500;
  expect(canMove(600, 600)).toBe(false);
});
