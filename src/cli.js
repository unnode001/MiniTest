#!/usr/bin/env node

const { program } = require('commander');
const glob = require('glob');
const path = require('path');
const { TestRunner } = require('./core/test-runner');
const { ConsoleReporter } = require('./reporters/console');

program
    .version('1.0.0')
    .description('MiniTest - A lightweight JavaScript testing framework')
    .argument('[pattern]', 'Test file pattern', 'test/**/*.test.js')
    .option('-r, --reporter <type>', 'Reporter type (console, json)', 'console')
    .option('-v, --verbose', 'Verbose output')
    .option('-t, --timeout <ms>', 'Test timeout in milliseconds', '5000')
    .option('--no-colors', 'Disable colored output')
    .action(async (pattern, options) => {
        try {
            // 查找测试文件
            const testFiles = glob.sync(pattern, {
                cwd: process.cwd(),
                absolute: false
            });

            if (testFiles.length === 0) {
                console.error(`No test files found matching pattern: ${pattern}`);
                process.exit(1);
            }

            // 创建测试运行器
            const runner = new TestRunner({
                reporter: options.reporter,
                verbose: options.verbose,
                timeout: parseInt(options.timeout),
                colors: options.colors
            });

            // 运行测试
            const results = await runner.run(testFiles);

            // 创建报告器并输出结果
            if (options.reporter === 'json') {
                console.log(JSON.stringify(results, null, 2));
            } else {
                const reporter = new ConsoleReporter({
                    verbose: options.verbose,
                    colors: options.colors
                });
                reporter.report(results);
            }

            // 如果有失败的测试，以非零状态码退出
            if (results.failed > 0) {
                process.exit(1);
            }
        } catch (error) {
            console.error('Error running tests:', error.message);
            process.exit(1);
        }
    });

// 如果直接运行此文件
if (require.main === module) {
    program.parse();
}

module.exports = program;
