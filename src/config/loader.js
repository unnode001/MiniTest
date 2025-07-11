/**
 * 配置文件加载器
 * 支持 minitest.config.js 和命令行参数合并
 */

const fs = require('fs');
const path = require('path');

class ConfigLoader {
    constructor() {
        this.defaultConfig = {
            // 核心配置
            parallel: false,
            maxWorkers: require('os').cpus().length,
            timeout: 5000,

            // 文件匹配
            testMatch: ['test/**/*.test.js', '**/*.test.js'],
            ignore: ['node_modules/**', 'coverage/**', 'build/**'],

            // 监控模式
            watch: {
                enabled: false,
                ignore: ['node_modules/**', 'coverage/**'],
                extensions: ['.js', '.ts', '.json'],
                debounce: 100
            },

            // 覆盖率配置
            coverage: {
                enabled: false,
                dir: 'coverage',
                threshold: {
                    lines: 80,
                    functions: 80,
                    branches: 80,
                    statements: 80
                },
                exclude: ['test/**', 'coverage/**', '**/*.test.js']
            },

            // 报告器配置
            reporters: ['console'],
            reporterOptions: {
                console: { colors: true, verbose: false },
                html: { outputFile: 'coverage/index.html' },
                xml: { outputFile: 'test-results.xml' },
                json: { outputFile: 'test-results.json' }
            },

            // Mock配置
            mock: {
                clearMocks: true,
                restoreMocks: true,
                resetMocks: false
            },

            // 性能配置
            performance: {
                benchmark: false,
                timeout: 10000,
                samples: 10
            }
        };
    }

    /**
     * 加载配置文件
     * @param {string} configPath - 配置文件路径
     * @returns {Object} 配置对象
     */
    load(configPath = null) {
        const config = { ...this.defaultConfig };

        // 查找配置文件
        const configFile = this.findConfigFile(configPath);

        if (configFile) {
            try {
                const userConfig = this.loadConfigFile(configFile);
                this.mergeConfig(config, userConfig);
                console.log(`📝 Loaded config from: ${configFile}`);
            } catch (error) {
                console.warn(`⚠️ Warning: Failed to load config file ${configFile}: ${error.message}`);
            }
        }

        return this.validateConfig(config);
    }

    /**
     * 查找配置文件
     * @param {string} specifiedPath - 指定的配置文件路径
     * @returns {string|null} 配置文件路径
     */
    findConfigFile(specifiedPath) {
        if (specifiedPath) {
            return fs.existsSync(specifiedPath) ? path.resolve(specifiedPath) : null;
        }

        const configFiles = [
            'minitest.config.js',
            'minitest.config.json',
            '.minitestrc.js',
            '.minitestrc.json'
        ];

        for (const fileName of configFiles) {
            const filePath = path.resolve(process.cwd(), fileName);
            if (fs.existsSync(filePath)) {
                return filePath;
            }
        }

        return null;
    }

    /**
     * 加载配置文件内容
     * @param {string} configFile - 配置文件路径
     * @returns {Object} 配置对象
     */
    loadConfigFile(configFile) {
        const ext = path.extname(configFile);

        if (ext === '.js') {
            // 清除require缓存确保获取最新配置
            delete require.cache[require.resolve(configFile)];
            return require(configFile);
        } else if (ext === '.json') {
            const content = fs.readFileSync(configFile, 'utf8');
            return JSON.parse(content);
        }

        throw new Error(`Unsupported config file type: ${ext}`);
    }

    /**
     * 深度合并配置对象
     * @param {Object} target - 目标配置
     * @param {Object} source - 源配置
     */
    mergeConfig(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    this.mergeConfig(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
    }

    /**
     * 验证配置的有效性
     * @param {Object} config - 配置对象
     * @returns {Object} 验证后的配置
     */
    validateConfig(config) {
        // 验证基本类型
        if (typeof config.parallel !== 'boolean') {
            throw new Error('config.parallel must be a boolean');
        }

        if (typeof config.maxWorkers !== 'number' || config.maxWorkers < 1) {
            throw new Error('config.maxWorkers must be a positive number');
        }

        if (typeof config.timeout !== 'number' || config.timeout < 0) {
            throw new Error('config.timeout must be a non-negative number');
        }

        // 验证数组类型
        if (!Array.isArray(config.testMatch)) {
            throw new Error('config.testMatch must be an array');
        }

        if (!Array.isArray(config.reporters)) {
            throw new Error('config.reporters must be an array');
        }

        // 验证覆盖率阈值
        if (config.coverage && config.coverage.threshold) {
            const threshold = config.coverage.threshold;
            for (const key of ['lines', 'functions', 'branches', 'statements']) {
                if (threshold[key] !== undefined) {
                    if (typeof threshold[key] !== 'number' || threshold[key] < 0 || threshold[key] > 100) {
                        throw new Error(`config.coverage.threshold.${key} must be a number between 0 and 100`);
                    }
                }
            }
        }

        return config;
    }

    /**
     * 与命令行参数合并
     * @param {Object} config - 基础配置
     * @param {Object} cliArgs - 命令行参数
     * @returns {Object} 合并后的配置
     */
    mergeWithCliArgs(config, cliArgs) {
        const merged = { ...config };

        // CLI参数优先级高于配置文件
        if (cliArgs.parallel !== undefined) merged.parallel = cliArgs.parallel;
        if (cliArgs.maxWorkers !== undefined) merged.maxWorkers = cliArgs.maxWorkers;
        if (cliArgs.timeout !== undefined) merged.timeout = cliArgs.timeout;
        if (cliArgs.coverage !== undefined) merged.coverage.enabled = cliArgs.coverage;
        if (cliArgs.watch !== undefined) merged.watch.enabled = cliArgs.watch;
        if (cliArgs.reporter !== undefined) {
            merged.reporters = Array.isArray(cliArgs.reporter) ? cliArgs.reporter : [cliArgs.reporter];
        }

        // 输出文件配置
        if (cliArgs.htmlOut) merged.reporterOptions.html.outputFile = cliArgs.htmlOut;
        if (cliArgs.xmlOut) merged.reporterOptions.xml.outputFile = cliArgs.xmlOut;
        if (cliArgs.jsonOut) merged.reporterOptions.json.outputFile = cliArgs.jsonOut;
        if (cliArgs.coverageDir) merged.coverage.dir = cliArgs.coverageDir;

        // 颜色和详细输出
        if (cliArgs.colors !== undefined) merged.reporterOptions.console.colors = cliArgs.colors;
        if (cliArgs.verbose !== undefined) merged.reporterOptions.console.verbose = cliArgs.verbose;

        return merged;
    }

    /**
     * 显示当前配置信息
     * @param {Object} config - 配置对象
     */
    displayConfig(config) {
        console.log('\n📋 Current Configuration:');
        console.log(`  Parallel: ${config.parallel} (${config.maxWorkers} workers)`);
        console.log(`  Timeout: ${config.timeout}ms`);
        console.log(`  Coverage: ${config.coverage.enabled}`);
        console.log(`  Watch: ${config.watch.enabled}`);
        console.log(`  Reporters: ${config.reporters.join(', ')}`);
        console.log(`  Test Match: ${config.testMatch.join(', ')}`);
        console.log('');
    }
}

module.exports = ConfigLoader;
