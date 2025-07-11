/**
 * 控制台报告器
 */
class ConsoleReporter {
    constructor(options = {}) {
        this.options = {
            verbose: false,
            colors: true,
            ...options
        };
    }

    /**
     * 格式化颜色输出
     */
    color(text, color) {
        if (!this.options.colors) return text;

        const colors = {
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            bold: '\x1b[1m',
            gray: '\x1b[90m',
            reset: '\x1b[0m'
        };

        return `${colors[color] || ''}${text}${colors.reset}`;
    }

    /**
     * 开始测试报告
     */
    onStart(totalFiles) {
        console.log(this.color(`\nRunning tests from ${totalFiles} file(s)...\n`, 'blue'));
    }

    /**
     * 文件开始
     */
    onFileStart(filename) {
        if (this.options.verbose) {
            console.log(this.color(`\n${filename}:`, 'bold'));
        }
    }

    /**
     * 测试开始
     */
    onTestStart(test) {
        if (this.options.verbose) {
            process.stdout.write(`  ${test.name} ... `);
        }
    }

    /**
     * 测试完成
     */
    onTestComplete(test) {
        if (this.options.verbose) {
            if (test.status === 'passed') {
                console.log(this.color('✓', 'green'));
            } else if (test.status === 'failed') {
                console.log(this.color('✗', 'red'));
            } else {
                console.log(this.color('○', 'yellow'));
            }
        } else {
            if (test.status === 'passed') {
                process.stdout.write(this.color('✓', 'green'));
            } else if (test.status === 'failed') {
                process.stdout.write(this.color('✗', 'red'));
            } else {
                process.stdout.write(this.color('○', 'yellow'));
            }
        }
    }

    /**
     * 套件完成
     */
    onSuiteComplete(suite) {
        if (this.options.verbose && suite.name !== 'root') {
            console.log(this.color(`\n  ${suite.name}:`, 'bold'));
            console.log(this.color(`    ✓ ${suite.passed} passed`, 'green'));

            if (suite.failed > 0) {
                console.log(this.color(`    ✗ ${suite.failed} failed`, 'red'));
            }

            if (suite.skipped > 0) {
                console.log(this.color(`    ○ ${suite.skipped} skipped`, 'yellow'));
            }
        }
    }

    /**
     * 文件完成
     */
    onFileComplete(fileResult) {
        if (!this.options.verbose) {
            console.log('');
        }
    }

    /**
     * 完成所有测试
     */
    onComplete(results) {
        console.log('\n' + '='.repeat(60));
        console.log(this.color('Test Results:', 'bold'));
        console.log(this.color(`✓ ${results.passed} passed`, 'green'));

        if (results.failed > 0) {
            console.log(this.color(`✗ ${results.failed} failed`, 'red'));
        }

        if (results.skipped > 0) {
            console.log(this.color(`○ ${results.skipped} skipped`, 'yellow'));
        }

        console.log(`Total Duration: ${results.duration}ms`);

        if (results.failed > 0) {
            console.log('\n' + this.color('Failed Tests:', 'red'));
            this.printFailedTests(results);
        }

        console.log('='.repeat(60));
    }

    /**
     * 打印失败的测试
     */
    printFailedTests(results) {
        const printTests = (tests, indent = '') => {
            tests.forEach(test => {
                if (test.status === 'failed') {
                    console.log(this.color(`${indent}✗ ${test.name}`, 'red'));
                    if (test.error) {
                        console.log(this.color(`${indent}  ${test.error}`, 'gray'));
                    }
                }
            });
        };

        const printSuites = (suites, indent = '') => {
            suites.forEach(suite => {
                if (suite.failed > 0) {
                    console.log(this.color(`${indent}${suite.name}:`, 'bold'));
                    printTests(suite.tests, indent + '  ');
                    printSuites(suite.suites, indent + '  ');
                }
            });
        };

        results.files.forEach(file => {
            if (file.failed > 0) {
                console.log(this.color(`\n${file.file}:`, 'bold'));
                printTests(file.tests, '  ');
                printSuites(file.suites, '  ');
            }
        });
    }

    /**
     * 报告测试结果
     */
    report(results) {
        this.onStart(results.files.length);

        results.files.forEach(file => {
            this.onFileStart(file.file);

            const printTests = (tests) => {
                tests.forEach(test => {
                    this.onTestStart(test);
                    this.onTestComplete(test);
                });
            };

            const printSuites = (suites) => {
                suites.forEach(suite => {
                    printTests(suite.tests);
                    printSuites(suite.suites);
                    this.onSuiteComplete(suite);
                });
            };

            printTests(file.tests);
            printSuites(file.suites);

            this.onFileComplete(file);
        });

        this.onComplete(results);
    }
}

module.exports = { ConsoleReporter };
