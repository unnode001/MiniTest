/**
 * 变化检测器
 * 智能分析文件变化并决定运行哪些测试
 */

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

class ChangeDetector {
    constructor(options = {}) {
        this.options = {
            // 文件哈希缓存文件
            cacheFile: '.minitest-cache.json',
            // 是否启用智能检测
            smartDetection: true,
            // 是否缓存文件内容哈希
            enableHashing: true,
            // 依赖分析深度
            dependencyDepth: 3,
            ...options
        };

        this.fileHashes = new Map();
        this.dependencyGraph = new Map();
        this.testMappings = new Map();
        this.lastRunTimestamp = new Date();

        this.loadCache();
        this.initializeMappings();
    }

    /**
     * 加载缓存
     */
    loadCache() {
        try {
            const cacheFile = path.resolve(process.cwd(), this.options.cacheFile);
            if (fs.existsSync(cacheFile)) {
                const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

                if (cache.fileHashes) {
                    this.fileHashes = new Map(Object.entries(cache.fileHashes));
                }

                if (cache.dependencyGraph) {
                    this.dependencyGraph = new Map(Object.entries(cache.dependencyGraph));
                }

                if (cache.testMappings) {
                    this.testMappings = new Map(Object.entries(cache.testMappings));
                }

                if (cache.lastRunTimestamp) {
                    this.lastRunTimestamp = new Date(cache.lastRunTimestamp);
                }

                console.log('📋 Loaded change detection cache');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load cache:', error.message);
            this.fileHashes.clear();
            this.dependencyGraph.clear();
            this.testMappings.clear();
        }
    }

    /**
     * 保存缓存
     */
    saveCache() {
        try {
            const cache = {
                fileHashes: Object.fromEntries(this.fileHashes),
                dependencyGraph: Object.fromEntries(this.dependencyGraph),
                testMappings: Object.fromEntries(this.testMappings),
                lastRunTimestamp: this.lastRunTimestamp.toISOString(),
                version: '1.0.0'
            };

            const cacheFile = path.resolve(process.cwd(), this.options.cacheFile);
            fs.writeFileSync(cacheFile, JSON.stringify(cache, null, 2));

        } catch (error) {
            console.warn('⚠️ Failed to save cache:', error.message);
        }
    }

    /**
     * 初始化测试映射
     */
    initializeMappings() {
        // 这里可以根据项目结构自动发现测试映射
        // 目前使用简单的命名约定映射
    }

    /**
     * 分析文件变化
     * @param {Object} changeInfo 文件变化信息
     * @returns {Object} 分析结果
     */
    async analyzeChange(changeInfo) {
        const { filePath, eventType } = changeInfo;

        console.log(`🔍 Analyzing change: ${path.relative(process.cwd(), filePath)} (${eventType})`);

        const analysis = {
            changedFile: filePath,
            eventType,
            timestamp: new Date(),
            hasContentChanged: false,
            affectedTests: [],
            runAll: false,
            reason: '',
            dependencies: [],
            estimatedTestTime: 0
        };

        try {
            // 检查文件是否真的发生了内容变化
            if (this.options.enableHashing && fs.existsSync(filePath)) {
                const hasContentChanged = await this.hasFileContentChanged(filePath);
                analysis.hasContentChanged = hasContentChanged;

                if (!hasContentChanged) {
                    analysis.reason = 'File content unchanged (only metadata changed)';
                    analysis.affectedTests = [];
                    return analysis;
                }
            } else {
                analysis.hasContentChanged = true;
            }

            // 智能检测受影响的测试
            if (this.options.smartDetection) {
                analysis.affectedTests = await this.findAffectedTests(filePath);
                analysis.dependencies = await this.analyzeDependencies(filePath);
            } else {
                // 简单策略：运行所有测试
                analysis.runAll = true;
                analysis.reason = 'Smart detection disabled - running all tests';
            }

            // 估算测试运行时间
            analysis.estimatedTestTime = this.estimateTestTime(analysis.affectedTests);

            // 确定运行策略
            this.determineRunStrategy(analysis);

        } catch (error) {
            console.warn('⚠️ Error analyzing change:', error.message);
            analysis.runAll = true;
            analysis.reason = `Analysis failed: ${error.message}`;
        }

        return analysis;
    }

    /**
     * 检查文件内容是否真的发生了变化
     */
    async hasFileContentChanged(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const currentHash = crypto.createHash('md5').update(content).digest('hex');
            const previousHash = this.fileHashes.get(filePath);

            this.fileHashes.set(filePath, currentHash);

            return currentHash !== previousHash;
        } catch (error) {
            console.warn(`⚠️ Error checking file hash for ${filePath}:`, error.message);
            return true; // 出错时假设文件已变化
        }
    }

    /**
     * 查找受影响的测试文件
     */
    async findAffectedTests(changedFile) {
        const affectedTests = new Set();

        // 1. 如果变化的是测试文件，直接包含它
        if (this.isTestFile(changedFile)) {
            affectedTests.add(changedFile);
        }

        // 2. 查找直接测试该文件的测试
        const directTests = this.findDirectTests(changedFile);
        directTests.forEach(test => affectedTests.add(test));

        // 3. 通过依赖关系查找间接受影响的测试
        const indirectTests = await this.findIndirectTests(changedFile);
        indirectTests.forEach(test => affectedTests.add(test));

        // 4. 特殊文件处理
        if (this.isConfigFile(changedFile)) {
            // 配置文件变化 - 运行所有测试
            return this.getAllTestFiles();
        }

        if (this.isPackageFile(changedFile)) {
            // package.json 变化 - 运行所有测试
            return this.getAllTestFiles();
        }

        return Array.from(affectedTests);
    }

    /**
     * 查找直接测试某个文件的测试
     */
    findDirectTests(sourceFile) {
        const tests = [];
        const baseName = path.basename(sourceFile, path.extname(sourceFile));
        const sourceDir = path.dirname(sourceFile);

        // 命名约定映射
        const possibleTestPaths = [
            // 同目录下的测试文件
            path.join(sourceDir, `${baseName}.test.js`),
            path.join(sourceDir, `${baseName}.spec.js`),

            // test 目录下的测试文件
            path.join(process.cwd(), 'test', path.relative(path.join(process.cwd(), 'src'), sourceFile).replace(/\.js$/, '.test.js')),
            path.join(process.cwd(), 'tests', path.relative(path.join(process.cwd(), 'src'), sourceFile).replace(/\.js$/, '.test.js')),

            // __tests__ 目录
            path.join(sourceDir, '__tests__', `${baseName}.test.js`),
            path.join(sourceDir, '__tests__', `${baseName}.spec.js`)
        ];

        for (const testPath of possibleTestPaths) {
            if (fs.existsSync(testPath)) {
                tests.push(testPath);
            }
        }

        return tests;
    }

    /**
     * 通过依赖关系查找间接受影响的测试
     */
    async findIndirectTests(changedFile) {
        const indirectTests = new Set();

        // 查找依赖该文件的其他文件
        const dependents = this.findDependents(changedFile);

        for (const dependent of dependents) {
            // 为每个依赖文件查找其测试
            const tests = this.findDirectTests(dependent);
            tests.forEach(test => indirectTests.add(test));

            // 如果依赖文件本身就是测试文件
            if (this.isTestFile(dependent)) {
                indirectTests.add(dependent);
            }
        }

        return Array.from(indirectTests);
    }

    /**
     * 查找依赖某个文件的其他文件
     */
    findDependents(targetFile) {
        const dependents = [];

        // 这里可以实现更复杂的依赖分析
        // 目前使用简单的缓存查找
        for (const [file, deps] of this.dependencyGraph) {
            if (deps && deps.includes(targetFile)) {
                dependents.push(file);
            }
        }

        return dependents;
    }

    /**
     * 分析文件依赖关系
     */
    async analyzeDependencies(filePath) {
        if (!fs.existsSync(filePath)) {
            return [];
        }

        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const dependencies = [];

            // 简单的 require/import 分析
            const requireRegex = /require\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g;
            const importRegex = /import\s+.*\s+from\s+['"`]([^'"`]+)['"`]/g;

            let match;

            // 查找 require 语句
            while ((match = requireRegex.exec(content)) !== null) {
                const depPath = this.resolveDependencyPath(match[1], filePath);
                if (depPath) {
                    dependencies.push(depPath);
                }
            }

            // 查找 import 语句
            while ((match = importRegex.exec(content)) !== null) {
                const depPath = this.resolveDependencyPath(match[1], filePath);
                if (depPath) {
                    dependencies.push(depPath);
                }
            }

            // 缓存依赖关系
            this.dependencyGraph.set(filePath, dependencies);

            return dependencies;
        } catch (error) {
            console.warn(`⚠️ Error analyzing dependencies for ${filePath}:`, error.message);
            return [];
        }
    }

    /**
     * 解析依赖路径
     */
    resolveDependencyPath(depString, fromFile) {
        // 跳过 node_modules 包
        if (!depString.startsWith('.')) {
            return null;
        }

        try {
            const fromDir = path.dirname(fromFile);
            let resolved = path.resolve(fromDir, depString);

            // 尝试添加 .js 扩展名
            if (!path.extname(resolved)) {
                const jsPath = resolved + '.js';
                if (fs.existsSync(jsPath)) {
                    resolved = jsPath;
                } else {
                    // 尝试 index.js
                    const indexPath = path.join(resolved, 'index.js');
                    if (fs.existsSync(indexPath)) {
                        resolved = indexPath;
                    }
                }
            }

            return fs.existsSync(resolved) ? resolved : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 估算测试运行时间
     */
    estimateTestTime(testFiles) {
        // 简单估算：每个测试文件 100ms
        return testFiles.length * 100;
    }

    /**
     * 确定运行策略
     */
    determineRunStrategy(analysis) {
        const { affectedTests, estimatedTestTime } = analysis;

        if (affectedTests.length === 0) {
            analysis.runAll = true;
            analysis.reason = 'No specific tests found - running all tests';
        } else if (affectedTests.length === 1) {
            analysis.reason = 'Running single affected test';
        } else if (estimatedTestTime > 5000) {
            // 如果估算时间超过 5 秒，考虑优化
            analysis.reason = `Running ${affectedTests.length} affected tests (estimated ${estimatedTestTime}ms)`;
        } else {
            analysis.reason = `Running ${affectedTests.length} affected tests`;
        }
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
     * 判断是否为配置文件
     */
    isConfigFile(filePath) {
        const fileName = path.basename(filePath);
        const configFiles = [
            'minitest.config.js',
            'package.json',
            '.gitignore',
            'jest.config.js',
            'mocha.opts'
        ];
        return configFiles.includes(fileName);
    }

    /**
     * 判断是否为 package 文件
     */
    isPackageFile(filePath) {
        return path.basename(filePath) === 'package.json';
    }

    /**
     * 获取所有测试文件
     */
    getAllTestFiles() {
        const glob = require('glob');

        const testPatterns = [
            'test/**/*.test.js',
            'test/**/*.spec.js',
            '**/__tests__/**/*.js',
            'tests/**/*.js'
        ];

        const allTests = new Set();

        for (const pattern of testPatterns) {
            const files = glob.sync(pattern, {
                cwd: process.cwd(),
                ignore: ['node_modules/**'],
                absolute: true
            });

            files.forEach(file => allTests.add(file));
        }

        return Array.from(allTests);
    }

    /**
     * 更新最后运行时间
     */
    updateLastRunTimestamp() {
        this.lastRunTimestamp = new Date();
        this.saveCache();
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            cachedFiles: this.fileHashes.size,
            dependencyMappings: this.dependencyGraph.size,
            testMappings: this.testMappings.size,
            lastRunTimestamp: this.lastRunTimestamp,
            smartDetection: this.options.smartDetection,
            hashingEnabled: this.options.enableHashing
        };
    }

    /**
     * 清理缓存
     */
    clearCache() {
        this.fileHashes.clear();
        this.dependencyGraph.clear();
        this.testMappings.clear();

        try {
            const cacheFile = path.resolve(process.cwd(), this.options.cacheFile);
            if (fs.existsSync(cacheFile)) {
                fs.unlinkSync(cacheFile);
            }
            console.log('🧹 Cache cleared');
        } catch (error) {
            console.warn('⚠️ Failed to clear cache file:', error.message);
        }
    }
}

module.exports = ChangeDetector;
