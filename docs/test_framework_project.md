# JavaScript测试框架项目开发文档

## 项目概述

**项目名称**: MiniTest - 轻量级JavaScript测试框架  
**主要目标**: 实现一个功能完整的单元测试框架，支持断言、测试套件、钩子函数等核心功能

## 技术栈

### 核心技术

- **JavaScript (ES6+)**: 主要开发语言
- **Node.js**: 运行环境
- **Child Process**: 隔离测试执行

### 工具链

- **VS Code**: 开发环境
- **Git**: 版本控制
- **npm**: 包管理

### 依赖包

```json
{
  "chalk": "^5.0.0",
  "glob": "^8.0.0",
  "commander": "^9.0.0",
  "stack-trace": "^0.0.10"
}
```

## 支持的核心功能

### 第一阶段

- 基础断言: `assert.equal()`, `assert.notEqual()`, `assert.true()`, `assert.false()`
- 测试函数: `test(name, callback)`
- 测试套件: `describe(name, callback)`
- 基础报告器: 控制台输出

### 第二阶段

- 异步测试支持: `async/await`, Promise
- 钩子函数: `beforeEach()`, `afterEach()`, `beforeAll()`, `afterAll()`
- 高级断言: `assert.throws()`, `assert.rejects()`, `assert.deepEqual()`
- 测试超时控制

### 第三阶段

- 测试覆盖率统计
- 多种报告格式: JSON, HTML, XML
- 测试文件自动发现
- 并行测试执行

## 项目结构

```
minitest/
├── src/
│   ├── core/
│   │   ├── test-runner.js      # 测试运行器
│   │   ├── suite.js           # 测试套件
│   │   ├── test-case.js       # 测试用例
│   │   └── hooks.js           # 钩子管理
│   ├── assertions/
│   │   ├── assert.js          # 断言库
│   │   ├── matchers.js        # 断言匹配器
│   │   └── comparators.js     # 比较器
│   ├── reporters/
│   │   ├── console.js         # 控制台报告器
│   │   ├── json.js            # JSON报告器
│   │   ├── html.js            # HTML报告器
│   │   └── base.js            # 基础报告器
│   ├── utils/
│   │   ├── file-finder.js     # 文件发现
│   │   ├── stack-parser.js    # 堆栈解析
│   │   └── time-tracker.js    # 时间追踪
│   ├── cli.js                 # 命令行接口
│   └── index.js               # 主入口
├── test/
│   ├── core/
│   │   ├── test-runner.test.js
│   │   ├── suite.test.js
│   │   └── hooks.test.js
│   ├── assertions/
│   │   └── assert.test.js
│   ├── examples/
│   │   ├── basic.test.js
│   │   ├── async.test.js
│   │   └── hooks.test.js
│   └── fixtures/
│       ├── sample-tests/
│       └── mock-data/
├── package.json
├── README.md
└── .gitignore
```

## 开发流程

### 第一阶段：核心测试框架

**目标**: 实现基础的测试运行和断言功能

**核心类设计**:

```javascript
// 测试用例类
class TestCase {
    constructor(name, fn, timeout = 5000) {
        this.name = name;
        this.fn = fn;
        this.timeout = timeout;
        this.status = 'pending'; // pending, running, passed, failed, skipped
        this.error = null;
        this.duration = 0;
    }
    
    async run() {
        this.status = 'running';
        const startTime = Date.now();
        
        try {
            await this.executeWithTimeout();
            this.status = 'passed';
        } catch (error) {
            this.status = 'failed';
            this.error = error;
        }
        
        this.duration = Date.now() - startTime;
    }
    
    async executeWithTimeout() {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timeout after ${this.timeout}ms`));
            }, this.timeout);
            
            Promise.resolve(this.fn()).then(resolve).catch(reject).finally(() => {
                clearTimeout(timer);
            });
        });
    }
}

// 测试套件类
class TestSuite {
    constructor(name) {
        this.name = name;
        this.tests = [];
        this.suites = [];
        this.hooks = {
            beforeAll: [],
            afterAll: [],
            beforeEach: [],
            afterEach: []
        };
    }
    
    addTest(test) {
        this.tests.push(test);
    }
    
    addSuite(suite) {
        this.suites.push(suite);
    }
    
    addHook(type, fn) {
        if (this.hooks[type]) {
            this.hooks[type].push(fn);
        }
    }
    
    async run() {
        const results = {
            name: this.name,
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            tests: [],
            suites: []
        };
        
        const startTime = Date.now();
        
        // 运行beforeAll钩子
        await this.runHooks('beforeAll');
        
        // 运行测试用例
        for (const test of this.tests) {
            await this.runHooks('beforeEach');
            await test.run();
            await this.runHooks('afterEach');
            
            results.tests.push({
                name: test.name,
                status: test.status,
                duration: test.duration,
                error: test.error?.message
            });
            
            if (test.status === 'passed') results.passed++;
            else if (test.status === 'failed') results.failed++;
            else if (test.status === 'skipped') results.skipped++;
        }
        
        // 运行子套件
        for (const suite of this.suites) {
            const suiteResult = await suite.run();
            results.suites.push(suiteResult);
            results.passed += suiteResult.passed;
            results.failed += suiteResult.failed;
            results.skipped += suiteResult.skipped;
        }
        
        // 运行afterAll钩子
        await this.runHooks('afterAll');
        
        results.duration = Date.now() - startTime;
        return results;
    }
    
    async runHooks(type) {
        for (const hook of this.hooks[type]) {
            await hook();
        }
    }
}
```

**断言库实现**:

```javascript
class AssertionError extends Error {
    constructor(message, actual, expected) {
        super(message);
        this.name = 'AssertionError';
        this.actual = actual;
        this.expected = expected;
    }
}

class Assert {
    static equal(actual, expected, message) {
        if (actual !== expected) {
            throw new AssertionError(
                message || `Expected ${actual} to equal ${expected}`,
                actual,
                expected
            );
        }
    }
    
    static notEqual(actual, expected, message) {
        if (actual === expected) {
            throw new AssertionError(
                message || `Expected ${actual} to not equal ${expected}`,
                actual,
                expected
            );
        }
    }
    
    static true(value, message) {
        if (value !== true) {
            throw new AssertionError(
                message || `Expected ${value} to be true`,
                value,
                true
            );
        }
    }
    
    static false(value, message) {
        if (value !== false) {
            throw new AssertionError(
                message || `Expected ${value} to be false`,
                value,
                false
            );
        }
    }
    
    static deepEqual(actual, expected, message) {
        if (!this.isDeepEqual(actual, expected)) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`,
                actual,
                expected
            );
        }
    }
    
    static isDeepEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== typeof b) return false;
        
        if (typeof a === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);
            
            if (keysA.length !== keysB.length) return false;
            
            for (const key of keysA) {
                if (!keysB.includes(key)) return false;
                if (!this.isDeepEqual(a[key], b[key])) return false;
            }
            
            return true;
        }
        
        return false;
    }
    
    static throws(fn, expectedError, message) {
        try {
            fn();
            throw new AssertionError(
                message || 'Expected function to throw an error',
                'no error thrown',
                'error thrown'
            );
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new AssertionError(
                    message || `Expected error to be instance of ${expectedError.name}`,
                    error.constructor.name,
                    expectedError.name
                );
            }
        }
    }
}
```

### 第二阶段：异步测试和钩子函数

**目标**: 支持异步测试和生命阶段期钩子

**全局API设计**:

```javascript
// 全局状态管理
class TestContext {
    constructor() {
        this.currentSuite = null;
        this.rootSuite = new TestSuite('root');
        this.currentSuite = this.rootSuite;
    }
    
    describe(name, fn) {
        const suite = new TestSuite(name);
        this.currentSuite.addSuite(suite);
        
        const previousSuite = this.currentSuite;
        this.currentSuite = suite;
        
        fn();
        
        this.currentSuite = previousSuite;
    }
    
    test(name, fn, timeout) {
        const testCase = new TestCase(name, fn, timeout);
        this.currentSuite.addTest(testCase);
    }
    
    beforeAll(fn) {
        this.currentSuite.addHook('beforeAll', fn);
    }
    
    afterAll(fn) {
        this.currentSuite.addHook('afterAll', fn);
    }
    
    beforeEach(fn) {
        this.currentSuite.addHook('beforeEach', fn);
    }
    
    afterEach(fn) {
        this.currentSuite.addHook('afterEach', fn);
    }
}

// 创建全局实例
const context = new TestContext();

// 导出全局API
global.describe = context.describe.bind(context);
global.test = context.test.bind(context);
global.beforeAll = context.beforeAll.bind(context);
global.afterAll = context.afterAll.bind(context);
global.beforeEach = context.beforeEach.bind(context);
global.afterEach = context.afterEach.bind(context);
global.assert = Assert;
```

**异步测试支持**:

```javascript
// 扩展Assert类支持异步断言
class Assert {
    // ... 之前的方法
    
    static async rejects(asyncFn, expectedError, message) {
        try {
            await asyncFn();
            throw new AssertionError(
                message || 'Expected async function to reject',
                'resolved',
                'rejected'
            );
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new AssertionError(
                    message || `Expected error to be instance of ${expectedError.name}`,
                    error.constructor.name,
                    expectedError.name
                );
            }
        }
    }
    
    static async resolves(asyncFn, message) {
        try {
            await asyncFn();
        } catch (error) {
            throw new AssertionError(
                message || 'Expected async function to resolve',
                'rejected',
                'resolved'
            );
        }
    }
}
```

### 第三阶段：报告器和CLI

**目标**: 完善测试报告和命令行界面

**控制台报告器**:

```javascript
const chalk = require('chalk');

class ConsoleReporter {
    constructor(options = {}) {
        this.options = {
            verbose: false,
            colors: true,
            ...options
        };
    }
    
    onStart(totalTests) {
        console.log(chalk.blue(`\nRunning ${totalTests} tests...\n`));
    }
    
    onTestStart(test) {
        if (this.options.verbose) {
            process.stdout.write(`  ${test.name} ... `);
        }
    }
    
    onTestComplete(test) {
        if (this.options.verbose) {
            if (test.status === 'passed') {
                console.log(chalk.green('✓'));
            } else if (test.status === 'failed') {
                console.log(chalk.red('✗'));
            } else {
                console.log(chalk.yellow('○'));
            }
        } else {
            if (test.status === 'passed') {
                process.stdout.write(chalk.green('✓'));
            } else if (test.status === 'failed') {
                process.stdout.write(chalk.red('✗'));
            } else {
                process.stdout.write(chalk.yellow('○'));
            }
        }
    }
    
    onSuiteComplete(suite) {
        if (!this.options.verbose) {
            console.log('');
        }
        
        console.log(chalk.bold(`\n${suite.name}:`));
        console.log(chalk.green(`  ✓ ${suite.passed} passed`));
        
        if (suite.failed > 0) {
            console.log(chalk.red(`  ✗ ${suite.failed} failed`));
        }
        
        if (suite.skipped > 0) {
            console.log(chalk.yellow(`  ○ ${suite.skipped} skipped`));
        }
        
        console.log(`  Duration: ${suite.duration}ms`);
    }
    
    onComplete(results) {
        console.log('\n' + '='.repeat(50));
        console.log(chalk.bold('Test Results:'));
        console.log(chalk.green(`✓ ${results.passed} passed`));
        
        if (results.failed > 0) {
            console.log(chalk.red(`✗ ${results.failed} failed`));
        }
        
        if (results.skipped > 0) {
            console.log(chalk.yellow(`○ ${results.skipped} skipped`));
        }
        
        console.log(`Total Duration: ${results.duration}ms`);
        
        if (results.failed > 0) {
            console.log('\nFailed Tests:');
            this.printFailedTests(results);
        }
    }
    
    printFailedTests(results) {
        const printTests = (tests, indent = '') => {
            tests.forEach(test => {
                if (test.status === 'failed') {
                    console.log(chalk.red(`${indent}✗ ${test.name}`));
                    if (test.error) {
                        console.log(chalk.gray(`${indent}  ${test.error}`));
                    }
                }
            });
        };
        
        const printSuites = (suites, indent = '') => {
            suites.forEach(suite => {
                printTests(suite.tests, indent + '  ');
                printSuites(suite.suites, indent + '  ');
            });
        };
        
        printTests(results.tests);
        printSuites(results.suites);
    }
}
```

**CLI接口**:

```javascript
const { program } = require('commander');
const glob = require('glob');
const path = require('path');

program
    .version('1.0.0')
    .description('MiniTest - A lightweight JavaScript testing framework')
    .argument('[pattern]', 'Test file pattern', '**/*.test.js')
    .option('-r, --reporter <type>', 'Reporter type (console, json, html)', 'console')
    .option('-v, --verbose', 'Verbose output')
    .option('-t, --timeout <ms>', 'Test timeout in milliseconds', '5000')
    .option('--no-colors', 'Disable colored output')
    .action(async (pattern, options) => {
        const testFiles = glob.sync(pattern);
        
        if (testFiles.length === 0) {
            console.error('No test files found');
            process.exit(1);
        }
        
        const runner = new TestRunner({
            reporter: options.reporter,
            verbose: options.verbose,
            timeout: parseInt(options.timeout),
            colors: options.colors
        });
        
        const results = await runner.run(testFiles);
        
        if (results.failed > 0) {
            process.exit(1);
        }
    });

program.parse();
```

## 测试策略

### 自举测试

```javascript
// test/core/test-runner.test.js
describe('TestRunner', () => {
    test('should run simple test', async () => {
        const runner = new TestRunner();
        const testFile = path.join(__dirname, '../fixtures/simple.test.js');
        
        const results = await runner.run([testFile]);
        
        assert.equal(results.passed, 1);
        assert.equal(results.failed, 0);
    });
    
    test('should handle failed test', async () => {
        const runner = new TestRunner();
        const testFile = path.join(__dirname, '../fixtures/failing.test.js');
        
        const results = await runner.run([testFile]);
        
        assert.equal(results.passed, 0);
        assert.equal(results.failed, 1);
    });
});
```

### 示例测试文件

```javascript
// test/examples/basic.test.js
describe('Basic Tests', () => {
    test('should pass basic assertions', () => {
        assert.equal(1 + 1, 2);
        assert.true(true);
        assert.false(false);
    });
    
    test('should handle async tests', async () => {
        const result = await Promise.resolve(42);
        assert.equal(result, 42);
    });
    
    test('should test error throwing', () => {
        assert.throws(() => {
            throw new Error('test error');
        }, Error);
    });
});
```

## 使用示例

### 基本用法

```javascript
// mymodule.test.js
const myModule = require('./mymodule');

describe('MyModule', () => {
    beforeEach(() => {
        // 每个测试前的准备工作
    });
    
    test('should add two numbers', () => {
        const result = myModule.add(2, 3);
        assert.equal(result, 5);
    });
    
    test('should handle async operations', async () => {
        const result = await myModule.fetchData();
        assert.equal(result.status, 'success');
    });
});
```

### 命令行使用

```bash
# 运行所有测试
minitest

# 运行特定模式的测试
minitest "src/**/*.test.js"

# 使用不同的报告器
minitest --reporter json

# 详细输出
minitest --verbose

# 设置超时时间
minitest --timeout 10000
```

## 扩展功能

### 测试覆盖率

```javascript
class CoverageCollector {
    constructor() {
        this.coverage = new Map();
    }
    
    instrument(code, filename) {
        // 代码插桩，添加覆盖率统计
        return instrumentedCode;
    }
    
    collect(filename, lineNumber) {
        // 收集覆盖率数据
    }
    
    report() {
        // 生成覆盖率报告
    }
}
```

### 并行测试

```javascript
class ParallelRunner {
    constructor(maxWorkers = 4) {
        this.maxWorkers = maxWorkers;
        this.workers = [];
    }
    
    async run(testFiles) {
        const chunks = this.chunkFiles(testFiles);
        const promises = chunks.map(chunk => this.runChunk(chunk));
        
        const results = await Promise.all(promises);
        return this.mergeResults(results);
    }
}
```

## 性能考虑

### 测试隔离

- 每个测试文件在独立的上下文中运行
- 避免全局状态污染
- 提供cleanup机制

### 内存管理

- 及时清理测试数据
- 避免内存泄漏
- 限制并发测试数量

## 参考资料

- Jest源码分析
- Mocha框架设计
- Node.js测试最佳实践
- JavaScript异步编程指南
