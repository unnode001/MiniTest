const { TestRunner } = require('./core/test-runner');
const { TestCase } = require('./core/test-case');
const { TestSuite } = require('./core/suite');
const { TestContext, setupGlobalAPI } = require('./core/context');
const { Assert, AssertionError } = require('./assertions/assert');
const { ConsoleReporter } = require('./reporters/console');
const { HtmlReporter } = require('./reporters/html');
const { XmlReporter } = require('./reporters/xml');
const { CoverageCollector } = require('./coverage/collector');

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
    setupGlobalAPI
};
