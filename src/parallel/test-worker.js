/**
 * 测试Worker脚本
 * 在独立进程中运行测试文件
 */

const { parentPort, workerData } = require('worker_threads');
const path = require('path');

// Worker信息
const { workerId, timeout } = workerData;

// 初始化Worker环境
class TestWorker {
    constructor() {
        this.isShutdown = false;
        this.currentTask = null;

        // 设置消息监听
        if (parentPort) {
            parentPort.on('message', (message) => {
                this.handleMessage(message);
            });
        }

        // 发送就绪信号
        this.sendMessage('worker-ready', { workerId });

        console.log(`👷 Test Worker ${workerId} started`);
    }

    /**
     * 处理主进程消息
     */
    async handleMessage(message) {
        const { type, task } = message;

        try {
            switch (type) {
                case 'run-task':
                    await this.runTask(task);
                    break;

                case 'shutdown':
                    await this.shutdown();
                    break;

                default:
                    console.warn(`Unknown message type: ${type}`);
            }
        } catch (error) {
            console.error(`Worker ${workerId} error handling message:`, error);
            this.sendMessage('task-failed', null, error.message);
        }
    }

    /**
     * 运行测试任务
     */
    async runTask(task) {
        this.currentTask = task;
        const { id, type, data } = task;

        try {
            let result;

            switch (type) {
                case 'test-file':
                    result = await this.runTestFile(data);
                    break;

                case 'test-suite':
                    result = await this.runTestSuite(data);
                    break;

                default:
                    throw new Error(`Unknown task type: ${type}`);
            }

            this.sendMessage('task-completed', id, result);
        } catch (error) {
            console.error(`Task ${id} failed:`, error);
            this.sendMessage('task-failed', id, error.message);
        } finally {
            this.currentTask = null;
        }
    }

    /**
     * 运行单个测试文件
     */
    async runTestFile(fileData) {
        const { filePath, config } = fileData;

        console.log(`🧪 Worker ${workerId} running: ${filePath}`);

        // 设置超时
        const timeoutId = setTimeout(() => {
            throw new Error(`Test file ${filePath} timed out after ${timeout}ms`);
        }, timeout);

        try {
            // 创建独立的测试上下文
            const { setupGlobalAPI, context } = require('../core/context');

            // 重置全局状态
            context.reset();
            setupGlobalAPI();

            // 加载测试文件
            const absolutePath = path.resolve(filePath);

            // 清除require缓存以确保测试独立性
            delete require.cache[absolutePath];

            // 执行测试文件
            require(absolutePath);

            // 获取根套件并运行收集到的测试
            const rootSuite = context.getRootSuite();
            const results = await rootSuite.run();

            clearTimeout(timeoutId);

            return {
                filePath,
                results,
                workerId,
                duration: results.duration || 0
            };

        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * 运行测试套件
     */
    async runTestSuite(suiteData) {
        const { suiteName, tests, config } = suiteData;

        console.log(`📦 Worker ${workerId} running suite: ${suiteName}`);

        try {
            // 这里可以实现更细粒度的测试套件执行
            // 暂时抛出未实现错误
            throw new Error('Test suite execution not implemented yet');
        } catch (error) {
            throw error;
        }
    }

    /**
     * 发送消息给主进程
     */
    sendMessage(type, taskId = null, data = null) {
        if (parentPort && !this.isShutdown) {
            const message = { type, workerId };

            if (taskId !== null) {
                message.taskId = taskId;
            }

            if (data !== null) {
                if (type === 'task-failed') {
                    message.error = data;
                } else {
                    message.data = data;
                }
            }

            parentPort.postMessage(message);
        }
    }

    /**
     * 关闭Worker
     */
    async shutdown() {
        console.log(`🔄 Worker ${workerId} shutting down...`);
        this.isShutdown = true;

        // 如果有正在运行的任务，等待完成
        if (this.currentTask) {
            console.log(`⏳ Worker ${workerId} waiting for current task to complete...`);
            // 这里可以添加任务取消逻辑
        }

        console.log(`✅ Worker ${workerId} shutdown complete`);
        process.exit(0);
    }
}

// 错误处理
process.on('uncaughtException', (error) => {
    console.error(`🚨 Uncaught exception in worker ${workerId}:`, error);
    if (parentPort) {
        parentPort.postMessage({
            type: 'task-failed',
            workerId,
            error: error.message
        });
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`🚨 Unhandled rejection in worker ${workerId}:`, reason);
    if (parentPort) {
        parentPort.postMessage({
            type: 'task-failed',
            workerId,
            error: reason.toString()
        });
    }
    process.exit(1);
});

// 启动Worker
new TestWorker();
