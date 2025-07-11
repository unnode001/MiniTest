/**
 * MiniTest 测试用配置文件
 */

module.exports = {
    // 启用并行执行（暂时关闭，等并行功能完成）
    parallel: false,
    maxWorkers: 2,

    // 超时设置
    timeout: 10000,

    // 测试文件匹配
    testMatch: [
        'test/**/*.test.js'
    ],

    // 忽略文件
    ignore: [
        'node_modules/**',
        'coverage/**'
    ],

    // 覆盖率配置
    coverage: {
        enabled: true,
        dir: 'coverage',
        threshold: {
            lines: 70,
            functions: 70,
            branches: 60,
            statements: 70
        }
    },

    // 报告器配置
    reporters: ['console', 'html'],

    reporterOptions: {
        console: {
            colors: true,
            verbose: true
        },
        html: {
            outputFile: 'coverage/index.html'
        },
        xml: {
            outputFile: 'test-results.xml'
        }
    },

    // Mock配置
    mock: {
        clearMocks: true,
        restoreMocks: true
    }
};
