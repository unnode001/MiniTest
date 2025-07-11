const { TestCase } = require('./test-case');

/**
 * 测试套件类
 */
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

    /**
     * 添加测试用例
     */
    addTest(test) {
        this.tests.push(test);
    }

    /**
     * 添加子套件
     */
    addSuite(suite) {
        this.suites.push(suite);
    }

    /**
     * 添加钩子函数
     */
    addHook(type, fn) {
        if (this.hooks[type]) {
            this.hooks[type].push(fn);
        }
    }    /**
     * 运行测试套件
     */
    async run(parentSuite = null) {
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

        try {
            // 运行beforeAll钩子（包括父套件的）
            await this.runHooksWithInheritance('beforeAll', parentSuite);

            // 运行测试用例
            for (const test of this.tests) {
                await this.runHooksWithInheritance('beforeEach', parentSuite);
                await test.run();
                await this.runHooksWithInheritance('afterEach', parentSuite);

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
                const suiteResult = await suite.run(this);
                results.suites.push(suiteResult);
                results.passed += suiteResult.passed;
                results.failed += suiteResult.failed;
                results.skipped += suiteResult.skipped;
            }

            // 运行afterAll钩子（包括父套件的）
            await this.runHooksWithInheritance('afterAll', parentSuite);
        } catch (error) {
            // 套件级别的错误处理
            results.failed++;
            results.tests.push({
                name: `Suite: ${this.name}`,
                status: 'failed',
                duration: 0,
                error: error.message
            });
        }

        results.duration = Date.now() - startTime;
        return results;
    }
    /**
    * 运行钩子函数，包括继承的钩子
    */
    async runHooksWithInheritance(type, parentSuite) {
        // 先运行父套件的钩子
        if (parentSuite) {
            for (const hook of parentSuite.hooks[type]) {
                await hook();
            }
        }

        // 再运行当前套件的钩子
        for (const hook of this.hooks[type]) {
            await hook();
        }
    }
}

module.exports = { TestSuite };
