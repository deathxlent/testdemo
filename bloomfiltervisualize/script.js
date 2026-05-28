class BloomFilter {
    constructor(size = 32, hashCount = 3, hashType = 'simple') {
        this.size = size;
        this.hashCount = hashCount;
        this.hashType = hashType;
        this.bitArray = new Array(size).fill(0);
        this.elements = new Set();
    }

    simpleHash(str, seed) {
        let hash = seed;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash) % this.size;
    }

    djb2Hash(str, seed) {
        let hash = 5381 + seed;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i);
        }
        return Math.abs(hash) % this.size;
    }

    sdbmHash(str, seed) {
        let hash = seed;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + (hash << 6) + (hash << 16) - hash;
        }
        return Math.abs(hash) % this.size;
    }

    multiHash(str, seed) {
        const hash1 = this.simpleHash(str, seed);
        const hash2 = this.djb2Hash(str, seed + 100);
        return (hash1 + seed * hash2) % this.size;
    }

    getHashPositions(element) {
        const positions = [];
        const hashFunctions = {
            simple: this.simpleHash.bind(this),
            djb2: this.djb2Hash.bind(this),
            sdbm: this.sdbmHash.bind(this),
            multi: this.multiHash.bind(this)
        };
        
        const hashFunc = hashFunctions[this.hashType] || this.simpleHash.bind(this);
        
        for (let i = 0; i < this.hashCount; i++) {
            positions.push(hashFunc(element, i * 131 + 7));
        }
        
        return positions;
    }

    add(element) {
        const positions = this.getHashPositions(element);
        const collisionInfo = [];
        
        positions.forEach(pos => {
            collisionInfo.push({
                position: pos,
                wasSet: this.bitArray[pos] === 1
            });
            this.bitArray[pos] = 1;
        });
        
        this.elements.add(element);
        return { positions, collisionInfo };
    }

    test(element) {
        const positions = this.getHashPositions(element);
        const allSet = positions.every(pos => this.bitArray[pos] === 1);
        const actuallyExists = this.elements.has(element);
        
        return {
            positions,
            probablyExists: allSet,
            definitelyNotExists: !allSet,
            actuallyExists,
            isFalsePositive: allSet && !actuallyExists
        };
    }

    reset(size, hashCount, hashType) {
        this.size = size;
        this.hashCount = hashCount;
        this.hashType = hashType;
        this.bitArray = new Array(size).fill(0);
        this.elements.clear();
    }

    getBitsSetCount() {
        return this.bitArray.filter(b => b === 1).length;
    }

    getFillRate() {
        return (this.getBitsSetCount() / this.size * 100).toFixed(1);
    }
}

class BloomVisualizer {
    constructor() {
        this.bloomFilter = new BloomFilter(32, 3, 'simple');
        this.initElements();
        this.bindEvents();
        this.renderBitArray();
        this.updateStats();
    }

    initElements() {
        this.bitArrayEl = document.getElementById('bitArray');
        this.elementInput = document.getElementById('elementInput');
        this.addBtn = document.getElementById('addBtn');
        this.testBtn = document.getElementById('testBtn');
        this.addRandomBtn = document.getElementById('addRandomBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.demoBtn = document.getElementById('demoBtn');
        this.hashDisplay = document.getElementById('hashDisplay');
        this.hashResults = document.getElementById('hashResults');
        this.resultDisplay = document.getElementById('resultDisplay');
        this.resultContent = document.getElementById('resultContent');
        this.addedElements = document.getElementById('addedElements');
        this.bitsSetEl = document.getElementById('bitsSet');
        this.totalBitsEl = document.getElementById('totalBits');
        this.fillRateEl = document.getElementById('fillRate');
        this.bitSizeInput = document.getElementById('bitSize');
        this.hashCountInput = document.getElementById('hashCount');
        this.hashTypeSelect = document.getElementById('hashType');
        this.demoResults = document.getElementById('demoResults');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addElement());
        this.testBtn.addEventListener('click', () => this.testElement());
        this.addRandomBtn.addEventListener('click', () => this.addRandomElement());
        this.resetBtn.addEventListener('click', () => this.resetFilter());
        this.demoBtn.addEventListener('click', () => this.runDemo());
        this.elementInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addElement();
        });
    }

    renderBitArray() {
        this.bitArrayEl.innerHTML = '';
        this.bloomFilter.bitArray.forEach((bit, index) => {
            const bitEl = document.createElement('div');
            bitEl.className = `bit-item ${bit === 1 ? 'set' : ''}`;
            bitEl.innerHTML = `
                <span class="bit-index">${index}</span>
                ${bit}
            `;
            bitEl.dataset.index = index;
            this.bitArrayEl.appendChild(bitEl);
        });
    }

    updateStats() {
        this.bitsSetEl.textContent = this.bloomFilter.getBitsSetCount();
        this.totalBitsEl.textContent = this.bloomFilter.size;
        this.fillRateEl.textContent = this.bloomFilter.getFillRate() + '%';
    }

    updateAddedElements() {
        if (this.bloomFilter.elements.size === 0) {
            this.addedElements.innerHTML = '<span class="empty-hint">还没有添加任何元素</span>';
            return;
        }
        
        this.addedElements.innerHTML = '';
        this.bloomFilter.elements.forEach(element => {
            const tag = document.createElement('span');
            tag.className = 'element-tag';
            tag.textContent = element;
            this.addedElements.appendChild(tag);
        });
    }

    displayHashResults(element, positions, collisionInfo = null) {
        this.hashDisplay.classList.remove('hidden');
        this.hashResults.innerHTML = '';
        
        const hashNames = ['哈希函数 A', '哈希函数 B', '哈希函数 C', '哈希函数 D', '哈希函数 E'];
        
        positions.forEach((pos, index) => {
            const item = document.createElement('div');
            item.className = 'hash-item';
            
            let collisionText = '';
            if (collisionInfo && collisionInfo[index] && collisionInfo[index].wasSet) {
                collisionText = '<span style="color: #f5576c;">(碰撞)</span>';
            }
            
            item.innerHTML = `
                <span class="hash-name">${hashNames[index] || `哈希 ${index + 1}`}</span>
                <span class="hash-value">"${element}" → </span>
                <span class="hash-position">${pos}</span>
                ${collisionText}
            `;
            this.hashResults.appendChild(item);
        });
    }

    highlightBits(positions, type = 'highlight') {
        document.querySelectorAll('.bit-item').forEach(el => {
            el.classList.remove('highlight', 'collision');
        });
        
        positions.forEach(pos => {
            const bitEl = document.querySelector(`.bit-item[data-index="${pos}"]`);
            if (bitEl) {
                bitEl.classList.add(type);
            }
        });
    }

    addElement() {
        const element = this.elementInput.value.trim();
        if (!element) return;
        
        const { positions, collisionInfo } = this.bloomFilter.add(element);
        
        this.displayHashResults(element, positions, collisionInfo);
        this.renderBitArray();
        this.highlightBits(positions, 'highlight');
        
        const hasCollision = collisionInfo.some(c => c.wasSet);
        this.showResult(
            'success',
            '✅',
            `已添加元素: "${element}"`,
            hasCollision ? '注意：部分位置发生了哈希碰撞，但这是正常现象！' : '所有哈希位置已成功设置。'
        );
        
        this.updateStats();
        this.updateAddedElements();
        this.elementInput.value = '';
        this.elementInput.focus();
    }

    testElement() {
        const element = this.elementInput.value.trim();
        if (!element) return;
        
        const result = this.bloomFilter.test(element);
        
        this.displayHashResults(element, result.positions);
        this.highlightBits(result.positions, result.isFalsePositive ? 'collision' : 'highlight');
        
        if (result.definitelyNotExists) {
            this.showResult(
                'error',
                '❌',
                `"${element}" 一定不存在`,
                '因为至少有一个哈希位置为 0，所以可以 100% 确定该元素未被添加。这就是布隆过滤器的"无漏判"特性。'
            );
        } else if (result.isFalsePositive) {
            this.showResult(
                'warning',
                '⚠️',
                `"${element}" 可能存在 (误判!)`,
                '这是一个误判（False Positive）！该元素实际上没有被添加，但所有哈希位置都被其他元素置为 1 了。这就是布隆过滤器的概率特性。'
            );
        } else {
            this.showResult(
                'success',
                '✅',
                `"${element}" 可能存在`,
                '所有哈希位置都为 1，该元素很可能已经被添加。（实际上确实存在！）'
            );
        }
        
        this.elementInput.focus();
    }

    addRandomElement() {
        const randomStr = Math.random().toString(36).substring(2, 8);
        this.elementInput.value = randomStr;
        this.addElement();
    }

    resetFilter() {
        const size = parseInt(this.bitSizeInput.value) || 32;
        const hashCount = parseInt(this.hashCountInput.value) || 3;
        const hashType = this.hashTypeSelect.value;
        
        this.bloomFilter.reset(size, hashCount, hashType);
        this.renderBitArray();
        this.updateStats();
        this.updateAddedElements();
        this.hashDisplay.classList.add('hidden');
        this.resultDisplay.classList.add('hidden');
        this.demoResults.classList.add('hidden');
        
        this.showResult(
            'success',
            '🔄',
            '过滤器已重置',
            `位数组大小: ${size}, 哈希函数数量: ${hashCount}, 哈希算法: ${hashType}`
        );
    }

    showResult(type, icon, title, desc) {
        this.resultDisplay.classList.remove('hidden', 'success', 'error', 'warning');
        this.resultDisplay.classList.add(type);
        
        this.resultContent.innerHTML = `
            <div class="result-icon">${icon}</div>
            <div class="result-title">${title}</div>
            <div class="result-desc">${desc}</div>
        `;
    }

    runDemo() {
        const testCount = 100;
        const falsePositives = [];
        
        for (let i = 0; i < testCount; i++) {
            const testStr = `test_${Math.random().toString(36).substring(2, 10)}`;
            const result = this.bloomFilter.test(testStr);
            
            if (result.isFalsePositive) {
                falsePositives.push(testStr);
            }
        }
        
        this.demoResults.classList.remove('hidden');
        document.getElementById('demoTotal').textContent = testCount;
        document.getElementById('demoFalse').textContent = falsePositives.length;
        document.getElementById('demoRate').textContent = 
            (falsePositives.length / testCount * 100).toFixed(1) + '%';
        
        const listEl = document.getElementById('falsePositiveList');
        listEl.innerHTML = '';
        
        if (falsePositives.length > 0) {
            const header = document.createElement('p');
            header.style.cssText = 'margin-bottom: 10px; color: #f44336; font-weight: bold;';
            header.textContent = '误判的元素列表:';
            listEl.appendChild(header);
            
            falsePositives.forEach(str => {
                const tag = document.createElement('span');
                tag.className = 'false-positive-tag';
                tag.textContent = str;
                listEl.appendChild(tag);
            });
        } else {
            const msg = document.createElement('p');
            msg.style.cssText = 'color: #4caf50; font-weight: bold;';
            msg.textContent = '🎉 太棒了！本次测试没有发生误判！';
            listEl.appendChild(msg);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new BloomVisualizer();
});
