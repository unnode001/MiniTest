const fs = require('fs');
const path = require('path');

/**
 * HTML报告器
 */
class HtmlReporter {
    constructor(options = {}) {
        this.options = {
            outputDir: 'coverage',
            title: 'Test Results',
            includeDate: true,
            ...options
        };
    }

    /**
     * 生成HTML报告
     */
    generateReport(results, coverageReport = null) {
        const outputDir = this.options.outputDir;

        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // 生成主报告页面
        const html = this.generateMainPage(results, coverageReport);
        const htmlPath = path.join(outputDir, 'index.html');
        fs.writeFileSync(htmlPath, html);

        // 生成CSS文件
        const css = this.generateCSS();
        const cssPath = path.join(outputDir, 'styles.css');
        fs.writeFileSync(cssPath, css);

        // 生成JavaScript文件
        const js = this.generateJS();
        const jsPath = path.join(outputDir, 'scripts.js');
        fs.writeFileSync(jsPath, js);

        console.log(`HTML report generated: ${path.resolve(htmlPath)}`);
        return htmlPath;
    }

    /**
     * 生成主页面HTML
     */
    generateMainPage(results, coverageReport) {
        const timestamp = new Date().toLocaleString();

        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.options.title}</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>${this.options.title}</h1>
            ${this.options.includeDate ? `<p class="timestamp">Generated on ${timestamp}</p>` : ''}
        </header>
        
        <div class="summary">
            ${this.generateSummarySection(results)}
        </div>
        
        ${coverageReport ? this.generateCoverageSection(coverageReport) : ''}
        
        <div class="test-results">
            <h2>Test Results Detail</h2>
            ${this.generateTestResultsSection(results)}
        </div>
        
        ${results.failed > 0 ? this.generateFailedTestsSection(results) : ''}
    </div>
    
    <script src="scripts.js"></script>
</body>
</html>`;
    }

    /**
     * 生成摘要部分
     */
    generateSummarySection(results) {
        const successRate = results.passed + results.failed > 0 ?
            (results.passed / (results.passed + results.failed) * 100).toFixed(1) : 0;

        return `
        <h2>Summary</h2>
        <div class="summary-grid">
            <div class="summary-card passed">
                <div class="card-value">${results.passed}</div>
                <div class="card-label">Passed</div>
            </div>
            <div class="summary-card failed">
                <div class="card-value">${results.failed}</div>
                <div class="card-label">Failed</div>
            </div>
            <div class="summary-card skipped">
                <div class="card-value">${results.skipped}</div>
                <div class="card-label">Skipped</div>
            </div>
            <div class="summary-card duration">
                <div class="card-value">${results.duration}ms</div>
                <div class="card-label">Duration</div>
            </div>
        </div>
        <div class="success-rate">
            <div class="rate-bar">
                <div class="rate-fill" style="width: ${successRate}%"></div>
            </div>
            <span class="rate-text">${successRate}% Success Rate</span>
        </div>`;
    }

    /**
     * 生成覆盖率部分
     */
    generateCoverageSection(coverageReport) {
        return `
        <div class="coverage">
            <h2>Code Coverage</h2>
            <div class="coverage-summary">
                <div class="coverage-item">
                    <span class="coverage-label">Lines</span>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${coverageReport.summary.lines.percentage.toFixed(1)}%"></div>
                    </div>
                    <span class="coverage-percentage">${coverageReport.summary.lines.percentage.toFixed(1)}%</span>
                    <span class="coverage-count">${coverageReport.summary.lines.covered}/${coverageReport.summary.lines.total}</span>
                </div>
                <div class="coverage-item">
                    <span class="coverage-label">Functions</span>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${coverageReport.summary.functions.percentage.toFixed(1)}%"></div>
                    </div>
                    <span class="coverage-percentage">${coverageReport.summary.functions.percentage.toFixed(1)}%</span>
                    <span class="coverage-count">${coverageReport.summary.functions.covered}/${coverageReport.summary.functions.total}</span>
                </div>
                <div class="coverage-item">
                    <span class="coverage-label">Branches</span>
                    <div class="coverage-bar">
                        <div class="coverage-fill" style="width: ${coverageReport.summary.branches.percentage.toFixed(1)}%"></div>
                    </div>
                    <span class="coverage-percentage">${coverageReport.summary.branches.percentage.toFixed(1)}%</span>
                    <span class="coverage-count">${coverageReport.summary.branches.covered}/${coverageReport.summary.branches.total}</span>
                </div>
            </div>
            
            <h3>Files Coverage</h3>
            <div class="file-coverage">
                ${Object.entries(coverageReport.files).map(([filename, data]) => `
                <div class="file-item" onclick="toggleFileDetails('${filename}')">
                    <div class="file-header">
                        <span class="file-name">${filename}</span>
                        <span class="file-percentage">${data.lines.percentage.toFixed(1)}%</span>
                    </div>
                    <div class="file-details" id="details-${filename.replace(/[^a-zA-Z0-9]/g, '_')}">
                        <div class="detail-item">
                            <span>Lines: ${data.lines.covered}/${data.lines.total} (${data.lines.percentage.toFixed(1)}%)</span>
                        </div>
                        <div class="detail-item">
                            <span>Functions: ${data.functions.covered}/${data.functions.total} (${data.functions.percentage.toFixed(1)}%)</span>
                        </div>
                        <div class="detail-item">
                            <span>Branches: ${data.branches.covered}/${data.branches.total} (${data.branches.percentage.toFixed(1)}%)</span>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </div>`;
    }

    /**
     * 生成测试结果部分
     */
    generateTestResultsSection(results) {
        return results.files.map(file => `
        <div class="test-file">
            <h3 class="file-title">${file.file}</h3>
            <div class="file-stats">
                <span class="stat passed">✓ ${file.passed}</span>
                ${file.failed > 0 ? `<span class="stat failed">✗ ${file.failed}</span>` : ''}
                ${file.skipped > 0 ? `<span class="stat skipped">○ ${file.skipped}</span>` : ''}
                <span class="stat duration">${file.duration}ms</span>
            </div>
            ${this.generateSuiteTests(file.suites)}
            ${file.tests.length > 0 ? this.generateTests(file.tests) : ''}
        </div>
        `).join('');
    }

    /**
     * 生成套件测试
     */
    generateSuiteTests(suites) {
        return suites.map(suite => `
        <div class="test-suite">
            <h4 class="suite-title">${suite.name}</h4>
            ${this.generateTests(suite.tests)}
            ${suite.suites.length > 0 ? this.generateSuiteTests(suite.suites) : ''}
        </div>
        `).join('');
    }

    /**
     * 生成测试用例
     */
    generateTests(tests) {
        return `
        <div class="test-list">
            ${tests.map(test => `
            <div class="test-item ${test.status}">
                <span class="test-icon">${this.getTestIcon(test.status)}</span>
                <span class="test-name">${test.name}</span>
                <span class="test-duration">${test.duration}ms</span>
                ${test.error ? `<div class="test-error">${test.error}</div>` : ''}
            </div>
            `).join('')}
        </div>`;
    }

    /**
     * 生成失败测试部分
     */
    generateFailedTestsSection(results) {
        const failedTests = [];

        // 收集所有失败的测试
        results.files.forEach(file => {
            const collectFailed = (tests, path = []) => {
                tests.forEach(test => {
                    if (test.status === 'failed') {
                        failedTests.push({
                            file: file.file,
                            path: path.join(' > '),
                            name: test.name,
                            error: test.error
                        });
                    }
                });
            };

            const collectFromSuites = (suites, path = []) => {
                suites.forEach(suite => {
                    const suitePath = [...path, suite.name];
                    collectFailed(suite.tests, suitePath);
                    collectFromSuites(suite.suites, suitePath);
                });
            };

            collectFailed(file.tests);
            collectFromSuites(file.suites);
        });

        return `
        <div class="failed-tests">
            <h2>Failed Tests</h2>
            ${failedTests.map(test => `
            <div class="failed-test">
                <div class="failed-test-header">
                    <span class="failed-file">${test.file}</span>
                    ${test.path ? `<span class="failed-path">${test.path}</span>` : ''}
                </div>
                <div class="failed-test-name">✗ ${test.name}</div>
                <div class="failed-test-error">${test.error}</div>
            </div>
            `).join('')}
        </div>`;
    }

    /**
     * 获取测试状态图标
     */
    getTestIcon(status) {
        switch (status) {
            case 'passed': return '✓';
            case 'failed': return '✗';
            case 'skipped': return '○';
            default: return '?';
        }
    }

    /**
     * 生成CSS样式
     */
    generateCSS() {
        return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .header h1 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .timestamp {
            color: #7f8c8d;
            font-size: 14px;
        }
        
        .summary {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .summary h2 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .summary-card {
            padding: 15px;
            border-radius: 6px;
            text-align: center;
            color: white;
        }
        
        .summary-card.passed { background-color: #27ae60; }
        .summary-card.failed { background-color: #e74c3c; }
        .summary-card.skipped { background-color: #f39c12; }
        .summary-card.duration { background-color: #3498db; }
        
        .card-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .card-label {
            font-size: 14px;
            opacity: 0.9;
        }
        
        .success-rate {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .rate-bar {
            flex: 1;
            height: 20px;
            background-color: #ecf0f1;
            border-radius: 10px;
            overflow: hidden;
        }
        
        .rate-fill {
            height: 100%;
            background-color: #27ae60;
            transition: width 0.3s ease;
        }
        
        .rate-text {
            font-weight: bold;
            color: #2c3e50;
        }
        
        .coverage {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .coverage h2 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .coverage-summary {
            margin-bottom: 30px;
        }
        
        .coverage-item {
            display: flex;
            align-items: center;
            margin-bottom: 15px;
            gap: 15px;
        }
        
        .coverage-label {
            min-width: 80px;
            font-weight: bold;
        }
        
        .coverage-bar {
            flex: 1;
            height: 16px;
            background-color: #ecf0f1;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .coverage-fill {
            height: 100%;
            background-color: #27ae60;
            transition: width 0.3s ease;
        }
        
        .coverage-percentage {
            min-width: 50px;
            text-align: right;
            font-weight: bold;
        }
        
        .coverage-count {
            min-width: 60px;
            text-align: right;
            color: #7f8c8d;
            font-size: 14px;
        }
        
        .file-coverage {
            border: 1px solid #ecf0f1;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .file-item {
            border-bottom: 1px solid #ecf0f1;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .file-item:hover {
            background-color: #f8f9fa;
        }
        
        .file-item:last-child {
            border-bottom: none;
        }
        
        .file-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
        }
        
        .file-name {
            font-family: monospace;
            color: #2c3e50;
        }
        
        .file-percentage {
            font-weight: bold;
            color: #27ae60;
        }
        
        .file-details {
            display: none;
            padding: 0 15px 15px;
            background-color: #f8f9fa;
        }
        
        .file-details.show {
            display: block;
        }
        
        .detail-item {
            margin-bottom: 5px;
            font-size: 14px;
            color: #7f8c8d;
        }
        
        .test-results {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 30px;
        }
        
        .test-results h2 {
            margin-bottom: 20px;
            color: #2c3e50;
        }
        
        .test-file {
            margin-bottom: 30px;
            border: 1px solid #ecf0f1;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .file-title {
            background-color: #34495e;
            color: white;
            padding: 15px;
            margin: 0;
            font-family: monospace;
        }
        
        .file-stats {
            padding: 10px 15px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .stat {
            margin-right: 15px;
            font-weight: bold;
        }
        
        .stat.passed { color: #27ae60; }
        .stat.failed { color: #e74c3c; }
        .stat.skipped { color: #f39c12; }
        .stat.duration { color: #3498db; }
        
        .test-suite {
            margin: 15px;
        }
        
        .suite-title {
            color: #2c3e50;
            margin-bottom: 10px;
            padding-left: 10px;
            border-left: 3px solid #3498db;
        }
        
        .test-list {
            margin-left: 20px;
        }
        
        .test-item {
            display: flex;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #ecf0f1;
        }
        
        .test-item:last-child {
            border-bottom: none;
        }
        
        .test-icon {
            width: 20px;
            text-align: center;
            margin-right: 10px;
        }
        
        .test-item.passed .test-icon { color: #27ae60; }
        .test-item.failed .test-icon { color: #e74c3c; }
        .test-item.skipped .test-icon { color: #f39c12; }
        
        .test-name {
            flex: 1;
        }
        
        .test-duration {
            color: #7f8c8d;
            font-size: 12px;
            margin-left: 10px;
        }
        
        .test-error {
            flex-basis: 100%;
            margin-top: 5px;
            padding: 8px;
            background-color: #fdf2f2;
            color: #e74c3c;
            border-radius: 4px;
            font-family: monospace;
            font-size: 12px;
        }
        
        .failed-tests {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .failed-tests h2 {
            margin-bottom: 20px;
            color: #e74c3c;
        }
        
        .failed-test {
            margin-bottom: 20px;
            border: 1px solid #e74c3c;
            border-radius: 6px;
            overflow: hidden;
        }
        
        .failed-test-header {
            background-color: #fdf2f2;
            padding: 10px 15px;
            border-bottom: 1px solid #e74c3c;
        }
        
        .failed-file {
            font-family: monospace;
            font-weight: bold;
            color: #2c3e50;
        }
        
        .failed-path {
            color: #7f8c8d;
            margin-left: 10px;
        }
        
        .failed-test-name {
            padding: 10px 15px;
            font-weight: bold;
            color: #e74c3c;
        }
        
        .failed-test-error {
            padding: 10px 15px;
            background-color: #fdf2f2;
            font-family: monospace;
            font-size: 14px;
            color: #c0392b;
            border-top: 1px solid #e74c3c;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .coverage-item {
                flex-direction: column;
                align-items: stretch;
                gap: 5px;
            }
            
            .file-header {
                flex-direction: column;
                align-items: stretch;
                gap: 10px;
            }
        }`;
    }

    /**
     * 生成JavaScript代码
     */
    generateJS() {
        return `
        function toggleFileDetails(filename) {
            const id = 'details-' + filename.replace(/[^a-zA-Z0-9]/g, '_');
            const element = document.getElementById(id);
            if (element) {
                element.classList.toggle('show');
            }
        }
        
        // 页面加载完成后的初始化
        document.addEventListener('DOMContentLoaded', function() {
            // 添加平滑滚动效果
            const links = document.querySelectorAll('a[href^="#"]');
            links.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const target = document.querySelector(this.getAttribute('href'));
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth' });
                    }
                });
            });
            
            // 添加进度条动画
            const progressBars = document.querySelectorAll('.rate-fill, .coverage-fill');
            progressBars.forEach(bar => {
                const width = bar.style.width;
                bar.style.width = '0%';
                setTimeout(() => {
                    bar.style.width = width;
                }, 100);
            });
        });`;
    }
}

module.exports = { HtmlReporter };
