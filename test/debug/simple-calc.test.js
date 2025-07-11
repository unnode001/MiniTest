const { Calculator } = require('../../src/utils/math');

describe('Simple Calculator Test', () => {
    let calculator;

    beforeEach(() => {
        console.log('beforeEach: creating new Calculator');
        calculator = new Calculator();
        console.log('beforeEach: calculator created:', calculator);
    });

    test('should create calculator instance', () => {
        console.log('test: calculator is:', calculator);
        assert.true(calculator instanceof Calculator);
    });

    test('should add numbers', () => {
        console.log('test: calculator before add:', calculator);
        const result = calculator.add(5, 3);
        console.log('test: add result:', result);
        assert.equal(result, 8);
    });
});
