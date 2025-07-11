const { TestRunner } = require('./core/test-runner');
const { TestCase } = require('./core/test-case');
const { TestSuite } = require('./core/suite');
const { TestContext, setupGlobalAPI } = require('./core/context');
const { Assert, AssertionError } = require('./assertions/assert');
const { ConsoleReporter } = require('./reporters/console');
const { HtmlReporter } = require('./reporters/html');
const { XmlReporter } = require('./reporters/xml');
const { CoverageCollector } = require('./coverage/collector');

// 设置全局 API
setupGlobalAPI();

// 导出所有核心组件
module.exports = {
    TestRunner,
    TestCase,
    TestSuite,
    TestContext,
    Assert,
    AssertionError,
    ConsoleReporter,
    HtmlReporter,
    XmlReporter,
    CoverageCollector,
    setupGlobalAPI,
    // 全局 API 函数
    describe: global.describe,
    test: global.test,
    it: global.it,
    expect: global.expect,
    beforeEach: global.beforeEach,
    afterEach: global.afterEach,
    beforeAll: global.beforeAll,
    afterAll: global.afterAll
};
