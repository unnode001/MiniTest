// 异步测试示例
describe('Async Tests', () => {
    test('should handle promises', async () => {
        const data = await fetchData();
        assert.equal(data.status, 'success');
        assert.equal(data.value, 42);
    });

    test('should handle promise rejection', async () => {
        await assert.rejects(async () => {
            await fetchDataWithError();
        }, Error);
    });

    test('should handle timeout', async () => {
        const start = Date.now();
        await delay(100);
        const elapsed = Date.now() - start;
        assert.true(elapsed >= 100);
    });

    test('should resolve multiple promises', async () => {
        const promises = [
            Promise.resolve(1),
            Promise.resolve(2),
            Promise.resolve(3)
        ];

        const results = await Promise.all(promises);
        assert.deepEqual(results, [1, 2, 3]);
    });
});

// 辅助函数
function fetchData() {
    return Promise.resolve({
        status: 'success',
        value: 42
    });
}

function fetchDataWithError() {
    return Promise.reject(new Error('Network error'));
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
