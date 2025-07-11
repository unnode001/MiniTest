// 检查模块导入
console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

try {
    const { Calculator, AsyncMathUtils } = require('../../src/utils/math');
    console.log('Calculator imported successfully:', typeof Calculator);
    console.log('AsyncMathUtils imported successfully:', typeof AsyncMathUtils);

    describe('Module Import Test', () => {
        test('should import Calculator correctly', () => {
            const calc = new Calculator();
            console.log('Calculator instance:', calc);
            assert.true(calc instanceof Calculator);
        });
    });
} catch (error) {
    console.error('Import error:', error.message);
    console.error('Full error:', error);
}
