// --- НАСТРОЙКИ ---
const LETTERS = "АВЕКМНОРСТУХ";
const REGIONS = ["01", "02", "23", "34", "47", "50", "61", "77", "78", "99", "102", "116", "123", "150", "164", "177", "196", "199", "750", "777", "799", "977", "999"];

// Загрузка сохранений (или дефолтные значения)
let state = JSON.parse(localStorage.getItem('numGenState')) || {
    coins: 0,
    spins: 50, // Бесплатные прокрутки
    collection: []
};

// DOM
const el = {
    coins: document.getElementById('coinCount'),
    spins: document.getElementById('spinCount'),
    statusTxt: document.getElementById('statusText'),
    rarityTxt: document.getElementById('rarityText'),
    pL1: document.getElementById('pL1'), pNum: document.getElementById('pNum'),
    pL2: document.getElementById('pL2'), pL3: document.getElementById('pL3'),
    pReg: document.getElementById('pReg'),
    plate: document.getElementById('plateElement'),
    glow: document.getElementById('glowEffect'),
    btn: document.getElementById('spinBtn'),
    clickArea: document.getElementById('clickArea'),
    floatContainer: document.getElementById('floatingContainer'),
    collGrid: document.getElementById('collectionGrid'),
    gameScreen: document.getElementById('gameScreen'),
    collScreen: document.getElementById('collectionScreen'),
};

// Случайные элементы
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randDigit = () => Math.floor(Math.random() * 10);

// --- ЛОГИКА ГЕНЕРАЦИИ ---
function generateNumber() {
    // 1. Генерируем базовые части
    let l1 = rand(LETTERS), l2 = rand(LETTERS), l3 = rand(LETTERS);
    let n1 = randDigit(), n2 = randDigit(), n3 = randDigit();
    let numStr = `${n1}${n2}${n3}`;
    let letStr = `${l1}${l2}${l3}`;
    let region = rand(REGIONS);
    
    // 2. Определяем редкость и награду
    let rarity = { name: "Обычный", class: "common", color: "var(--common)", reward: 10, weight: 1 };
    
    // Шансы (можно менять)
    const rng = Math.random() * 100;
    
    if ((numStr === "001" || numStr === "777" || numStr === "999" || letStr === "ААА" || letStr === "ХХХ" || letStr === "ООО") && rng < 5) {
        // МИФИЧЕСКИЙ (Золотой) - Шанс ~0.1%
        rarity = { name: "Мифический 🌟", class: "mythic", color: "var(--mythic)", reward: 1000 };
        l1 = "О"; l2 = "О"; l3 = "О"; numStr = "001"; // Принудительно красивый
    } 
    else if ((numStr[0] === numStr[1] && numStr[1] === numStr[2]) || numStr === "007" || letStr === "ААА") {
        // ЛЕГЕНДАРНЫЙ - Шанс ~1%
        rarity = { name: "Легендарный", class: "legendary", color: "var(--legendary)", reward: 300 };
    } 
    else if ((n1 === n2 || n2 === n3 || n1 === n3) || (l1 === l2 || l2 === l3)) {
        // РЕДКИЙ - Шанс ~15%
        rarity = { name: "Редкий", class: "rare", color: "var(--rare)", reward: 75 };
    }
    else if (n1 === 0 || n3 === 0 || region === "777" || region === "99") {
        // НЕОБЫЧНЫЙ - Шанс ~25%
        rarity = { name: "Необычный", class: "uncommon", color: "var(--uncommon)", reward: 30 };
    }

    return {
        l1, l2, l3,
        num: numStr,
        reg: region,
        fullString: `${l1} ${numStr} ${l2}${l3} ${region}`,
        rarity: rarity
    };
}

// --- ОТРИСОВКА И ЭФФЕКТЫ ---
function renderNumber(data) {
    el.pL1.textContent = data.l1;
    el.pNum.textContent = data.num;
    el.pL2.textContent = data.l2;
    el.pL3.textContent = data.l3;
    el.pReg.textContent = data.reg;
}

function playEffects(rarity) {
    // Обновляем текст
    el.rarityTxt.textContent = rarity.name;
    el.rarityTxt.className = `rarity-${rarity.class}`;
    
    // Свечение
    el.glow.style.opacity = "1";
    el.glow.style.boxShadow = `0 0 40px 10px ${rarity.color}`;
    
    // Тряска для редких
    if (rarity.class === 'legendary' || rarity.class === 'mythic' || rarity.class === 'rare') {
        el.plate.classList.remove('shake');
        void el.plate.offsetWidth; // Триггер рефлоу
        el.plate.classList.add('shake');
    }
    
    // Убираем свечение через время
    setTimeout(() => {
        el.glow.style.opacity = "0";
    }, 500);
}

function spawnFloatingText(text, color) {
    const div = document.createElement('div');
    div.className = 'floating-text';
    div.textContent = `+${text}`;
    div.style.color = color;
    // Случайная позиция по X
    div.style.left = `${50 + (Math.random() * 20 - 10)}%`;
    div.style.top = `40%`;
    
    el.floatContainer.appendChild(div);
    setTimeout(() => div.remove(), 800);
}

// --- ГЛАВНАЯ ФУНКЦИЯ КЛИКА ---
let lastClickTime = 0;

function spin() {
    const now = Date.now();
    
    // Защита от перегрузки: если кликают чаще чем раз в 20мс (50 кликов в сек), пропускаем
    // Это защищает от жестких автокликеров, чтобы браузер не завис
    if (now - lastClickTime < 20) return;
    lastClickTime = now;

    // Проверка баланса
    if (state.spins > 0) {
        state.spins--;
    } else if (state.coins >= 10) {
        state.coins -= 10;
    } else {
        el.statusTxt.textContent = "Не хватает монет!";
        el.btn.disabled = true;
        return;
    }

    // Генерация
    const result = generateNumber();
    
    // Начисление награды
    state.coins += result.rarity.reward;
    
    // Визуал
    renderNumber(result);
    playEffects(result.rarity);
    spawnFloatingText(result.rarity.reward, result.rarity.color);
    
    // Обновляем текст статуса (только если не спамят)
    if (result.rarity.class !== 'common') {
        el.statusTxt.textContent = `Выбил: ${result.rarity.name}!`;
    }

    // Добавляем в коллекцию (сохраняем только редкие или ограничиваем количество)
    if (result.rarity.class !== 'common' || Math.random() > 0.7) {
        addToCollection(result);
    }

    updateUI();
    saveData();
}

// --- КОЛЛЕКЦИЯ ---
function addToCollection(item) {
    // Проверка, есть ли уже такой номер
    const exists = state.collection.find(c => c.fullString === item.fullString);
    if (exists) return; // Если есть, не добавляем дубликат (или можно добавлять, тут на твой вкус)

    state.collection.unshift(item);
    if (state.collection.length > 100) state.collection.pop(); // Лимит 100
    renderCollection();
}

function renderCollection() {
    el.collGrid.innerHTML = '';
    state.collection.forEach(item => {
        const div = document.createElement('div');
        div.className = 'coll-item';
        div.style.borderTopColor = item.rarity.color;
        div.innerHTML = `
            <div class="coll-plate">${item.fullString}</div>
            <div style="font-size: 11px; font-weight: bold; color: ${item.rarity.color}; text-shadow: 0 0 5px ${item.rarity.color}">
                ${item.rarity.name}
            </div>
        `;
        el.collGrid.appendChild(div);
    });
}

// --- ИНТЕРФЕЙС ---
function updateUI() {
    el.coins.textContent = state.coins;
    el.spins.textContent = state.spins;
    
    if (state.spins > 0) {
        el.btn.textContent = `Крутить (Осталось: ${state.spins})`;
        el.btn.disabled = false;
    } else if (state.coins >= 10) {
        el.btn.textContent = `Крутить (10 🪙)`;
        el.btn.disabled = false;
    } else {
        el.btn.textContent = `Нет монет`;
        el.btn.disabled = true;
    }
}

// Сохранение (вызывается при клике, но можно оптимизировать)
let saveTimeout;
function saveData() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        localStorage.setItem('numGenState', JSON.stringify(state));
    }, 500); // Сохраняем раз в полсекунды, чтобы не грузить систему
}

// --- СОБЫТИЯ ---
el.btn.addEventListener('click', spin);
el.clickArea.addEventListener('click', spin); // Клик по номеру

// Навигация
document.getElementById('navGame').addEventListener('click', () => {
    el.gameScreen.classList.remove('hidden');
    el.collScreen.classList.add('hidden');
    document.getElementById('navGame').classList.add('active');
    document.getElementById('navColl').classList.remove('active');
});

document.getElementById('navColl').addEventListener('click', () => {
    el.gameScreen.classList.add('hidden');
    el.collScreen.classList.remove('hidden');
    document.getElementById('navColl').classList.add('active');
    document.getElementById('navGame').classList.remove('active');
});

// Инициализация
updateUI();
renderCollection();
// Показываем первый номер при загрузке
renderNumber(generateNumber());
