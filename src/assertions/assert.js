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
}

module.exports = { Assert, AssertionError };
