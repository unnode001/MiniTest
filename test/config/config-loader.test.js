/**
 * 配置系统测试
 */

const path = require('path');
const fs = require('fs');
const ConfigLoader = require('../../src/config/loader');

describe('配置系统测试', () => {
    let configLoader;
    let tempConfigFile;

    beforeEach(() => {
        configLoader = new ConfigLoader();
        tempConfigFile = null;
    });

    afterEach(() => {
        // 清理临时配置文件
        if (tempConfigFile && fs.existsSync(tempConfigFile)) {
            fs.unlinkSync(tempConfigFile);
        }

        // 清理require缓存
        Object.keys(require.cache).forEach(key => {
            if (key.includes('test-config')) {
                delete require.cache[key];
            }
        });
    });    test('应该加载默认配置', () => {
        // 传入不存在的配置文件路径，确保使用默认配置
        const config = configLoader.load('non-existent-config.js');
        
        assert.equal(config.parallel, false);
        assert.equal(config.timeout, 5000);
        assert.deepEqual(config.reporters, ['console']);
        assert.equal(config.coverage.enabled, false);
        assert.equal(config.watch.enabled, false);
    });

    test('应该加载JavaScript配置文件', () => {
        // 创建临时配置文件
        tempConfigFile = path.join(__dirname, 'test-config.js');
        const configContent = `
        module.exports = {
            parallel: true,
            maxWorkers: 8,
            timeout: 10000,
            reporters: ['console', 'html'],
            coverage: {
                enabled: true,
                threshold: { lines: 90 }
            }
        };
        `;
        fs.writeFileSync(tempConfigFile, configContent);

        const config = configLoader.load(tempConfigFile);

        assert.equal(config.parallel, true);
        assert.equal(config.maxWorkers, 8);
        assert.equal(config.timeout, 10000);
        assert.deepEqual(config.reporters, ['console', 'html']);
        assert.equal(config.coverage.enabled, true);
        assert.equal(config.coverage.threshold.lines, 90);
    });

    test('应该加载JSON配置文件', () => {
        // 创建临时JSON配置文件
        tempConfigFile = path.join(__dirname, 'test-config.json');
        const configContent = {
            parallel: true,
            timeout: 8000,
            reporters: ['xml'],
            watch: { enabled: true }
        };
        fs.writeFileSync(tempConfigFile, JSON.stringify(configContent, null, 2));

        const config = configLoader.load(tempConfigFile);

        assert.equal(config.parallel, true);
        assert.equal(config.timeout, 8000);
        assert.deepEqual(config.reporters, ['xml']);
        assert.equal(config.watch.enabled, true);
    });

    test('应该合并CLI参数', () => {
        const baseConfig = configLoader.load();
        const cliArgs = {
            parallel: true,
            timeout: 15000,
            coverage: true,
            reporter: 'json',
            verbose: true
        };

        const merged = configLoader.mergeWithCliArgs(baseConfig, cliArgs);

        assert.equal(merged.parallel, true);
        assert.equal(merged.timeout, 15000);
        assert.equal(merged.coverage.enabled, true);
        assert.deepEqual(merged.reporters, ['json']);
        assert.equal(merged.reporterOptions.console.verbose, true);
    });

    test('应该验证配置的有效性', () => {
        const invalidConfigs = [
            { parallel: 'yes' },
            { maxWorkers: -1 },
            { timeout: 'forever' },
            { testMatch: 'not-array' },
            { reporters: 'console' },
            { coverage: { threshold: { lines: 150 } } }
        ];

        invalidConfigs.forEach(invalidConfig => {
            assert.throws(() => {
                configLoader.validateConfig(invalidConfig);
            });
        });
    });

    test('应该深度合并嵌套配置', () => {
        const target = {
            coverage: {
                enabled: false,
                threshold: { lines: 80, functions: 70 }
            },
            reporterOptions: {
                console: { colors: true }
            }
        };

        const source = {
            coverage: {
                enabled: true,
                threshold: { lines: 90 }
            },
            reporterOptions: {
                html: { outputFile: 'custom.html' }
            }
        };

        configLoader.mergeConfig(target, source);

        // 验证深度合并结果
        assert.equal(target.coverage.enabled, true);
        assert.equal(target.coverage.threshold.lines, 90);
        assert.equal(target.coverage.threshold.functions, 70); // 保持原值
        assert.equal(target.reporterOptions.console.colors, true); // 保持原值
        assert.equal(target.reporterOptions.html.outputFile, 'custom.html');
    });

    test('应该查找标准配置文件', () => {
        // 测试不存在的配置文件
        const notFound = configLoader.findConfigFile('non-existent.js');
        assert.equal(notFound, null);

        // 创建一个标准配置文件来测试查找
        const standardConfigFile = path.join(process.cwd(), 'minitest.config.js');
        const originalExists = fs.existsSync(standardConfigFile);

        if (!originalExists) {
            fs.writeFileSync(standardConfigFile, 'module.exports = {};');
            tempConfigFile = standardConfigFile;
        }

        const found = configLoader.findConfigFile();
        assert.equal(typeof found, 'string');
        assert.true(found.endsWith('minitest.config.js'));

        if (!originalExists && tempConfigFile) {
            fs.unlinkSync(tempConfigFile);
            tempConfigFile = null;
        }
    });

    test('应该处理配置文件加载错误', () => {
        // 测试语法错误的JS文件
        tempConfigFile = path.join(__dirname, 'invalid-config.js');
        fs.writeFileSync(tempConfigFile, 'module.exports = { invalid: syntax }');

        // 应该返回默认配置而不是抛出错误
        const config = configLoader.load(tempConfigFile);
        assert.equal(config.timeout, 5000); // 默认值
    });

    test('应该支持数组形式的reporters参数', () => {
        const config = configLoader.load();
        const cliArgs = { reporter: ['console', 'html', 'xml'] };

        const merged = configLoader.mergeWithCliArgs(config, cliArgs);
        assert.deepEqual(merged.reporters, ['console', 'html', 'xml']);
    });

    test('应该正确设置输出文件路径', () => {
        const config = configLoader.load();
        const cliArgs = {
            htmlOut: 'custom/report.html',
            xmlOut: 'results/junit.xml',
            jsonOut: 'data/results.json',
            coverageDir: 'custom-coverage'
        };

        const merged = configLoader.mergeWithCliArgs(config, cliArgs);
        assert.equal(merged.reporterOptions.html.outputFile, 'custom/report.html');
        assert.equal(merged.reporterOptions.xml.outputFile, 'results/junit.xml');
        assert.equal(merged.reporterOptions.json.outputFile, 'data/results.json');
        assert.equal(merged.coverage.dir, 'custom-coverage');
    });
});
