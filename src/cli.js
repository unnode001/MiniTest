#!/usr/bin/env node

const { program } = require('commander');
const glob = require('glob');
const path = require('path');
const { TestRunner } = require('./core/test-runner');
const { ConsoleReporter } = require('./reporters/console');
const { HtmlReporter } = require('./reporters/html');
const { XmlReporter } = require('./reporters/xml');
const ConfigLoader = require('./config/loader');

program
    .version('1.0.0')
    .description('MiniTest - A lightweight JavaScript testing framework')
    .argument('[pattern]', 'Test file pattern (overrides config)')
    .option('-c, --config <path>', 'Path to config file')
    .option('-r, --reporter <type>', 'Reporter type (console, json, html, xml)')
    .option('-v, --verbose', 'Verbose output')
    .option('-t, --timeout <ms>', 'Test timeout in milliseconds')
    .option('--no-colors', 'Disable colored output')
    .option('--coverage', 'Enable code coverage')
    .option('--coverage-dir <dir>', 'Coverage output directory')
    .option('--html-out <file>', 'HTML report output file')
    .option('--xml-out <file>', 'XML report output file')
    .option('--json-out <file>', 'JSON report output file')
    .option('--parallel', 'Enable parallel test execution')
    .option('--max-workers <num>', 'Maximum number of worker processes')
    .option('--watch', 'Enable watch mode')
    .option('--show-config', 'Display current configuration and exit')
    .action(async (pattern, options) => {
        try {
            // 加载配置文件
            const configLoader = new ConfigLoader();
            const config = configLoader.load(options.config);

            // 合并CLI参数
            const finalConfig = configLoader.mergeWithCliArgs(config, {
                parallel: options.parallel,
                maxWorkers: options.maxWorkers ? parseInt(options.maxWorkers) : undefined,
                timeout: options.timeout ? parseInt(options.timeout) : undefined,
                coverage: options.coverage,
                watch: options.watch,
                reporter: options.reporter,
                htmlOut: options.htmlOut,
                xmlOut: options.xmlOut,
                jsonOut: options.jsonOut,
                coverageDir: options.coverageDir,
                colors: options.colors,
                verbose: options.verbose
            });

            // 显示配置信息并退出
            if (options.showConfig) {
                configLoader.displayConfig(finalConfig);
                return;
            }

            // 确定测试文件模式
            const testPattern = pattern || finalConfig.testMatch;
            const testPatterns = Array.isArray(testPattern) ? testPattern : [testPattern];

            // 查找测试文件
            let testFiles = [];
            for (const pat of testPatterns) {
                const files = glob.sync(pat, {
                    cwd: process.cwd(),
                    absolute: false,
                    ignore: finalConfig.ignore
                });
                testFiles = testFiles.concat(files);
            }

            // 去重
            testFiles = [...new Set(testFiles)];

            if (testFiles.length === 0) {
                console.error(`No test files found matching pattern(s): ${testPatterns.join(', ')}`);
                process.exit(1);
            }

            console.log(`Running tests from ${testFiles.length} file(s)...`);
            if (finalConfig.reporterOptions.console.verbose) {
                configLoader.displayConfig(finalConfig);
            }

            // 创建测试运行器
            const runner = new TestRunner(finalConfig);

            // 运行测试
            const results = await runner.run(testFiles);

            // 生成报告
            await generateReports(results, finalConfig);

            // 如果有失败的测试，以非零状态码退出
            if (results.failed > 0) {
                process.exit(1);
            }
        } catch (error) {
            console.error('Error running tests:', error.message);
            if (process.env.NODE_ENV === 'development') {
                console.error(error.stack);
            }
            process.exit(1);
        }
    });

/**
 * 生成各种格式的报告
 */
async function generateReports(results, config) {
    const promises = [];
    const reporters = config.reporters || ['console'];

    // 控制台报告
    if (reporters.includes('console') || config.reporterOptions.console.verbose) {
        const reporter = new ConsoleReporter(config.reporterOptions.console);
        reporter.report(results);
    }

    // JSON报告
    if (reporters.includes('json')) {
        const outputFile = config.reporterOptions.json.outputFile;
        if (outputFile) {
            const fs = require('fs');
            const outputDir = path.dirname(outputFile);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }
            fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
            console.log(`JSON report generated: ${path.resolve(outputFile)}`);
        } else {
            console.log(JSON.stringify(results, null, 2));
        }
    }

    // HTML报告
    if (reporters.includes('html')) {
        const htmlOptions = config.reporterOptions.html;
        const htmlReporter = new HtmlReporter({
            outputDir: path.dirname(htmlOptions.outputFile),
            title: 'MiniTest Results'
        });
        promises.push(
            Promise.resolve(htmlReporter.generateReport(results, results.coverage))
        );
    }

    // XML报告
    if (reporters.includes('xml')) {
        const xmlOptions = config.reporterOptions.xml;
        const xmlReporter = new XmlReporter({
            outputFile: xmlOptions.outputFile
        });
        promises.push(
            Promise.resolve(xmlReporter.generateReport(results))
        );
    }

    // 等待所有报告生成完成
    await Promise.all(promises);
}

// 如果直接运行此文件
if (require.main === module) {
    program.parse();
}

module.exports = program;
