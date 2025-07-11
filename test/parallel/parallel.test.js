/**
 * 并行执行系统测试
 */

const path = require('path');
const WorkerPool = require('../../src/parallel/worker-pool');
const ParallelTestRunner = require('../../src/parallel/runner');

describe('并行执行系统测试', () => {
    let workerPool;

    afterEach(async () => {
        if (workerPool) {
            await workerPool.shutdown(true);
            workerPool = null;
        }
    });

    test('应该创建和管理Worker池', async () => {
        workerPool = new WorkerPool({
            maxWorkers: 2,
            timeout: 5000
        });

        await workerPool.initialize();

        const stats = workerPool.getStats();
        assert.equal(stats.totalWorkers, 2);
        assert.equal(stats.activeWorkers, 0);
    });

    test('应该处理简单任务', async () => {
        workerPool = new WorkerPool({
            maxWorkers: 1,
            timeout: 5000
        });

        await workerPool.initialize();

        // 添加一个测试任务
        const taskId = workerPool.addTask({
            type: 'test-file',
            data: {
                filePath: path.join(__dirname, '../examples/basic.test.js'),
                config: { timeout: 5000 }
            }
        });

        // 等待任务完成
        const results = await workerPool.waitForCompletion();

        assert.true(results[taskId].success);
        assert.true(results[taskId].data.results.passed > 0);
    });

    test('应该并行处理多个任务', async () => {
        workerPool = new WorkerPool({
            maxWorkers: 2,
            timeout: 10000
        });

        await workerPool.initialize();

        // 添加多个测试任务
        const tasks = [
            'test/examples/basic.test.js',
            'test/examples/async.test.js',
            'test/examples/demo.test.js'
        ];

        const taskIds = [];
        for (const testFile of tasks) {
            const taskId = workerPool.addTask({
                type: 'test-file',
                data: {
                    filePath: testFile,
                    config: { timeout: 5000 }
                }
            });
            taskIds.push(taskId);
        }

        // 等待所有任务完成
        const results = await workerPool.waitForCompletion();

        // 验证所有任务都成功完成
        for (const taskId of taskIds) {
            assert.true(results[taskId].success);
        }

        const stats = workerPool.getStats();
        assert.equal(stats.tasksCompleted, 3);
    });

    test('应该处理任务失败', async () => {
        workerPool = new WorkerPool({
            maxWorkers: 1,
            timeout: 1000 // 短超时时间
        });

        await workerPool.initialize();

        // 添加一个不存在的测试文件
        const taskId = workerPool.addTask({
            type: 'test-file',
            data: {
                filePath: 'non-existent-file.js',
                config: { timeout: 500 }
            }
        });

        const results = await workerPool.waitForCompletion();

        // 任务应该失败
        assert.false(results[taskId].success);
        assert.true(typeof results[taskId].error === 'string');
    });

    test('应该正确统计Worker池状态', async () => {
        workerPool = new WorkerPool({
            maxWorkers: 3,
            timeout: 5000
        });

        await workerPool.initialize();

        const initialStats = workerPool.getStats();
        assert.equal(initialStats.workersCreated, 2); // 初始创建2个Worker
        assert.equal(initialStats.tasksTotal, 0);
        assert.equal(initialStats.tasksCompleted, 0);

        // 添加任务
        workerPool.addTask({
            type: 'test-file',
            data: {
                filePath: 'test/examples/basic.test.js',
                config: { timeout: 5000 }
            }
        });

        const afterTaskStats = workerPool.getStats();
        assert.equal(afterTaskStats.tasksTotal, 1);

        await workerPool.waitForCompletion();

        const finalStats = workerPool.getStats();
        assert.equal(finalStats.tasksCompleted, 1);
    });
});

describe('并行测试运行器测试', () => {
    let runner;

    afterEach(async () => {
        if (runner && runner.workerPool) {
            await runner.workerPool.shutdown(true);
        }
    });

    test('应该拒绝非并行配置', async () => {
        runner = new ParallelTestRunner({
            parallel: false,
            maxWorkers: 2
        });

        try {
            await runner.run(['test/examples/basic.test.js']);
            assert.true(false, 'Should have thrown an error');
        } catch (error) {
            assert.matches(error.message, /not enabled/);
        }
    });

    test('应该并行运行多个测试文件', async () => {
        runner = new ParallelTestRunner({
            parallel: true,
            maxWorkers: 2,
            timeout: 10000
        });

        const testFiles = [
            'test/examples/basic.test.js',
            'test/examples/async.test.js'
        ];

        const startTime = Date.now();
        const results = await runner.run(testFiles);
        const duration = Date.now() - startTime;

        assert.true(results.passed > 0);
        assert.equal(results.files.length, 2);
        assert.true(duration < 15000); // 应该在合理时间内完成

        // 验证每个文件都有结果
        for (const fileResult of results.files) {
            assert.true(typeof fileResult.filePath === 'string');
            assert.true(typeof fileResult.workerId === 'string');
            assert.true(fileResult.duration >= 0);
        }
    });
});
