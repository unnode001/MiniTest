/**
 * 断言错误类
 */
class AssertionError extends Error {
    constructor(message, actual, expected) {
        super(message);
        this.name = 'AssertionError';
        this.actual = actual;
        this.expected = expected;
    }
}

/**
 * 断言库
 */
class Assert {
    /**
     * 相等断言
     */
    static equal(actual, expected, message) {
        if (actual !== expected) {
            throw new AssertionError(
                message || `Expected ${actual} to equal ${expected}`,
                actual,
                expected
            );
        }
    }

    /**
     * 不相等断言
     */
    static notEqual(actual, expected, message) {
        if (actual === expected) {
            throw new AssertionError(
                message || `Expected ${actual} to not equal ${expected}`,
                actual,
                expected
            );
        }
    }

    /**
     * 真值断言
     */
    static true(value, message) {
        if (value !== true) {
            throw new AssertionError(
                message || `Expected ${value} to be true`,
                value,
                true
            );
        }
    }

    /**
     * 假值断言
     */
    static false(value, message) {
        if (value !== false) {
            throw new AssertionError(
                message || `Expected ${value} to be false`,
                value,
                false
            );
        }
    }

    /**
     * 深度相等断言
     */
    static deepEqual(actual, expected, message) {
        if (!this.isDeepEqual(actual, expected)) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`,
                actual,
                expected
            );
        }
    }

    /**
     * 深度相等比较
     */
    static isDeepEqual(a, b) {
        if (a === b) return true;
        if (a == null || b == null) return false;
        if (typeof a !== typeof b) return false;

        if (typeof a === 'object') {
            const keysA = Object.keys(a);
            const keysB = Object.keys(b);

            if (keysA.length !== keysB.length) return false;

            for (const key of keysA) {
                if (!keysB.includes(key)) return false;
                if (!this.isDeepEqual(a[key], b[key])) return false;
            }

            return true;
        }

        return false;
    }

    /**
     * 异常断言
     */
    static throws(fn, expectedError, message) {
        try {
            fn();
            throw new AssertionError(
                message || 'Expected function to throw an error',
                'no error thrown',
                'error thrown'
            );
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new AssertionError(
                    message || `Expected error to be instance of ${expectedError.name}`,
                    error.constructor.name,
                    expectedError.name
                );
            }
        }
    }

    /**
     * 异步异常断言
     */
    static async rejects(asyncFn, expectedError, message) {
        try {
            await asyncFn();
            throw new AssertionError(
                message || 'Expected async function to reject',
                'resolved',
                'rejected'
            );
        } catch (error) {
            if (expectedError && !(error instanceof expectedError)) {
                throw new AssertionError(
                    message || `Expected error to be instance of ${expectedError.name}`,
                    error.constructor.name,
                    expectedError.name
                );
            }
        }
    }

    /**
     * 异步成功断言
     */
    static async resolves(asyncFn, message) {
        try {
            await asyncFn();
        } catch (error) {
            throw new AssertionError(
                message || 'Expected async function to resolve',
                'rejected',
                'resolved'
            );
        }
    }

    /**
     * 包含断言
     */
    static includes(container, item, message) {
        let contained = false;

        if (typeof container === 'string') {
            contained = container.includes(item);
        } else if (Array.isArray(container)) {
            contained = container.includes(item);
        } else if (container && typeof container.includes === 'function') {
            contained = container.includes(item);
        }

        if (!contained) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(container)} to include ${JSON.stringify(item)}`,
                container,
                `should include ${item}`
            );
        }
    }

    /**
     * 不包含断言
     */
    static notIncludes(container, item, message) {
        let contained = false;

        if (typeof container === 'string') {
            contained = container.includes(item);
        } else if (Array.isArray(container)) {
            contained = container.includes(item);
        } else if (container && typeof container.includes === 'function') {
            contained = container.includes(item);
        }

        if (contained) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(container)} to not include ${JSON.stringify(item)}`,
                container,
                `should not include ${item}`
            );
        }
    }

    /**
     * 类型断言
     */
    static instanceOf(actual, expectedClass, message) {
        if (!(actual instanceof expectedClass)) {
            throw new AssertionError(
                message || `Expected ${actual} to be instance of ${expectedClass.name}`,
                actual ? actual.constructor.name : actual,
                expectedClass.name
            );
        }
    }

    /**
     * 类型检查断言
     */
    static typeOf(actual, expectedType, message) {
        const actualType = typeof actual;
        if (actualType !== expectedType) {
            throw new AssertionError(
                message || `Expected ${actual} to be of type ${expectedType}`,
                actualType,
                expectedType
            );
        }
    }

    /**
     * 数组长度断言
     */
    static lengthOf(actual, expectedLength, message) {
        if (!actual || typeof actual.length !== 'number') {
            throw new AssertionError(
                message || `Expected ${actual} to have length property`,
                typeof actual,
                'object with length'
            );
        }

        if (actual.length !== expectedLength) {
            throw new AssertionError(
                message || `Expected length ${expectedLength}, got ${actual.length}`,
                actual.length,
                expectedLength
            );
        }
    }

    /**
     * 空值断言
     */
    static isEmpty(actual, message) {
        let empty = false;

        if (actual == null) {
            empty = true;
        } else if (typeof actual === 'string' || Array.isArray(actual)) {
            empty = actual.length === 0;
        } else if (typeof actual === 'object') {
            empty = Object.keys(actual).length === 0;
        }

        if (!empty) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(actual)} to be empty`,
                actual,
                'empty'
            );
        }
    }

    /**
     * 非空断言
     */
    static isNotEmpty(actual, message) {
        let empty = false;

        if (actual == null) {
            empty = true;
        } else if (typeof actual === 'string' || Array.isArray(actual)) {
            empty = actual.length === 0;
        } else if (typeof actual === 'object') {
            empty = Object.keys(actual).length === 0;
        }

        if (empty) {
            throw new AssertionError(
                message || `Expected ${JSON.stringify(actual)} to not be empty`,
                actual,
                'not empty'
            );
        }
    }

    /**
     * null检查断言
     */
    static isNull(actual, message) {
        if (actual !== null) {
            throw new AssertionError(
                message || `Expected ${actual} to be null`,
                actual,
                null
            );
        }
    }

    /**
     * 非null检查断言
     */
    static isNotNull(actual, message) {
        if (actual === null) {
            throw new AssertionError(
                message || `Expected value to not be null`,
                actual,
                'not null'
            );
        }
    }

    /**
     * undefined检查断言
     */
    static isUndefined(actual, message) {
        if (actual !== undefined) {
            throw new AssertionError(
                message || `Expected ${actual} to be undefined`,
                actual,
                undefined
            );
        }
    }

    /**
     * 非undefined检查断言
     */
    static isNotUndefined(actual, message) {
        if (actual === undefined) {
            throw new AssertionError(
                message || `Expected value to not be undefined`,
                actual,
                'not undefined'
            );
        }
    }

    /**
     * 数值范围断言
     */
    static inRange(actual, min, max, message) {
        if (typeof actual !== 'number' || actual < min || actual > max) {
            throw new AssertionError(
                message || `Expected ${actual} to be between ${min} and ${max}`,
                actual,
                `between ${min} and ${max}`
            );
        }
    }

    /**
     * 正则表达式匹配断言
     */
    static matches(actual, pattern, message) {
        if (typeof actual !== 'string') {
            throw new AssertionError(
                message || `Expected ${actual} to be a string`,
                typeof actual,
                'string'
            );
        }

        const regex = pattern instanceof RegExp ? pattern : new RegExp(pattern);
        if (!regex.test(actual)) {
            throw new AssertionError(
                message || `Expected "${actual}" to match ${regex}`,
                actual,
                regex.toString()
            );
        }
    }

    /**
     * 对象属性存在断言
     */
    static hasProperty(actual, property, message) {
        if (actual == null || !Object.prototype.hasOwnProperty.call(actual, property)) {
            throw new AssertionError(
                message || `Expected object to have property "${property}"`,
                actual ? Object.keys(actual) : actual,
                `should have property "${property}"`
            );
        }
    }

    /**
     * 数组元素断言
     */
    static includesAllOf(actual, expected, message) {
        if (!Array.isArray(actual)) {
            throw new AssertionError(
                message || `Expected ${actual} to be an array`,
                typeof actual,
                'array'
            );
        }

        if (!Array.isArray(expected)) {
            throw new AssertionError(
                message || `Expected comparison value to be an array`,
                typeof expected,
                'array'
            );
        }

        const missing = expected.filter(item => !actual.includes(item));
        if (missing.length > 0) {
            throw new AssertionError(
                message || `Expected array to include all of ${JSON.stringify(expected)}, missing: ${JSON.stringify(missing)}`,
                actual,
                expected
            );
        }
    }

    /**
     * 数组任一元素断言
     */
    static includesAnyOf(actual, expected, message) {
        if (!Array.isArray(actual)) {
            throw new AssertionError(
                message || `Expected ${actual} to be an array`,
                typeof actual,
                'array'
            );
        }

        if (!Array.isArray(expected)) {
            throw new AssertionError(
                message || `Expected comparison value to be an array`,
                typeof expected,
                'array'
            );
        }

        const hasAny = expected.some(item => actual.includes(item));
        if (!hasAny) {
            throw new AssertionError(
                message || `Expected array to include any of ${JSON.stringify(expected)}`,
                actual,
                expected
            );
        }
    }
}

module.exports = { Assert, AssertionError };
