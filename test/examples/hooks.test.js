// 钩子函数测试示例
describe('Hooks Test', () => {
    let counter = 0;
    let setupData = null;

    beforeAll(() => {
        setupData = { initialized: true };
        console.log('  beforeAll: Setup completed');
    });

    afterAll(() => {
        console.log('  afterAll: Cleanup completed');
    });

    beforeEach(() => {
        counter = 0;
        console.log('  beforeEach: Reset counter');
    });

    afterEach(() => {
        console.log('  afterEach: Test completed');
    });

    test('should have setup data', () => {
        assert.true(setupData.initialized);
        assert.equal(counter, 0);
    });

    test('should increment counter', () => {
        counter++;
        assert.equal(counter, 1);
    });

    test('counter should be reset', () => {
        assert.equal(counter, 0);
        counter += 5;
        assert.equal(counter, 5);
    });
});
