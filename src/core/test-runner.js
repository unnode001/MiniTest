const path = require('path');
const { setupGlobalAPI, context } = require('./context');

/**
 * 测试运行器
 */
class TestRunner {
    constructor(options = {}) {
        this.options = {
            reporter: 'console',
            verbose: false,
            timeout: 5000,
            colors: true,
            ...options
        };
    }

    /**
     * 运行测试文件
     */
    async run(testFiles) {
        const allResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            files: []
        };

        const startTime = Date.now();

        for (const testFile of testFiles) {
            const fileResult = await this.runTestFile(testFile);
            allResults.files.push(fileResult);
            allResults.passed += fileResult.passed;
            allResults.failed += fileResult.failed;
            allResults.skipped += fileResult.skipped;
        }

        allResults.duration = Date.now() - startTime;

        return allResults;
    }

    /**
     * 运行单个测试文件
     */
    async runTestFile(testFile) {
        const absolutePath = path.resolve(testFile);

        // 重置全局上下文
        context.reset();

        // 设置全局API
        setupGlobalAPI();

        try {
            // 清除require缓存
            delete require.cache[absolutePath];

            // 加载测试文件
            require(absolutePath);

            // 运行测试
            const rootSuite = context.getRootSuite();
            const results = await rootSuite.run();

            return {
                file: testFile,
                ...results
            };
        } catch (error) {
            return {
                file: testFile,
                name: path.basename(testFile),
                passed: 0,
                failed: 1,
                skipped: 0,
                duration: 0,
                tests: [{
                    name: `Loading ${testFile}`,
                    status: 'failed',
                    duration: 0,
                    error: error.message
                }],
                suites: []
            };
        }
    }
}

module.exports = { TestRunner };
