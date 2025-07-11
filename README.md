# MiniTest - 轻量级JavaScript测试框架

一个功能完整的单元测试框架，支持断言、测试套件、钩子函数等核心功能。

## 安装

```bash
npm install
```

## 基本用法

创建测试文件 `example.test.js`:

```javascript
describe('Example Tests', () => {
    test('should pass basic assertions', () => {
        assert.equal(1 + 1, 2);
        assert.true(true);
        assert.false(false);
    });
    
    test('should handle async tests', async () => {
        const result = await Promise.resolve(42);
        assert.equal(result, 42);
    });
});
```

运行测试:

```bash
# 运行所有测试
npm test

# 详细输出
npm run test:verbose

# JSON格式输出
npm run test:json
```

## API 文档

### 测试函数

- `describe(name, callback)` - 创建测试套件
- `test(name, callback)` - 创建测试用例
- `beforeEach(callback)` - 每个测试前执行
- `afterEach(callback)` - 每个测试后执行
- `beforeAll(callback)` - 所有测试前执行
- `afterAll(callback)` - 所有测试后执行

### 断言函数

- `assert.equal(actual, expected)` - 相等断言
- `assert.notEqual(actual, expected)` - 不相等断言
- `assert.true(value)` - 真值断言
- `assert.false(value)` - 假值断言
- `assert.deepEqual(actual, expected)` - 深度相等断言
- `assert.throws(fn, expectedError)` - 异常断言
- `assert.rejects(asyncFn, expectedError)` - 异步异常断言

## 开发状态

- [x] 第一阶段：核心测试框架 ✅
  - [x] 基础断言库 (equal, notEqual, true, false, deepEqual, throws)
  - [x] 异步断言 (rejects, resolves)
  - [x] 测试用例和测试套件
  - [x] 钩子函数 (beforeAll, afterAll, beforeEach, afterEach)
  - [x] 控制台报告器
  - [x] CLI界面
  - [x] 超时控制
  - [x] 嵌套测试套件支持

- [ ] 第二阶段：增强功能
  - [ ] 测试覆盖率统计
  - [ ] HTML/XML报告器
  - [ ] 测试文件自动发现优化

- [ ] 第三阶段：高级功能
  - [ ] 并行测试执行
  - [ ] 测试数据mock功能
  - [ ] 性能基准测试
