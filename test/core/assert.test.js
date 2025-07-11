// 测试断言库本身
describe('Assert Library Tests', () => {
    describe('equal assertion', () => {
        test('should pass when values are equal', () => {
            assert.equal(1, 1);
            assert.equal('hello', 'hello');
            assert.equal(true, true);
        });

        test('should fail when values are not equal', () => {
            assert.throws(() => {
                assert.equal(1, 2);
            });
        });
    });

    describe('deepEqual assertion', () => {
        test('should pass for deep equal objects', () => {
            assert.deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } });
            assert.deepEqual([1, 2, 3], [1, 2, 3]);
        });

        test('should fail for different objects', () => {
            assert.throws(() => {
                assert.deepEqual({ a: 1 }, { a: 2 });
            });
        });
    });

    describe('boolean assertions', () => {
        test('should handle true/false assertions', () => {
            assert.true(true);
            assert.false(false);

            assert.throws(() => {
                assert.true(false);
            });

            assert.throws(() => {
                assert.false(true);
            });
        });
    });

    describe('async assertions', () => {
        test('should handle async resolves', async () => {
            await assert.resolves(async () => {
                return Promise.resolve('success');
            });
        });

        test('should handle async rejects', async () => {
            await assert.rejects(async () => {
                throw new Error('async error');
            });
        });
    });
});
