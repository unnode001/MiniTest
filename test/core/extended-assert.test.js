// 测试扩展断言功能
describe('Extended Assertions', () => {
    describe('includes and notIncludes', () => {
        test('should test string includes', () => {
            assert.includes('hello world', 'world');
            assert.notIncludes('hello world', 'foo');
        });

        test('should test array includes', () => {
            assert.includes([1, 2, 3], 2);
            assert.notIncludes([1, 2, 3], 4);
        });

        test('should fail when item not found', () => {
            assert.throws(() => {
                assert.includes('hello', 'xyz');
            });
        });
    });

    describe('type assertions', () => {
        test('should test instanceof', () => {
            assert.instanceOf(new Date(), Date);
            assert.instanceOf([], Array);
            assert.instanceOf({}, Object);
        });

        test('should test typeof', () => {
            assert.typeOf('hello', 'string');
            assert.typeOf(42, 'number');
            assert.typeOf(true, 'boolean');
            assert.typeOf({}, 'object');
        });

        test('should fail with wrong type', () => {
            assert.throws(() => {
                assert.typeOf('hello', 'number');
            });
        });
    });

    describe('length assertions', () => {
        test('should test array length', () => {
            assert.lengthOf([1, 2, 3], 3);
            assert.lengthOf('hello', 5);
        });

        test('should fail with wrong length', () => {
            assert.throws(() => {
                assert.lengthOf([1, 2], 3);
            });
        });
    });

    describe('empty assertions', () => {
        test('should test empty values', () => {
            assert.isEmpty([]);
            assert.isEmpty('');
            assert.isEmpty({});
            assert.isEmpty(null);
            assert.isEmpty(undefined);
        });

        test('should test non-empty values', () => {
            assert.isNotEmpty([1]);
            assert.isNotEmpty('hello');
            assert.isNotEmpty({ a: 1 });
        });
    });

    describe('null and undefined assertions', () => {
        test('should test null values', () => {
            assert.isNull(null);
            assert.isNotNull('not null');
            assert.isNotNull(0);
            assert.isNotNull(false);
        });

        test('should test undefined values', () => {
            assert.isUndefined(undefined);
            assert.isNotUndefined(null);
            assert.isNotUndefined(0);
            assert.isNotUndefined('');
        });
    });

    describe('range assertions', () => {
        test('should test number ranges', () => {
            assert.inRange(5, 1, 10);
            assert.inRange(0, 0, 100);
            assert.inRange(-5, -10, 0);
        });

        test('should fail when out of range', () => {
            assert.throws(() => {
                assert.inRange(15, 1, 10);
            });
        });
    });

    describe('regex assertions', () => {
        test('should test regex matches', () => {
            assert.matches('hello123', /\d+/);
            assert.matches('test@example.com', /\w+@\w+\.\w+/);
        });

        test('should fail when pattern not matched', () => {
            assert.throws(() => {
                assert.matches('hello', /\d+/);
            });
        });
    });

    describe('property assertions', () => {
        test('should test object properties', () => {
            const obj = { name: 'test', age: 25 };
            assert.hasProperty(obj, 'name');
            assert.hasProperty(obj, 'age');
        });

        test('should fail when property missing', () => {
            assert.throws(() => {
                assert.hasProperty({}, 'missing');
            });
        });
    });

    describe('array inclusion assertions', () => {
        test('should test includesAllOf', () => {
            assert.includesAllOf([1, 2, 3, 4, 5], [2, 4]);
            assert.includesAllOf(['a', 'b', 'c'], ['a', 'c']);
        });

        test('should test includesAnyOf', () => {
            assert.includesAnyOf([1, 2, 3], [3, 4, 5]);
            assert.includesAnyOf(['a', 'b'], ['c', 'b', 'd']);
        });

        test('should fail when no elements found', () => {
            assert.throws(() => {
                assert.includesAnyOf([1, 2, 3], [4, 5, 6]);
            });
        });
    });
});
