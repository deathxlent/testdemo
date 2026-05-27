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
    
    const numStr = num.toString();
    
    if (numStr.includes('e')) {
        return (isNegative ? '负' : '') + numStr;
    }
    
    if (num >= 1e16) {
        return (isNegative ? '负' : '') + num.toExponential(6).replace(/\.?0+e/, 'e');
    }
    
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
        let decimalStr = decimalPart.toFixed(10).replace(/\.?0+$/, '').split('.')[1] || '';
        if (decimalStr.length > 10) {
            decimalStr = decimalStr.substring(0, 10);
        }
        for (const d of decimalStr) {
            result += chineseNumbers[parseInt(d)];
        }
    }
    
    return isNegative ? '负' + result : result;
}

function expressionToChinese(expr) {
    if (!expr || expr === '请输入算式') return '';
    
    let result = '';
    let i = 0;
    
    while (i < expr.length) {
        const char = expr[i];
        
        if (char === '-' && (i === 0 || /[\+\-\*\/]/.test(expr[i - 1]))) {
            let numStr = '-';
            i++;
            while (i < expr.length && (/[0-9.]/.test(expr[i]))) {
                numStr += expr[i];
                i++;
            }
            const num = parseFloat(numStr);
            result += numberToChinese(num);
        } else if (/[0-9.]/.test(char)) {
            let numStr = '';
            while (i < expr.length && (/[0-9.]/.test(expr[i]))) {
                numStr += expr[i];
                i++;
            }
            const num = parseFloat(numStr);
            result += numberToChinese(num);
        } else if (char === '+') {
            result += ' 加 ';
            i++;
        } else if (char === '-') {
            result += ' 减 ';
            i++;
        } else if (char === '*') {
            result += ' 乘 ';
            i++;
        } else if (char === '/') {
            result += ' 除以 ';
            i++;
        } else {
            result += char;
            i++;
        }
    }
    
    return result;
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
        if (Math.abs(num) >= 1e16) {
            return num.toExponential(6).replace(/\.?0+e/, 'e');
        }
        return num.toString();
    }
    
    const absNum = Math.abs(num);
    
    if (absNum >= 1e16) {
        return num.toExponential(6).replace(/\.?0+e/, 'e');
    }
    
    if (absNum < 1e-10 && absNum > 0) {
        return num.toExponential(6).replace(/\.?0+e/, 'e');
    }
    
    let str = num.toFixed(12);
    str = str.replace(/\.?0+$/, '');
    
    const parts = str.split('.');
    if (parts[1] && parts[1].length > 10) {
        parts[1] = parts[1].substring(0, 10);
        str = parts.join('.');
    }
    
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
        
        const tokens = expr.match(/(\d+\.?\d*|[\+\-\*\/])/g) || [];
        let isDivideByZero = false;
        for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === '/' && parseFloat(tokens[i + 1]) === 0) {
                isDivideByZero = true;
                break;
            }
        }
        
        const result = eval(expr);
        
        if (isNaN(result)) {
            currentResult = '无效运算';
        } else if (!isFinite(result)) {
            if (isDivideByZero) {
                currentResult = '除数不能为零';
            } else {
                currentResult = '数值过大';
            }
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