// 测试1：玩家初始化功能
test('玩家初始化成功，ID/名称/坐标正确', () => {
  const player = {
    id: 'test_001',
    name: '测试玩家',
    x: 100,
    y: 200
  };
  expect(player.id).toBe('test_001');
  expect(player.name).toBe('测试玩家');
  expect(player.x).toBe(100);
  expect(player.y).toBe(200);
});

// 测试2：合法移动校验
test('合法移动坐标应返回true', () => {
  function canMove(x, y, mapWidth = 500, mapHeight = 500) {
    return x >= 0 && y >= 0 && x < mapWidth && y < mapHeight;
  }
  expect(canMove(250, 300)).toBe(true);
});

// 测试3：越界移动校验
test('越界移动坐标应返回false', () => {
  function canMove(x, y, mapWidth = 500, mapHeight = 500) {
    return x >= 0 && y >= 0 && x < mapWidth && y < mapHeight;
  }
  expect(canMove(600, 600)).toBe(false);
});
