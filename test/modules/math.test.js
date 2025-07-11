const { Calculator, AsyncMathUtils } = require('../../src/utils/math');

describe('Calculator Module', () => {
    let calculator;

    beforeEach(() => {
        calculator = new Calculator();
    });

    describe('Basic Operations', () => {
        test('should add two numbers correctly', () => {
            const result = calculator.add(5, 3);
            assert.equal(result, 8);
        });

        test('should subtract two numbers correctly', () => {
            const result = calculator.subtract(10, 4);
            assert.equal(result, 6);
        });

        test('should multiply two numbers correctly', () => {
            const result = calculator.multiply(6, 7);
            assert.equal(result, 42);
        });

        test('should divide two numbers correctly', () => {
            const result = calculator.divide(15, 3);
            assert.equal(result, 5);
        });

        test('should calculate power correctly', () => {
            const result = calculator.power(2, 3);
            assert.equal(result, 8);
        });
    });

    describe('Edge Cases', () => {
        test('should handle division by zero', () => {
            assert.throws(() => {
                calculator.divide(10, 0);
            }, Error);
        });

        test('should handle negative numbers', () => {
            assert.equal(calculator.add(-5, 3), -2);
            assert.equal(calculator.multiply(-2, -3), 6);
        });

        test('should handle decimal numbers', () => {
            const result = calculator.add(0.1, 0.2);
            assert.true(Math.abs(result - 0.3) < 0.0001); // 浮点数精度处理
        });
    });

    describe('History Tracking', () => {
        test('should track operation history', () => {
            calculator.add(1, 2);
            calculator.multiply(3, 4);

            const history = calculator.getHistory();
            assert.equal(history.length, 2);
            assert.equal(history[0].operation, 'add');
            assert.deepEqual(history[0].operands, [1, 2]);
            assert.equal(history[0].result, 3);
        });

        test('should get last result', () => {
            calculator.add(10, 20);
            calculator.multiply(2, 5);

            assert.equal(calculator.getLastResult(), 10);
        });

        test('should clear history', () => {
            calculator.add(1, 1);
            calculator.clearHistory();

            assert.equal(calculator.getHistory().length, 0);
            assert.equal(calculator.getLastResult(), 0);
        });

        test('should return copy of history', () => {
            calculator.add(1, 2);
            const history1 = calculator.getHistory();
            const history2 = calculator.getHistory();

            assert.true(history1 !== history2); // 不同的对象引用
            assert.deepEqual(history1, history2); // 但内容相同
        });
    });
});

describe('AsyncMathUtils Module', () => {
    describe('Factorial Function', () => {
        test('should calculate factorial correctly', async () => {
            const result = await AsyncMathUtils.factorial(5);
            assert.equal(result, 120);
        });

        test('should handle factorial of 0', async () => {
            const result = await AsyncMathUtils.factorial(0);
            assert.equal(result, 1);
        });

        test('should handle factorial of 1', async () => {
            const result = await AsyncMathUtils.factorial(1);
            assert.equal(result, 1);
        });

        test('should reject negative numbers', async () => {
            await assert.rejects(async () => {
                await AsyncMathUtils.factorial(-1);
            }, Error);
        });
    });

    describe('Prime Number Function', () => {
        test('should identify prime numbers correctly', async () => {
            assert.true(await AsyncMathUtils.isPrime(2));
            assert.true(await AsyncMathUtils.isPrime(3));
            assert.true(await AsyncMathUtils.isPrime(5));
            assert.true(await AsyncMathUtils.isPrime(7));
            assert.true(await AsyncMathUtils.isPrime(11));
        });

        test('should identify non-prime numbers correctly', async () => {
            assert.false(await AsyncMathUtils.isPrime(1));
            assert.false(await AsyncMathUtils.isPrime(4));
            assert.false(await AsyncMathUtils.isPrime(6));
            assert.false(await AsyncMathUtils.isPrime(8));
            assert.false(await AsyncMathUtils.isPrime(9));
        });

        test('should handle edge cases', async () => {
            assert.false(await AsyncMathUtils.isPrime(0));
            assert.false(await AsyncMathUtils.isPrime(-5));
        });
    });

    describe('Combined Operations', () => {
        test('should work with calculator and async utils together', async () => {
            const calc = new Calculator();

            // 计算 5! = 120
            const factorial5 = await AsyncMathUtils.factorial(5);

            // 将阶乘结果用于计算器
            calc.add(factorial5, 10);
            assert.equal(calc.getLastResult(), 130);

            // 检查 7 是否为质数
            const isPrime7 = await AsyncMathUtils.isPrime(7);
            assert.true(isPrime7);

            // 将质数检查结果转换为数字并进行计算
            calc.multiply(calc.getLastResult(), isPrime7 ? 1 : 0);
            assert.equal(calc.getLastResult(), 130);
        });
    });
});
