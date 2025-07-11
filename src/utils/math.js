/**
 * 简单的计算器模块
 */
class Calculator {
    constructor() {
        this.history = [];
    }

    add(a, b) {
        const result = a + b;
        this.history.push({ operation: 'add', operands: [a, b], result });
        return result;
    }

    subtract(a, b) {
        const result = a - b;
        this.history.push({ operation: 'subtract', operands: [a, b], result });
        return result;
    }

    multiply(a, b) {
        const result = a * b;
        this.history.push({ operation: 'multiply', operands: [a, b], result });
        return result;
    }

    divide(a, b) {
        if (b === 0) {
            throw new Error('Division by zero is not allowed');
        }
        const result = a / b;
        this.history.push({ operation: 'divide', operands: [a, b], result });
        return result;
    }

    power(base, exponent) {
        const result = Math.pow(base, exponent);
        this.history.push({ operation: 'power', operands: [base, exponent], result });
        return result;
    }

    getHistory() {
        return [...this.history]; // 返回副本
    }

    clearHistory() {
        this.history = [];
    }

    getLastResult() {
        return this.history.length > 0 ? this.history[this.history.length - 1].result : 0;
    }
}

/**
 * 异步数学计算工具
 */
class AsyncMathUtils {
    static async factorial(n) {
        return new Promise((resolve, reject) => {
            if (n < 0) {
                reject(new Error('Factorial is not defined for negative numbers'));
                return;
            }

            setTimeout(() => {
                let result = 1;
                for (let i = 2; i <= n; i++) {
                    result *= i;
                }
                resolve(result);
            }, 10); // 模拟异步操作
        });
    }

    static async isPrime(n) {
        return new Promise((resolve) => {
            setTimeout(() => {
                if (n < 2) {
                    resolve(false);
                    return;
                }

                for (let i = 2; i <= Math.sqrt(n); i++) {
                    if (n % i === 0) {
                        resolve(false);
                        return;
                    }
                }
                resolve(true);
            }, 5);
        });
    }
}

module.exports = { Calculator, AsyncMathUtils };
