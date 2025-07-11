/**
 * 监控模式控制器
 * 协调文件监控、变化检测和测试运行
 */

const EventEmitter = require('events');
const FileWatcher = require('./file-watcher');
const ChangeDetector = require('./change-detector');

class WatchMode extends EventEmitter {
    constructor(testRunner, options = {}) {
        super();

        this.testRunner = testRunner;
        this.options = {
            // 监控选项
            debounce: 200,
            clearConsole: true,
            runOnStart: true,
            failFast: false,
            verbose: false,
            // 通知选项
            showNotifications: true,
            notifyOnSuccess: false,
            notifyOnFailure: true,
            // 性能选项
            enableParallel: true,
            maxWorkers: require('os').cpus().length,
            ...options
        };

        this.fileWatcher = new FileWatcher({
            debounce: this.options.debounce,
            ...this.options.watcherOptions
        });

        this.changeDetector = new ChangeDetector({
            smartDetection: true,
            enableHashing: true,
            ...this.options.detectorOptions
        });

        this.isRunning = false;
        this.lastRunTime = null;
        this.runCount = 0;
        this.stats = {
            totalRuns: 0,
            successfulRuns: 0,
            failedRuns: 0,
            averageRunTime: 0,
            filesChanged: 0,
            lastRunDuration: 0
        };

        this.setupEventHandlers();
    }

    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        // 文件变化事件
        this.fileWatcher.on('change', async (changeInfo) => {
            await this.handleFileChange(changeInfo);
        });

        // 文件监控启动事件
        this.fileWatcher.on('started', (info) => {
            this.emit('watchStarted', info);
        });

        // 文件监控停止事件
        this.fileWatcher.on('stopped', () => {
            this.emit('watchStopped');
        });

        // 处理进程信号
        process.on('SIGINT', () => {
            this.gracefulShutdown();
        });

        process.on('SIGTERM', () => {
            this.gracefulShutdown();
        });
    }

    /**
     * 启动监控模式
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ Watch mode is already running');
            return;
        }

        console.log('🚀 Starting MiniTest in watch mode...');
        this.isRunning = true;

        try {
            // 清屏（如果启用）
            if (this.options.clearConsole) {
                this.clearConsole();
            }

            // 显示启动信息
            this.showWelcome();

            // 初始运行（如果启用）
            if (this.options.runOnStart) {
                await this.runInitialTests();
            }

            // 启动文件监控
            await this.fileWatcher.start();

            // 显示监控状态
            this.showWatchStatus();

            this.emit('started');

        } catch (error) {
            console.error('❌ Failed to start watch mode:', error.message);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * 停止监控模式
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping watch mode...');
        this.isRunning = false;

        try {
            // 停止文件监控
            await this.fileWatcher.stop();

            // 保存变化检测缓存
            this.changeDetector.saveCache();

            // 显示最终统计
            this.showFinalStats();

            this.emit('stopped');

        } catch (error) {
            console.error('❌ Error stopping watch mode:', error.message);
        }
    }

    /**
     * 优雅关闭
     */
    async gracefulShutdown() {
        console.log('\n🔄 Gracefully shutting down...');
        await this.stop();
        process.exit(0);
    }

    /**
     * 处理文件变化
     */
    async handleFileChange(changeInfo) {
        if (!this.isRunning) {
            return;
        }

        this.stats.filesChanged++;

        try {
            // 分析变化影响
            const analysis = await this.changeDetector.analyzeChange(changeInfo);

            if (!analysis.hasContentChanged && analysis.affectedTests.length === 0) {
                // 文件内容未变化，跳过测试
                if (this.options.verbose) {
                    console.log('⏭️ Skipping tests - no content changes detected');
                }
                return;
            }

            // 清屏准备新的运行
            if (this.options.clearConsole) {
                this.clearConsole();
            }

            // 显示变化信息
            this.showChangeInfo(changeInfo, analysis);

            // 运行测试
            await this.runTests(analysis);

        } catch (error) {
            console.error('❌ Error handling file change:', error.message);
            this.emit('error', error);
        }
    }

    /**
     * 初始测试运行
     */
    async runInitialTests() {
        console.log('🧪 Running initial test suite...');

        const analysis = {
            runAll: true,
            reason: 'Initial run',
            affectedTests: [],
            estimatedTestTime: 0
        };

        await this.runTests(analysis);
    }

    /**
     * 运行测试
     */
    async runTests(analysis) {
        const startTime = Date.now();
        this.runCount++;
        this.stats.totalRuns++;

        try {
            // 确定要运行的测试文件
            let testFilesToRun;
            if (analysis.runAll) {
                // 运行所有测试文件 - 获取所有测试文件
                const glob = require('glob');
                const testPatterns = ['test/**/*.test.js', '**/*.test.js'];
                testFilesToRun = [];

                for (const pattern of testPatterns) {
                    const files = glob.sync(pattern, {
                        cwd: process.cwd(),
                        absolute: false,
                        ignore: ['node_modules/**', 'coverage/**']
                    });
                    testFilesToRun = testFilesToRun.concat(files);
                }

                // 去重
                testFilesToRun = [...new Set(testFilesToRun)];
            } else {
                // 运行特定的测试文件
                testFilesToRun = analysis.affectedTests;
            }

            // 显示运行信息
            this.showRunInfo(analysis, {
                files: testFilesToRun,
                parallel: this.options.enableParallel && testFilesToRun.length > 1
            });

            // 运行测试
            const results = await this.testRunner.run(testFilesToRun);

            // 计算运行时间
            const duration = Date.now() - startTime;
            this.stats.lastRunDuration = duration;

            // 更新统计
            if (results.failed === 0) {
                this.stats.successfulRuns++;
            } else {
                this.stats.failedRuns++;
            }

            this.updateAverageRunTime(duration);

            // 显示结果
            this.showResults(results, duration, analysis);

            // 更新变化检测器
            this.changeDetector.updateLastRunTimestamp();

            // 发送通知（如果启用）
            this.sendNotification(results, duration);

            this.emit('testComplete', { results, duration, analysis });

        } catch (error) {
            const duration = Date.now() - startTime;
            this.stats.failedRuns++;
            this.updateAverageRunTime(duration);

            console.error('❌ Test run failed:', error.message);

            this.emit('testError', { error, duration, analysis });
        }

        // 显示监控状态
        setTimeout(() => {
            this.showWatchStatus();
        }, 500);
    }

    /**
     * 显示欢迎信息
     */
    showWelcome() {
        console.log('👁️ ');
        console.log('📦 MiniTest Watch Mode');
        console.log('───────────────────────────────');
        console.log('💡 Press Ctrl+C to exit');
        console.log('🔄 Press r + Enter to run all tests');
        console.log('🧹 Press c + Enter to clear console');
        console.log('📊 Press s + Enter to show statistics');
        console.log('');
    }

    /**
     * 显示变化信息
     */
    showChangeInfo(changeInfo, analysis) {
        const timestamp = new Date().toLocaleTimeString();

        console.log(`[${timestamp}] 📝 File changed: ${changeInfo.relativePath}`);

        if (analysis.reason) {
            console.log(`📋 Strategy: ${analysis.reason}`);
        }

        if (analysis.affectedTests.length > 0) {
            console.log(`🎯 Affected tests: ${analysis.affectedTests.length}`);

            if (this.options.verbose) {
                analysis.affectedTests.forEach(test => {
                    const relativePath = require('path').relative(process.cwd(), test);
                    console.log(`   → ${relativePath}`);
                });
            }
        }

        console.log('');
    }

    /**
     * 显示运行信息
     */
    showRunInfo(analysis, runOptions) {
        const fileCount = runOptions.files ? runOptions.files.length : 0;
        const runType = analysis.runAll ? `all tests (${fileCount} files)` : `${analysis.affectedTests.length} tests`;
        const parallel = runOptions.parallel ? ' (parallel)' : '';

        console.log(`🧪 Running ${runType}${parallel}...`);

        if (analysis.estimatedTestTime > 0) {
            console.log(`⏱️ Estimated time: ${analysis.estimatedTestTime}ms`);
        }

        console.log('');
    }

    /**
     * 显示测试结果
     */
    showResults(results, duration, analysis) {
        const { passed, failed, total } = results;
        const emoji = failed === 0 ? '✅' : '❌';
        const status = failed === 0 ? 'PASSED' : 'FAILED';

        console.log('');
        console.log('──────────────── Results ────────────────');
        console.log(`${emoji} ${status}: ${passed}/${total} tests passed in ${duration}ms`);

        if (failed > 0) {
            console.log(`❌ Failed: ${failed}`);
        }

        // 显示运行统计
        console.log(`📊 Run #${this.runCount} (${this.stats.successfulRuns}✅ ${this.stats.failedRuns}❌)`);

        console.log('');
    }

    /**
     * 显示监控状态
     */
    showWatchStatus() {
        const watcherStats = this.fileWatcher.getStats();
        const detectorStats = this.changeDetector.getStats();

        console.log('👁️ Watching for changes...');
        console.log(`📁 Monitoring ${watcherStats.watchedFiles} files`);

        if (this.options.verbose) {
            console.log(`🧠 Smart detection: ${detectorStats.smartDetection ? 'ON' : 'OFF'}`);
            console.log(`💾 File hashing: ${detectorStats.hashingEnabled ? 'ON' : 'OFF'}`);
            console.log(`📈 Average run time: ${this.stats.averageRunTime}ms`);
        }

        console.log('');
    }

    /**
     * 显示最终统计
     */
    showFinalStats() {
        console.log('');
        console.log('────────────── Final Stats ──────────────');
        console.log(`🔢 Total runs: ${this.stats.totalRuns}`);
        console.log(`✅ Successful: ${this.stats.successfulRuns}`);
        console.log(`❌ Failed: ${this.stats.failedRuns}`);
        console.log(`📁 Files changed: ${this.stats.filesChanged}`);
        console.log(`⏱️ Average run time: ${this.stats.averageRunTime}ms`);
        console.log('');
        console.log('👋 Thanks for using MiniTest!');
    }

    /**
     * 发送通知
     */
    sendNotification(results, duration) {
        if (!this.options.showNotifications) {
            return;
        }

        const shouldNotify = (results.failed === 0 && this.options.notifyOnSuccess) ||
            (results.failed > 0 && this.options.notifyOnFailure);

        if (shouldNotify) {
            // 这里可以集成桌面通知系统
            // 目前只在控制台显示
            const status = results.failed === 0 ? '✅ Tests Passed' : '❌ Tests Failed';
            console.log(`🔔 ${status} (${duration}ms)`);
        }
    }

    /**
     * 更新平均运行时间
     */
    updateAverageRunTime(duration) {
        if (this.stats.totalRuns === 1) {
            this.stats.averageRunTime = duration;
        } else {
            this.stats.averageRunTime = Math.round(
                (this.stats.averageRunTime * (this.stats.totalRuns - 1) + duration) / this.stats.totalRuns
            );
        }
    }

    /**
     * 清屏
     */
    clearConsole() {
        // Windows 和 Unix 兼容的清屏
        process.stdout.write('\x1b[2J\x1b[0f');
    }

    /**
     * 手动触发测试运行
     */
    async runAllTests() {
        if (!this.isRunning) {
            console.log('⚠️ Watch mode is not running');
            return;
        }

        console.log('🔄 Manually running all tests...');

        const analysis = {
            runAll: true,
            reason: 'Manual trigger',
            affectedTests: [],
            estimatedTestTime: 0
        };

        await this.runTests(analysis);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            runCount: this.runCount,
            watcher: this.fileWatcher.getStats(),
            detector: this.changeDetector.getStats()
        };
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.changeDetector.clearCache();
        console.log('🧹 Watch mode cache cleared');
    }
}

module.exports = WatchMode;
