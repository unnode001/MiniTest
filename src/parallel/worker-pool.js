/**
 * 工作进程池管理器
 * 管理多个Worker进程来并行执行测试
 */

const { Worker } = require('worker_threads');
const path = require('path');
const EventEmitter = require('events');

class WorkerPool extends EventEmitter {
    constructor(options = {}) {
        super();

        this.maxWorkers = options.maxWorkers || require('os').cpus().length;
        this.workerScript = options.workerScript || path.join(__dirname, 'test-worker.js');
        this.timeout = options.timeout || 30000;

        this.workers = [];
        this.activeWorkers = new Set();
        this.taskQueue = [];
        this.runningTasks = new Map();
        this.results = new Map();
        this.isShutdown = false;

        this.stats = {
            tasksCompleted: 0,
            tasksTotal: 0,
            workersCreated: 0,
            workersTerminated: 0
        };
    }

    /**
     * 初始化工作进程池
     */
    async initialize() {
        if (this.isShutdown) {
            throw new Error('Worker pool has been shutdown');
        }

        console.log(`🚀 Initializing worker pool with ${this.maxWorkers} workers...`);

        // 创建初始工作进程
        for (let i = 0; i < Math.min(this.maxWorkers, 2); i++) {
            await this.createWorker();
        }

        this.emit('initialized');
    }

    /**
     * 创建新的工作进程
     */
    async createWorker() {
        if (this.workers.length >= this.maxWorkers) {
            return null;
        }

        const workerId = `worker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        try {
            const worker = new Worker(this.workerScript, {
                workerData: {
                    workerId,
                    timeout: this.timeout
                }
            });

            worker.workerId = workerId;
            worker.isBusy = false;
            worker.currentTask = null;
            worker.startTime = Date.now();

            // 设置Worker事件监听
            this.setupWorkerEvents(worker);

            this.workers.push(worker);
            this.stats.workersCreated++;

            console.log(`👷 Worker ${workerId} created (${this.workers.length}/${this.maxWorkers})`);

            return worker;
        } catch (error) {
            console.error(`❌ Failed to create worker: ${error.message}`);
            throw error;
        }
    }

    /**
     * 设置Worker事件监听
     */
    setupWorkerEvents(worker) {
        // 监听Worker消息
        worker.on('message', (message) => {
            this.handleWorkerMessage(worker, message);
        });

        // 监听Worker错误
        worker.on('error', (error) => {
            console.error(`❌ Worker ${worker.workerId} error:`, error);
            this.handleWorkerError(worker, error);
        });

        // 监听Worker退出
        worker.on('exit', (code) => {
            console.log(`🔚 Worker ${worker.workerId} exited with code ${code}`);
            this.handleWorkerExit(worker, code);
        });
    }

    /**
     * 处理Worker消息
     */
    handleWorkerMessage(worker, message) {
        const { type, taskId, data, error } = message;

        switch (type) {
            case 'task-completed':
                this.handleTaskCompleted(worker, taskId, data);
                break;

            case 'task-failed':
                this.handleTaskFailed(worker, taskId, error);
                break;

            case 'task-progress':
                this.emit('task-progress', { workerId: worker.workerId, taskId, data });
                break;

            case 'worker-ready':
                console.log(`✅ Worker ${worker.workerId} is ready`);
                break;

            default:
                console.warn(`Unknown message type from worker ${worker.workerId}: ${type}`);
        }
    }

    /**
     * 处理任务完成
     */
    handleTaskCompleted(worker, taskId, result) {
        worker.isBusy = false;
        worker.currentTask = null;

        this.activeWorkers.delete(worker.workerId);
        this.runningTasks.delete(taskId);
        this.results.set(taskId, { success: true, data: result });

        this.stats.tasksCompleted++;

        this.emit('task-completed', { taskId, result, workerId: worker.workerId });

        // 处理下一个任务
        this.processNextTask();
    }

    /**
     * 处理任务失败
     */
    handleTaskFailed(worker, taskId, error) {
        worker.isBusy = false;
        worker.currentTask = null;

        this.activeWorkers.delete(worker.workerId);
        this.runningTasks.delete(taskId);
        this.results.set(taskId, { success: false, error });

        this.stats.tasksCompleted++;

        this.emit('task-failed', { taskId, error, workerId: worker.workerId });

        // 处理下一个任务
        this.processNextTask();
    }

    /**
     * 处理Worker错误
     */
    handleWorkerError(worker, error) {
        if (worker.currentTask) {
            this.handleTaskFailed(worker, worker.currentTask.id, error);
        }

        // 移除出错的Worker
        this.removeWorker(worker);

        // 如果还有任务且Worker数量不足，创建新Worker
        if (this.taskQueue.length > 0 && this.workers.length < this.maxWorkers) {
            this.createWorker().catch(err => {
                console.error('Failed to create replacement worker:', err);
            });
        }
    }

    /**
     * 处理Worker退出
     */
    handleWorkerExit(worker, code) {
        this.removeWorker(worker);
        this.stats.workersTerminated++;

        if (code !== 0 && worker.currentTask) {
            this.handleTaskFailed(worker, worker.currentTask.id, new Error(`Worker exited with code ${code}`));
        }
    }

    /**
     * 移除Worker
     */
    removeWorker(worker) {
        const index = this.workers.indexOf(worker);
        if (index !== -1) {
            this.workers.splice(index, 1);
            this.activeWorkers.delete(worker.workerId);
        }
    }

    /**
     * 添加任务到队列
     */
    addTask(task) {
        if (this.isShutdown) {
            throw new Error('Cannot add task: worker pool is shutdown');
        }

        const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const taskWithId = { ...task, id: taskId };

        this.taskQueue.push(taskWithId);
        this.stats.tasksTotal++;

        // 立即尝试处理任务
        setImmediate(() => this.processNextTask());

        return taskId;
    }

    /**
     * 处理下一个任务
     */
    async processNextTask() {
        if (this.taskQueue.length === 0 || this.isShutdown) {
            return;
        }

        // 查找空闲的Worker
        let availableWorker = this.workers.find(w => !w.isBusy);

        // 如果没有空闲Worker且还可以创建新Worker
        if (!availableWorker && this.workers.length < this.maxWorkers) {
            try {
                availableWorker = await this.createWorker();
            } catch (error) {
                console.error('Failed to create worker for task:', error);
                return;
            }
        }

        if (!availableWorker) {
            return; // 所有Worker都忙，等待
        }

        const task = this.taskQueue.shift();
        this.assignTaskToWorker(availableWorker, task);
    }

    /**
     * 将任务分配给Worker
     */
    assignTaskToWorker(worker, task) {
        worker.isBusy = true;
        worker.currentTask = task;

        this.activeWorkers.add(worker.workerId);
        this.runningTasks.set(task.id, { worker, task, startTime: Date.now() });

        // 发送任务给Worker
        worker.postMessage({
            type: 'run-task',
            task: task
        });

        this.emit('task-started', {
            taskId: task.id,
            workerId: worker.workerId,
            taskType: task.type
        });
    }

    /**
     * 等待所有任务完成
     */
    async waitForCompletion() {
        return new Promise((resolve) => {
            const checkCompletion = () => {
                if (this.taskQueue.length === 0 && this.runningTasks.size === 0) {
                    resolve(this.getResults());
                } else {
                    // 继续处理剩余任务
                    this.processNextTask();
                    setTimeout(checkCompletion, 100);
                }
            };

            checkCompletion();
        });
    }

    /**
     * 获取所有结果
     */
    getResults() {
        const results = {};
        for (const [taskId, result] of this.results.entries()) {
            results[taskId] = result;
        }
        return results;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            activeWorkers: this.activeWorkers.size,
            queuedTasks: this.taskQueue.length,
            runningTasks: this.runningTasks.size,
            totalWorkers: this.workers.length
        };
    }

    /**
     * 关闭工作进程池
     */
    async shutdown(force = false) {
        console.log('🔄 Shutting down worker pool...');
        this.isShutdown = true;

        if (force) {
            // 强制终止所有Worker
            await Promise.all(this.workers.map(worker => worker.terminate()));
        } else {
            // 等待当前任务完成后优雅关闭
            while (this.runningTasks.size > 0) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            // 发送关闭信号给所有Worker
            this.workers.forEach(worker => {
                worker.postMessage({ type: 'shutdown' });
            });

            // 等待所有Worker退出
            await Promise.all(this.workers.map(worker =>
                new Promise(resolve => {
                    worker.on('exit', resolve);
                    setTimeout(() => worker.terminate(), 5000); // 5秒后强制终止
                })
            ));
        }

        this.workers = [];
        this.activeWorkers.clear();
        this.runningTasks.clear();

        console.log('✅ Worker pool shutdown complete');
        this.emit('shutdown');
    }
}

module.exports = WorkerPool;
