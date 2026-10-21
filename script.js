// --- НАСТРОЙКИ ИГРЫ ---
const letters = "АВЕКМНОРСТУХ";
const regions = ["01", "02", "23", "34", "47", "50", "61", "77", "78", "99", "102", "116", "123", "150", "164", "177", "196", "199", "750", "777", "799", "977", "999"];

let coins = parseInt(localStorage.getItem('coins')) || 500; // Стартовый баланс
let spins = parseInt(localStorage.getItem('spins')) || 100;
let collection = JSON.parse(localStorage.getItem('collection')) || [];

// DOM Элементы
const ui = {
    coin: document.getElementById('coinCount'),
    spin: document.getElementById('spinCount'),
    btn: document.getElementById('spinBtn'),
    letter1: document.getElementById('plateLetter1'),
    num: document.getElementById('plateNumber'),
    letter2: document.getElementById('plateLetter2'),
    letter3: document.getElementById('plateLetter3'),
    region: document.getElementById('plateRegion'),
    status: document.getElementById('statusText'),
    rarity: document.getElementById('rarityText'),
    plateBox: document.getElementById('plateContainer'),
    collGrid: document.getElementById('collectionGrid'),
    gameScreen: document.getElementById('gameScreen'),
    collScreen: document.getElementById('collectionScreen'),
};

// --- ФУНКЦИИ ---

// Обновление UI
function updateUI() {
    ui.coin.textContent = coins;
    ui.spin.textContent = spins;
    localStorage.setItem('coins', coins);
    localStorage.setItem('spins', spins);
    localStorage.setItem('collection', JSON.stringify(collection));
}

// Генератор случайного элемента
const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDigit = () => Math.floor(Math.random() * 10);

// Определение редкости
function getRarity(numStr, letterStr) {
    // Легендарные (001, 777, 999 или буквы ААА, ХХХ)
    if (numStr === "001" || numStr === "777" || numStr === "999" || letterStr === "ААА" || letterStr === "ХХХ") {
        return { name: "Легендарный", class: "legendary", color: "var(--legendary)", reward: 500 };
    }
    // Редкие (повторы типа 111, 222 или 007)
    if (numStr[0] === numStr[1] && numStr[1] === numStr[2] || numStr === "007") {
        return { name: "Редкий", class: "rare", color: "var(--rare)", reward: 150 };
    }
    // Необычные (есть повторяющиеся цифры)
    if (numStr[0] === numStr[1] || numStr[1] === numStr[2] || numStr[0] === numStr[2]) {
        return { name: "Необычный", class: "uncommon", color: "var(--uncommon)", reward: 50 };
    }
    // Обычные
    return { name: "Обычный", class: "common", color: "var(--common)", reward: 10 };
}

// Создание случайного номера
function generatePlate() {
    const l1 = random(letters);
    const l2 = random(letters);
    const l3 = random(letters);
    const n1 = randomDigit();
    const n2 = randomDigit();
    const n3 = randomDigit();
    const reg = random(regions);
    
    return {
        l1, l2, l3,
        num: `${n1}${n2}${n3}`,
        reg: reg,
        lettersStr: `${l1}${l2}${l3}`
    };
}

// Анимация прокрутки
function spin() {
    if (spins <= 0 && coins < 10) {
        alert("Недостаточно средств! (Нужно 10 монет или прокрутка)");
        return;
    }

    if (spins > 0) {
        spins--;
    } else {
        coins -= 10; // Стоимость крутки
    }
    
    updateUI();
    ui.btn.disabled = true;
    ui.btn.textContent = "Крутим...";
    ui.plateBox.querySelector('.plate').classList.add('spinning');
    
    let ticks = 0;
    const maxTicks = 25; // Количество кадров анимации
    let currentPlate;

    const interval = setInterval(() => {
        currentPlate = generatePlate();
        updatePlateVisuals(currentPlate);
        ticks++;
    }, 50);

    // Остановка
    setTimeout(() => {
        clearInterval(interval);
        ui.plateBox.querySelector('.plate').classList.remove('spinning');
        
        // Финальный номер
        const finalPlate = generatePlate();
        updatePlateVisuals(finalPlate);
        
        const rarityData = getRarity(finalPlate.num, finalPlate.lettersStr);
        
        // Обновляем текст статуса
        ui.status.textContent = `Ты выбил: ${finalPlate.l1} ${finalPlate.num} ${finalPlate.l2}${finalPlate.l3} ${finalPlate.reg}`;
        ui.rarity.textContent = rarityData.name;
        ui.rarity.className = `rarity-${rarityData.class}`;
        
        // Начисляем награду
        coins += rarityData.reward;
        
        // Добавляем в коллекцию
        addToCollection(finalPlate, rarityData);
        
        ui.btn.disabled = false;
        ui.btn.textContent = spins > 0 ? `Крутить номер (Осталось: ${spins})` : "Крутить номер (10 🪙)";
        updateUI();
        
    }, 1500); // Крутится 1.5 секунды
}

// Обновление визуала номера
function updatePlateVisuals(plate) {
    ui.letter1.textContent = plate.l1;
    ui.num.textContent = plate.num;
    ui.letter2.textContent = plate.l2;
    ui.letter3.textContent = plate.l3;
    ui.region.textContent = plate.reg;
}

// Добавление в коллекцию
function addToCollection(plate, rarityData) {
    // Сохраняем только уникальные или если редкость высокая
    const plateString = `${plate.l1} ${plate.num} ${plate.l2}${plate.l3} ${plate.reg}`;
    
    const newItem = {
        text: plateString,
        rarity: rarityData.name,
        color: rarityData.color
    };
    
    collection.unshift(newItem); // Добавляем в начало
    if (collection.length > 50) collection.pop(); // Ограничиваем хранилище 50 шт.
    
    renderCollection();
}

// Отрисовка коллекции
function renderCollection() {
    ui.collGrid.innerHTML = '';
    collection.forEach(item => {
        const div = document.createElement('div');
        div.className = 'coll-item';
        div.style.borderTopColor = item.color;
        div.innerHTML = `
            <div class="mini-plate">${item.text}</div>
            <div style="font-size: 10px; color: ${item.color}; margin-top: 5px;">${item.rarity}</div>
        `;
        ui.collGrid.appendChild(div);
    });
}

// --- НАВИГАЦИЯ (Табы) ---
document.getElementById('navGame').addEventListener('click', () => {
    ui.gameScreen.style.display = 'flex';
    ui.collScreen.style.display = 'none';
    document.getElementById('navGame').classList.add('active');
    document.getElementById('navCollection').classList.remove('active');
});

document.getElementById('navCollection').addEventListener('click', () => {
    ui.gameScreen.style.display = 'none';
    ui.collScreen.style.display = 'flex';
    document.getElementById('navCollection').classList.add('active');
    document.getElementById('navGame').classList.remove('active');
});

ui.btn.addEventListener('click', spin);

// Инициализация при загрузке
updateUI();
renderCollection();
ui.btn.textContent = spins > 0 ? `Крутить номер (Осталось: ${spins})` : "Крутить номер (10 🪙)";
