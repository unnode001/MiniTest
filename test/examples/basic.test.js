// 基础测试示例
describe('Basic Tests', () => {
    test('should pass basic assertions', () => {
        assert.equal(1 + 1, 2);
        assert.true(true);
        assert.false(false);
        assert.notEqual(1, 2);
    });

    test('should test deep equality', () => {
        const obj1 = { a: 1, b: { c: 2 } };
        const obj2 = { a: 1, b: { c: 2 } };
        assert.deepEqual(obj1, obj2);
    });

    test('should handle error throwing', () => {
        assert.throws(() => {
            throw new Error('test error');
        }, Error);
    });

    test('should handle async tests', async () => {
        const result = await Promise.resolve(42);
        assert.equal(result, 42);
    });

    test('should handle async rejection', async () => {
        await assert.rejects(async () => {
            throw new Error('async error');
        }, Error);
    });
});

describe('Nested Suite', () => {
    test('nested test 1', () => {
        assert.equal(2 * 3, 6);
    });

    describe('Deeply Nested', () => {
        test('deeply nested test', () => {
            assert.true(Array.isArray([]));
        });
    });
});
