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

### 基础断言

- `assert.equal(actual, expected)` - 相等断言
- `assert.notEqual(actual, expected)` - 不相等断言
- `assert.true(value)` - 真值断言
- `assert.false(value)` - 假值断言
- `assert.deepEqual(actual, expected)` - 深度相等断言
- `assert.throws(fn, expectedError)` - 异常断言
- `assert.rejects(asyncFn, expectedError)` - 异步异常断言
- `assert.resolves(asyncFn)` - 异步成功断言

### 扩展断言

#### 包含性断言

- `assert.includes(container, item)` - 检查是否包含
- `assert.notIncludes(container, item)` - 检查是否不包含
- `assert.includesAllOf(array, items)` - 检查是否包含所有元素
- `assert.includesAnyOf(array, items)` - 检查是否包含任意元素

#### 类型断言

- `assert.instanceOf(value, Class)` - 实例类型检查
- `assert.typeOf(value, type)` - 基础类型检查

#### 长度和空值断言

- `assert.lengthOf(value, length)` - 长度检查
- `assert.isEmpty(value)` - 空值检查
- `assert.isNotEmpty(value)` - 非空检查

#### Null/Undefined断言

- `assert.isNull(value)` - null检查
- `assert.isNotNull(value)` - 非null检查
- `assert.isUndefined(value)` - undefined检查
- `assert.isNotUndefined(value)` - 非undefined检查

#### 数值和模式断言

- `assert.inRange(number, min, max)` - 数值范围检查
- `assert.matches(string, pattern)` - 正则表达式匹配
- `assert.hasProperty(object, property)` - 对象属性检查

### 命令行选项

```bash
# 基础选项
minitest [pattern] [options]

# 报告格式
--reporter <type>     # console, json, html, xml
--verbose, -v         # 详细输出
--no-colors          # 禁用颜色

# 覆盖率选项  
--coverage, -c       # 启用代码覆盖率
--coverage-dir <dir> # 覆盖率输出目录

# 输出选项
--html-out <file>    # HTML报告输出文件
--xml-out <file>     # XML报告输出文件
--timeout <ms>       # 测试超时时间
```

## 使用示例

### 基础测试示例

```javascript
describe('计算器测试', () => {
  beforeEach(() => {
    // 每个测试前的准备工作
  });

  test('加法测试', () => {
    const result = 2 + 3;
    assert.equal(result, 5);
  });

  test('异步操作测试', async () => {
    const data = await fetchData();
    assert.deepEqual(data, { success: true });
  });
});
```

### 扩展断言示例

```javascript
describe('扩展断言测试', () => {
  test('数组包含测试', () => {
    const fruits = ['apple', 'banana', 'orange'];
    assert.includes(fruits, 'apple');
    assert.includesAllOf(fruits, ['apple', 'banana']);
  });

  test('类型检查测试', () => {
    const user = new User('John');
    assert.instanceOf(user, User);
    assert.typeOf(user.name, 'string');
  });

  test('范围和模式测试', () => {
    assert.inRange(score, 0, 100);
    assert.matches(email, /^[\w-]+@[\w-]+\.\w+$/);
  });
});
```

### 覆盖率报告示例

```bash
# 生成HTML覆盖率报告
npm run test:coverage

# 生成XML格式报告（适用于CI/CD）
npx minitest --coverage --reporter xml --xml-out results.xml
```
