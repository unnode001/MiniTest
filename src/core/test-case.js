/**
 * 测试用例类
 */
class TestCase {
    constructor(name, fn, timeout = 5000) {
        this.name = name;
        this.fn = fn;
        this.timeout = timeout;
        this.status = 'pending'; // pending, running, passed, failed, skipped
        this.error = null;
        this.duration = 0;
    }

    /**
     * 运行测试用例
     */
    async run() {
        this.status = 'running';
        const startTime = Date.now();

        try {
            await this.executeWithTimeout();
            this.status = 'passed';
        } catch (error) {
            this.status = 'failed';
            this.error = error;
        }

        this.duration = Date.now() - startTime;
    }

    /**
     * 带超时控制的执行
     */
    async executeWithTimeout() {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Test timeout after ${this.timeout}ms`));
            }, this.timeout);

            Promise.resolve(this.fn()).then(resolve).catch(reject).finally(() => {
                clearTimeout(timer);
            });
        });
    }
}

module.exports = { TestCase };
