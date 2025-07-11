const { TestSuite } = require('./suite');
const { TestCase } = require('./test-case');
const { Assert } = require('../assertions/assert');

/**
 * 全局测试上下文管理器
 */
class TestContext {
    constructor() {
        this.currentSuite = null;
        this.rootSuite = new TestSuite('root');
        this.currentSuite = this.rootSuite;
    }

    /**
     * 创建测试套件
     */
    describe(name, fn) {
        const suite = new TestSuite(name);
        this.currentSuite.addSuite(suite);

        const previousSuite = this.currentSuite;
        this.currentSuite = suite;

        try {
            fn();
        } catch (error) {
            console.error(`Error in describe block "${name}":`, error);
        }

        this.currentSuite = previousSuite;
    }

    /**
     * 创建测试用例
     */
    test(name, fn, timeout) {
        const testCase = new TestCase(name, fn, timeout);
        this.currentSuite.addTest(testCase);
    }

    /**
     * beforeAll钩子
     */
    beforeAll(fn) {
        this.currentSuite.addHook('beforeAll', fn);
    }

    /**
     * afterAll钩子
     */
    afterAll(fn) {
        this.currentSuite.addHook('afterAll', fn);
    }

    /**
     * beforeEach钩子
     */
    beforeEach(fn) {
        this.currentSuite.addHook('beforeEach', fn);
    }

    /**
     * afterEach钩子
     */
    afterEach(fn) {
        this.currentSuite.addHook('afterEach', fn);
    }

    /**
     * 重置上下文
     */
    reset() {
        this.rootSuite = new TestSuite('root');
        this.currentSuite = this.rootSuite;
    }

    /**
     * 获取根套件
     */
    getRootSuite() {
        return this.rootSuite;
    }
}

// 创建全局实例
const context = new TestContext();

// 导出全局API
function setupGlobalAPI() {
    global.describe = context.describe.bind(context);
    global.test = context.test.bind(context);
    global.it = context.test.bind(context); // 别名
    global.beforeAll = context.beforeAll.bind(context);
    global.afterAll = context.afterAll.bind(context);
    global.beforeEach = context.beforeEach.bind(context);
    global.afterEach = context.afterEach.bind(context);
    global.assert = Assert;
}

module.exports = { TestContext, setupGlobalAPI, context };
