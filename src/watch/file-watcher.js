/**
 * 文件监控器
 * 监控文件系统变化并触发测试重新运行
 */

const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');
const glob = require('glob');

class FileWatcher extends EventEmitter {
    constructor(options = {}) {
        super();

        this.options = {
            // 监控的文件扩展名
            extensions: ['.js', '.ts', '.json'],
            // 忽略的目录和文件
            ignore: ['node_modules/**', 'coverage/**', '**/*.log', '.git/**'],
            // 防抖延迟（毫秒）
            debounce: 100,
            // 是否监控测试文件
            watchTests: true,
            // 是否监控源文件
            watchSources: true,
            // 监控的根目录
            cwd: process.cwd(),
            ...options
        };

        this.watchers = new Map();
        this.debounceTimers = new Map();
        this.isRunning = false;
        this.watchedFiles = new Set();
        this.stats = {
            filesWatched: 0,
            changesDetected: 0,
            lastChange: null
        };
    }

    /**
     * 开始监控
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️ File watcher is already running');
            return;
        }

        console.log('👀 Starting file watcher...');
        this.isRunning = true;

        try {
            // 收集需要监控的文件
            const filesToWatch = await this.collectFiles();

            // 开始监控文件
            for (const filePath of filesToWatch) {
                this.watchFile(filePath);
            }

            // 监控目录变化（新文件创建）
            this.watchDirectories();

            this.stats.filesWatched = this.watchedFiles.size;

            console.log(`👁️ Watching ${this.stats.filesWatched} files for changes...`);
            console.log('💡 Press Ctrl+C to stop watching');

            this.emit('started', {
                filesWatched: this.stats.filesWatched,
                extensions: this.options.extensions
            });

        } catch (error) {
            console.error('❌ Failed to start file watcher:', error.message);
            this.isRunning = false;
            throw error;
        }
    }

    /**
     * 停止监控
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        console.log('🛑 Stopping file watcher...');
        this.isRunning = false;

        // 清理所有定时器
        for (const timer of this.debounceTimers.values()) {
            clearTimeout(timer);
        }
        this.debounceTimers.clear();

        // 关闭所有文件监控器
        for (const watcher of this.watchers.values()) {
            watcher.close();
        }
        this.watchers.clear();
        this.watchedFiles.clear();

        console.log('✅ File watcher stopped');
        this.emit('stopped');
    }

    /**
     * 收集需要监控的文件
     */
    async collectFiles() {
        const files = new Set();

        // 收集源文件
        if (this.options.watchSources) {
            const sourcePatterns = [
                'src/**/*',
                'lib/**/*',
                '*.js',
                '*.ts'
            ];

            for (const pattern of sourcePatterns) {
                const matchedFiles = glob.sync(pattern, {
                    cwd: this.options.cwd,
                    ignore: this.options.ignore,
                    nodir: true
                });

                matchedFiles.forEach(file => {
                    if (this.shouldWatch(file)) {
                        files.add(path.resolve(this.options.cwd, file));
                    }
                });
            }
        }

        // 收集测试文件
        if (this.options.watchTests) {
            const testPatterns = [
                'test/**/*.test.js',
                'test/**/*.spec.js',
                '**/__tests__/**/*.js',
                'tests/**/*.js'
            ];

            for (const pattern of testPatterns) {
                const matchedFiles = glob.sync(pattern, {
                    cwd: this.options.cwd,
                    ignore: this.options.ignore,
                    nodir: true
                });

                matchedFiles.forEach(file => {
                    if (this.shouldWatch(file)) {
                        files.add(path.resolve(this.options.cwd, file));
                    }
                });
            }
        }

        return Array.from(files);
    }

    /**
     * 判断文件是否需要监控
     */
    shouldWatch(filePath) {
        const ext = path.extname(filePath);
        return this.options.extensions.includes(ext);
    }

    /**
     * 监控单个文件
     */
    watchFile(filePath) {
        if (this.watchers.has(filePath)) {
            return; // 已经在监控
        }

        try {
            const watcher = fs.watch(filePath, (eventType) => {
                this.handleFileChange(filePath, eventType);
            });

            watcher.on('error', (error) => {
                console.warn(`⚠️ Error watching ${filePath}:`, error.message);
                this.watchers.delete(filePath);
                this.watchedFiles.delete(filePath);
            });

            this.watchers.set(filePath, watcher);
            this.watchedFiles.add(filePath);

        } catch (error) {
            console.warn(`⚠️ Cannot watch ${filePath}:`, error.message);
        }
    }

    /**
     * 监控目录变化
     */
    watchDirectories() {
        const dirsToWatch = [
            'src',
            'test',
            'tests',
            'lib'
        ];

        for (const dir of dirsToWatch) {
            const dirPath = path.resolve(this.options.cwd, dir);

            if (fs.existsSync(dirPath)) {
                this.watchDirectory(dirPath);
            }
        }
    }

    /**
     * 监控目录
     */
    watchDirectory(dirPath) {
        try {
            const watcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
                if (filename) {
                    const fullPath = path.resolve(dirPath, filename);

                    if (eventType === 'rename' && fs.existsSync(fullPath)) {
                        // 新文件创建
                        if (this.shouldWatch(fullPath) && !this.watchedFiles.has(fullPath)) {
                            console.log(`📁 New file detected: ${filename}`);
                            this.watchFile(fullPath);
                            this.handleFileChange(fullPath, 'created');
                        }
                    }
                }
            });

            watcher.on('error', (error) => {
                console.warn(`⚠️ Error watching directory ${dirPath}:`, error.message);
            });

            this.watchers.set(`dir:${dirPath}`, watcher);

        } catch (error) {
            console.warn(`⚠️ Cannot watch directory ${dirPath}:`, error.message);
        }
    }

    /**
     * 处理文件变化
     */
    handleFileChange(filePath, eventType) {
        if (!this.isRunning) {
            return;
        }

        const relativePath = path.relative(this.options.cwd, filePath);
        this.stats.changesDetected++;
        this.stats.lastChange = new Date();

        // 防抖处理
        const timerId = this.debounceTimers.get(filePath);
        if (timerId) {
            clearTimeout(timerId);
        }

        const newTimerId = setTimeout(() => {
            this.debounceTimers.delete(filePath);
            this.processFileChange(filePath, relativePath, eventType);
        }, this.options.debounce);

        this.debounceTimers.set(filePath, newTimerId);
    }

    /**
     * 处理文件变化（防抖后）
     */
    processFileChange(filePath, relativePath, eventType) {
        console.log(`📝 File changed: ${relativePath} (${eventType})`);

        // 确定变化类型
        const changeInfo = {
            filePath,
            relativePath,
            eventType,
            timestamp: new Date(),
            isTestFile: this.isTestFile(filePath),
            isSourceFile: this.isSourceFile(filePath)
        };

        // 查找相关的测试文件
        const relatedTests = this.findRelatedTests(filePath);
        if (relatedTests.length > 0) {
            changeInfo.relatedTests = relatedTests;
        }

        this.emit('change', changeInfo);
    }

    /**
     * 判断是否为测试文件
     */
    isTestFile(filePath) {
        const fileName = path.basename(filePath);
        return fileName.includes('.test.') ||
            fileName.includes('.spec.') ||
            filePath.includes('__tests__') ||
            filePath.includes('/test/') ||
            filePath.includes('/tests/');
    }

    /**
     * 判断是否为源文件
     */
    isSourceFile(filePath) {
        return !this.isTestFile(filePath) &&
            (filePath.includes('/src/') ||
                filePath.includes('/lib/') ||
                path.extname(filePath) === '.js' ||
                path.extname(filePath) === '.ts');
    }

    /**
     * 查找相关的测试文件
     */
    findRelatedTests(changedFile) {
        const relatedTests = [];

        if (this.isTestFile(changedFile)) {
            // 如果是测试文件，直接返回自己
            relatedTests.push(changedFile);
        } else {
            // 如果是源文件，查找对应的测试文件
            const baseName = path.basename(changedFile, path.extname(changedFile));
            const possibleTestNames = [
                `${baseName}.test.js`,
                `${baseName}.spec.js`,
                `${baseName}.test.ts`,
                `${baseName}.spec.ts`
            ];

            for (const testName of possibleTestNames) {
                for (const watchedFile of this.watchedFiles) {
                    if (path.basename(watchedFile) === testName) {
                        relatedTests.push(watchedFile);
                    }
                }
            }

            // 如果没找到直接对应的测试，返回所有测试文件（保守策略）
            if (relatedTests.length === 0) {
                for (const watchedFile of this.watchedFiles) {
                    if (this.isTestFile(watchedFile)) {
                        relatedTests.push(watchedFile);
                    }
                }
            }
        }

        return relatedTests;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            watchedFiles: this.watchedFiles.size,
            activeWatchers: this.watchers.size
        };
    }

    /**
     * 手动触发测试运行
     */
    triggerTests(reason = 'manual') {
        console.log(`🔄 Triggering tests (${reason})...`);

        this.emit('change', {
            filePath: null,
            relativePath: null,
            eventType: 'manual',
            timestamp: new Date(),
            isTestFile: false,
            isSourceFile: false,
            relatedTests: Array.from(this.watchedFiles).filter(f => this.isTestFile(f))
        });
    }
}

module.exports = FileWatcher;
