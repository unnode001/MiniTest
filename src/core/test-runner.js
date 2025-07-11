const path = require('path');
const { setupGlobalAPI, context } = require('./context');
const { CoverageCollector } = require('../coverage/collector');

/**
 * 测试运行器
 */
class TestRunner {
    constructor(config = {}) {
        // 新的配置系统
        this.config = config;

        // 向后兼容的选项映射
        this.options = {
            reporter: config.reporters ? config.reporters[0] : 'console',
            verbose: config.reporterOptions?.console?.verbose || false,
            timeout: config.timeout || 5000,
            colors: config.reporterOptions?.console?.colors !== false,
            coverage: config.coverage?.enabled || false,
            coverageDir: config.coverage?.dir || 'coverage'
        };

        this.coverageCollector = null;
    }    /**
     * 运行测试文件
     */
    async run(testFiles) {
        // 检查是否启用并行执行
        if (this.config.parallel && testFiles.length > 1) {
            return await this.runInParallel(testFiles);
        } else {
            return await this.runSequentially(testFiles);
        }
    }

    /**
     * 并行运行测试文件
     */
    async runInParallel(testFiles) {
        const ParallelTestRunner = require('../parallel/runner');
        const parallelRunner = new ParallelTestRunner(this.config);

        console.log(`🔀 Running ${testFiles.length} test files in parallel...`);

        const startTime = Date.now();

        try {
            const results = await parallelRunner.run(testFiles);

            // 如果启用覆盖率，需要在主进程中收集
            if (this.config.coverage?.enabled) {
                console.log('📊 Collecting coverage data...');
                // 注意：并行执行时覆盖率收集更复杂，暂时跳过
                results.coverage = null;
            }

            // 确保结果格式兼容
            if (!results.tests) {
                results.tests = [];
                // 从files中收集所有测试
                results.files.forEach(file => {
                    if (file.tests && Array.isArray(file.tests)) {
                        results.tests = results.tests.concat(file.tests);
                    }
                });
            }

            return results;

        } catch (error) {
            console.error('❌ Parallel execution failed:', error.message);
            console.log('🔄 Falling back to sequential execution...');
            return await this.runSequentially(testFiles);
        }
    }

    /**
     * 顺序运行测试文件
     */
    async runSequentially(testFiles) {
        const allResults = {
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            files: []
        };

        const startTime = Date.now();

        // 如果启用覆盖率，初始化收集器
        if (this.options.coverage) {
            this.coverageCollector = new CoverageCollector();
            this.coverageCollector.start();
        }

        try {
            for (const testFile of testFiles) {
                const fileResult = await this.runTestFile(testFile);
                allResults.files.push(fileResult);
                allResults.passed += fileResult.passed;
                allResults.failed += fileResult.failed;
                allResults.skipped += fileResult.skipped;
            }
        } finally {
            // 停止覆盖率收集
            if (this.coverageCollector) {
                this.coverageCollector.stop();
            }
        }

        allResults.duration = Date.now() - startTime;

        // 添加覆盖率报告
        if (this.coverageCollector) {
            allResults.coverage = this.coverageCollector.getReport();
        }

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
