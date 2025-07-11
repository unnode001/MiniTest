/**
 * MiniTest 配置文件示例
 * 复制此文件为 minitest.config.js 并根据需要修改
 */

module.exports = {
    // 🚀 并行执行配置
    parallel: true,              // 启用并行测试执行
    maxWorkers: 4,               // 最大工作进程数 (默认为CPU核心数)

    // ⏱️ 超时设置
    timeout: 5000,               // 默认测试超时时间 (毫秒)

    // 📂 文件匹配模式
    testMatch: [
        'test/**/*.test.js',       // 标准测试文件
        'src/**/*.test.js',        // 源码目录中的测试
        '**/__tests__/**/*.js'     // __tests__ 目录
    ],

    // 🚫 忽略文件/目录
    ignore: [
        'node_modules/**',
        'coverage/**',
        'build/**',
        'dist/**'
    ],

    // 👀 监控模式配置
    watch: {
        enabled: false,            // 启用文件监控模式
        ignore: [                  // 监控时忽略的文件
            'node_modules/**',
            'coverage/**',
            '**/*.log'
        ],
        extensions: ['.js', '.ts', '.json'],  // 监控的文件扩展名
        debounce: 100             // 防抖延迟 (毫秒)
    },

    // 📊 覆盖率配置
    coverage: {
        enabled: true,             // 启用覆盖率收集
        dir: 'coverage',           // 覆盖率输出目录
        threshold: {               // 覆盖率阈值
            lines: 80,
            functions: 80,
            branches: 80,
            statements: 80
        },
        exclude: [                 // 覆盖率排除文件
            'test/**',
            'coverage/**',
            '**/*.test.js',
            '**/*.spec.js'
        ]
    },

    // 📝 报告器配置
    reporters: ['console', 'html'],  // 启用的报告器

    reporterOptions: {
        console: {
            colors: true,            // 启用彩色输出
            verbose: false           // 详细输出模式
        },
        html: {
            outputFile: 'coverage/index.html'  // HTML报告输出文件
        },
        xml: {
            outputFile: 'test-results.xml'     // XML报告输出文件
        },
        json: {
            outputFile: 'test-results.json'    // JSON报告输出文件
        }
    },

    // 🎭 Mock 配置
    mock: {
        clearMocks: true,          // 测试后清除所有mock
        restoreMocks: true,        // 测试后恢复原始实现
        resetMocks: false          // 测试后重置mock状态
    },

    // ⚡ 性能测试配置
    performance: {
        benchmark: false,          // 启用性能基准测试
        timeout: 10000,           // 性能测试超时时间
        samples: 10               // 性能测试样本数量
    }
};

/* 
使用示例:

1. 基础使用 - 将此文件保存为 minitest.config.js
2. 命令行覆盖 - CLI参数会覆盖配置文件设置
   npx minitest --parallel --max-workers 8 --coverage

3. 环境特定配置:
   const isCI = process.env.CI === 'true';
   module.exports = {
     parallel: isCI,
     maxWorkers: isCI ? 2 : 4,
     reporters: isCI ? ['xml'] : ['console', 'html']
   };

4. 动态配置:
   module.exports = () => ({
     parallel: process.env.NODE_ENV !== 'debug',
     coverage: { enabled: process.env.COVERAGE === 'true' }
   });
*/
