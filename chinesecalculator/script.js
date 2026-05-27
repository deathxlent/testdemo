const expressionDisplay = document.getElementById('expression');
const chineseExpressionDisplay = document.getElementById('chineseExpression');
const resultDisplay = document.getElementById('result');

let currentExpression = '';
let currentResult = '0';

const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
const chineseOperators = {
    '+': '加',
    '-': '减',
    '*': '乘',
    '/': '除以'
};

function numberToChinese(num) {
    if (isNaN(num)) return '无效数字';
    if (num === 0) return '零';
    
    const isNegative = num < 0;
    num = Math.abs(num);
    
    const integerPart = Math.floor(num);
    const decimalPart = num - integerPart;
    
    let result = '';
    
    if (integerPart > 0) {
        const units = ['', '十', '百', '千', '万', '十', '百', '千', '亿'];
        const digits = integerPart.toString().split('');
        let zeroFlag = false;
        
        for (let i = 0; i < digits.length; i++) {
            const digit = parseInt(digits[i]);
            const position = digits.length - 1 - i;
            
            if (digit === 0) {
                zeroFlag = true;
                if (position === 4 || position === 8) {
                    result += units[position];
                    zeroFlag = false;
                }
            } else {
                if (zeroFlag) {
                    result += '零';
                    zeroFlag = false;
                }
                if (!(digit === 1 && position === 1 && i === 0)) {
                    result += chineseNumbers[digit];
                }
                result += units[position];
            }
        }
    } else {
        result = '零';
    }
    
    if (decimalPart > 0) {
        result += '点';
        const decimalDigits = decimalPart.toFixed(10).replace(/0+$/, '').split('.')[1] || '';
        for (const d of decimalDigits) {
            result += chineseNumbers[parseInt(d)];
        }
    }
    
    return isNegative ? '负' + result : result;
}

function expressionToChinese(expr) {
    if (!expr || expr === '请输入算式') return '';
    
    let chineseExpr = expr;
    
    chineseExpr = chineseExpr.replace(/\*/g, ' 乘 ');
    chineseExpr = chineseExpr.replace(/\+/g, ' 加 ');
    chineseExpr = chineseExpr.replace(/-/g, ' 减 ');
    chineseExpr = chineseExpr.replace(/\//g, ' 除以 ');
    
    const numbers = expr.match(/-?\d+\.?\d*/g) || [];
    for (const num of numbers) {
        const numFloat = parseFloat(num);
        chineseExpr = chineseExpr.replace(num, numberToChinese(numFloat));
    }
    
    return chineseExpr;
}

function updateDisplay() {
    if (currentExpression === '') {
        expressionDisplay.textContent = '请输入算式';
        chineseExpressionDisplay.textContent = '';
    } else {
        expressionDisplay.textContent = currentExpression
            .replace(/\*/g, '×')
            .replace(/\//g, '÷')
            .replace(/-/g, '－')
            .replace(/\+/g, '＋');
        chineseExpressionDisplay.textContent = expressionToChinese(currentExpression);
    }
    resultDisplay.textContent = currentResult;
}

function appendToExpression(value) {
    const lastChar = currentExpression.slice(-1);
    const operators = ['+', '-', '*', '/'];
    
    if (operators.includes(value)) {
        if (currentExpression === '' && value !== '-') {
            return;
        }
        if (operators.includes(lastChar)) {
            currentExpression = currentExpression.slice(0, -1) + value;
            updateDisplay();
            return;
        }
        if (lastChar === '.') {
            currentExpression = currentExpression.slice(0, -1) + value;
            updateDisplay();
            return;
        }
    }
    
    if (value === '.') {
        const parts = currentExpression.split(/[\+\-\*\/]/);
        const currentPart = parts[parts.length - 1];
        if (currentPart.includes('.')) {
            return;
        }
        if (currentPart === '' || operators.includes(lastChar) || lastChar === '') {
            currentExpression += '0.';
            updateDisplay();
            return;
        }
    }
    
    currentExpression += value;
    updateDisplay();
    calculatePreview();
}

function calculatePreview() {
    try {
        if (currentExpression === '' || /[\+\-\*\/]$/.test(currentExpression)) {
            return;
        }
        const result = eval(currentExpression);
        if (!isNaN(result) && isFinite(result)) {
            currentResult = formatResult(result);
        }
    } catch (e) {
    }
    updateDisplay();
}

function formatResult(num) {
    if (Number.isInteger(num)) {
        return num.toString();
    }
    const str = num.toFixed(10).replace(/\.?0+$/, '');
    return str;
}

function calculate() {
    if (currentExpression === '') {
        return;
    }
    
    try {
        let expr = currentExpression;
        
        if (/[\+\-\*\/]$/.test(expr)) {
            expr = expr.slice(0, -1);
        }
        
        const result = eval(expr);
        
        if (isNaN(result)) {
            currentResult = '无效运算';
        } else if (!isFinite(result)) {
            currentResult = '数值过大';
        } else {
            currentResult = formatResult(result);
            currentExpression = currentResult;
        }
    } catch (e) {
        currentResult = '运算错误';
    }
    
    updateDisplay();
}

function clearAll() {
    currentExpression = '';
    currentResult = '0';
    updateDisplay();
}

function backspace() {
    if (currentExpression.length > 0) {
        currentExpression = currentExpression.slice(0, -1);
        updateDisplay();
        calculatePreview();
    }
}

document.querySelectorAll('.btn-number, .btn-operator').forEach(btn => {
    btn.addEventListener('click', () => {
        appendToExpression(btn.dataset.value);
    });
});

document.querySelector('[data-action="clear"]').addEventListener('click', clearAll);
document.querySelector('[data-action="backspace"]').addEventListener('click', backspace);
document.querySelector('[data-action="calculate"]').addEventListener('click', calculate);

document.addEventListener('keydown', (e) => {
    const key = e.key;
    
    if (/[0-9]/.test(key)) {
        appendToExpression(key);
    } else if (key === '.') {
        appendToExpression('.');
    } else if (key === '+') {
        appendToExpression('+');
    } else if (key === '-') {
        appendToExpression('-');
    } else if (key === '*') {
        appendToExpression('*');
    } else if (key === '/') {
        e.preventDefault();
        appendToExpression('/');
    } else if (key === 'Enter' || key === '=') {
        e.preventDefault();
        calculate();
    } else if (key === 'Escape' || key === 'c' || key === 'C') {
        clearAll();
    } else if (key === 'Backspace') {
        backspace();
    }
});

updateDisplay();