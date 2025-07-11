/**
 * 并行测试运行器
 * 协调WorkerPool来并行执行测试
 */

const WorkerPool = require('./worker-pool');
const path = require('path');

class ParallelTestRunner {
    constructor(config = {}) {
        this.config = config;
        this.workerPool = null;
        this.results = {
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0,
            files: []
        };
        this.startTime = 0;
    }

    /**
     * 并行运行测试文件
     */
    async run(testFiles) {
        if (!this.config.parallel) {
            throw new Error('Parallel execution is not enabled in config');
        }

        console.log(`🚀 Starting parallel execution with ${this.config.maxWorkers} workers...`);
        this.startTime = Date.now();

        try {
            // 初始化Worker池
            await this.initializeWorkerPool();

            // 创建任务
            const tasks = this.createTasks(testFiles);

            // 添加任务到队列
            console.log(`📋 Queuing ${tasks.length} test file tasks...`);
            tasks.forEach(task => this.workerPool.addTask(task));

            // 等待所有任务完成
            const taskResults = await this.workerPool.waitForCompletion();

            // 处理结果
            this.processResults(taskResults);

            return this.results;

        } finally {
            // 关闭Worker池
            if (this.workerPool) {
                await this.workerPool.shutdown();
            }
        }
    }

    /**
     * 初始化Worker池
     */
    async initializeWorkerPool() {
        this.workerPool = new WorkerPool({
            maxWorkers: this.config.maxWorkers,
            timeout: this.config.timeout,
            workerScript: path.join(__dirname, 'test-worker.js')
        });

        // 设置事件监听
        this.setupWorkerPoolEvents();

        await this.workerPool.initialize();
    }

    /**
     * 设置Worker池事件监听
     */
    setupWorkerPoolEvents() {
        this.workerPool.on('task-started', (data) => {
            console.log(`▶️  Running ${data.taskType} on ${data.workerId}`);
        });

        this.workerPool.on('task-completed', (data) => {
            console.log(`✅ Completed task ${data.taskId} on ${data.workerId}`);
        });

        this.workerPool.on('task-failed', (data) => {
            console.error(`❌ Failed task ${data.taskId} on ${data.workerId}: ${data.error}`);
        });

        this.workerPool.on('task-progress', (data) => {
            // 可以在这里显示进度信息
        });
    }

    /**
     * 创建测试任务
     */
    createTasks(testFiles) {
        return testFiles.map(filePath => ({
            type: 'test-file',
            data: {
                filePath,
                config: this.config
            }
        }));
    }

    /**
     * 处理任务结果
     */
    processResults(taskResults) {
        this.results.duration = Date.now() - this.startTime;

        for (const [taskId, taskResult] of Object.entries(taskResults)) {
            if (taskResult.success) {
                const fileResult = taskResult.data;
                const results = fileResult.results;

                // 累计统计
                this.results.passed += results.passed || 0;
                this.results.failed += results.failed || 0;
                this.results.skipped += results.skipped || 0;

                // 添加文件结果，确保格式与顺序执行兼容
                this.results.files.push({
                    file: fileResult.filePath,          // 控制台报告器期望的字段
                    filePath: fileResult.filePath,      // 保持向后兼容
                    workerId: fileResult.workerId,
                    duration: fileResult.duration,
                    passed: results.passed || 0,
                    failed: results.failed || 0,
                    skipped: results.skipped || 0,
                    tests: results.tests || [],
                    suites: results.suites || []        // 确保有suites字段
                });

            } else {
                // 处理失败的任务
                this.results.failed += 1;
                this.results.files.push({
                    file: 'unknown',
                    filePath: 'unknown',
                    workerId: 'unknown',
                    duration: 0,
                    passed: 0,
                    failed: 1,
                    skipped: 0,
                    error: taskResult.error,
                    tests: [],
                    suites: []
                });
            }
        }

        // 显示执行统计
        this.displayExecutionStats();
    }

    /**
     * 显示执行统计信息
     */
    displayExecutionStats() {
        const stats = this.workerPool.getStats();
        const totalTests = this.results.passed + this.results.failed + this.results.skipped;

        console.log('\n📊 Parallel Execution Statistics:');
        console.log(`  Total Files: ${this.results.files.length}`);
        console.log(`  Total Tests: ${totalTests}`);
        console.log(`  Workers Created: ${stats.workersCreated}`);
        console.log(`  Tasks Completed: ${stats.tasksCompleted}/${stats.tasksTotal}`);
        console.log(`  Execution Time: ${this.results.duration}ms`);

        if (stats.tasksTotal > 0) {
            const avgTimePerTask = this.results.duration / stats.tasksTotal;
            console.log(`  Avg Time/Task: ${avgTimePerTask.toFixed(2)}ms`);
        }

        console.log('');
    }

    /**
     * 估算性能提升
     */
    estimatePerformanceGain(sequentialTime) {
        if (sequentialTime && this.results.duration) {
            const speedup = (sequentialTime / this.results.duration).toFixed(2);
            const improvement = (((sequentialTime - this.results.duration) / sequentialTime) * 100).toFixed(1);

            console.log(`🚀 Performance Gain:`);
            console.log(`  Sequential Time: ${sequentialTime}ms`);
            console.log(`  Parallel Time: ${this.results.duration}ms`);
            console.log(`  Speedup: ${speedup}x`);
            console.log(`  Improvement: ${improvement}%`);
            console.log('');
        }
    }

    /**
     * 获取详细的文件结果
     */
    getFileResults() {
        return this.results.files.map(file => ({
            ...file,
            testsPerSecond: file.duration > 0 ? ((file.passed + file.failed) / (file.duration / 1000)).toFixed(2) : 0
        }));
    }
}

module.exports = ParallelTestRunner;
