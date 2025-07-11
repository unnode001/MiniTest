const fs = require('fs');
const path = require('path');

/**
 * XML报告器 (JUnit格式)
 */
class XmlReporter {
    constructor(options = {}) {
        this.options = {
            outputFile: 'test-results.xml',
            suiteName: 'MiniTest Suite',
            ...options
        };
    }

    /**
     * 生成XML报告
     */
    generateReport(results) {
        const xml = this.generateJUnitXML(results);
        const outputPath = this.options.outputFile;

        // 确保输出目录存在
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, xml);
        console.log(`XML report generated: ${path.resolve(outputPath)}`);
        return outputPath;
    }

    /**
     * 生成JUnit格式的XML
     */
    generateJUnitXML(results) {
        const timestamp = new Date().toISOString();
        const totalTests = results.passed + results.failed + results.skipped;

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += `<testsuites name="${this.escapeXml(this.options.suiteName)}" `;
        xml += `tests="${totalTests}" `;
        xml += `failures="${results.failed}" `;
        xml += `skipped="${results.skipped}" `;
        xml += `time="${(results.duration / 1000).toFixed(3)}" `;
        xml += `timestamp="${timestamp}">\n`;

        // 为每个文件生成一个testsuite
        results.files.forEach(file => {
            xml += this.generateTestSuite(file);
        });

        xml += '</testsuites>\n';
        return xml;
    }

    /**
     * 生成测试套件XML
     */
    generateTestSuite(file) {
        const totalTests = file.passed + file.failed + file.skipped;
        let xml = '';

        xml += `  <testsuite name="${this.escapeXml(file.file)}" `;
        xml += `tests="${totalTests}" `;
        xml += `failures="${file.failed}" `;
        xml += `skipped="${file.skipped}" `;
        xml += `time="${(file.duration / 1000).toFixed(3)}">\n`;

        // 生成根级别的测试用例
        file.tests.forEach(test => {
            xml += this.generateTestCase(test, file.file);
        });

        // 递归生成套件中的测试用例
        xml += this.generateSuiteTests(file.suites, file.file);

        xml += '  </testsuite>\n';
        return xml;
    }

    /**
     * 递归生成套件测试
     */
    generateSuiteTests(suites, filename, parentSuite = '') {
        let xml = '';

        suites.forEach(suite => {
            const suiteName = parentSuite ? `${parentSuite} > ${suite.name}` : suite.name;

            // 生成当前套件的测试用例
            suite.tests.forEach(test => {
                xml += this.generateTestCase(test, filename, suiteName);
            });

            // 递归生成子套件
            xml += this.generateSuiteTests(suite.suites, filename, suiteName);
        });

        return xml;
    }

    /**
     * 生成测试用例XML
     */
    generateTestCase(test, filename, suiteName = '') {
        const className = this.escapeXml(suiteName || path.basename(filename, '.js'));
        const testName = this.escapeXml(test.name);
        const time = (test.duration / 1000).toFixed(3);

        let xml = `    <testcase classname="${className}" `;
        xml += `name="${testName}" `;
        xml += `time="${time}"`;

        if (test.status === 'failed') {
            xml += '>\n';
            xml += `      <failure message="${this.escapeXml(test.error || 'Test failed')}">\n`;
            xml += `        <![CDATA[${test.error || 'Test failed'}]]>\n`;
            xml += '      </failure>\n';
            xml += '    </testcase>\n';
        } else if (test.status === 'skipped') {
            xml += '>\n';
            xml += '      <skipped/>\n';
            xml += '    </testcase>\n';
        } else {
            xml += '/>\n';
        }

        return xml;
    }

    /**
     * 转义XML特殊字符
     */
    escapeXml(text) {
        if (typeof text !== 'string') {
            return String(text);
        }

        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

module.exports = { XmlReporter };
