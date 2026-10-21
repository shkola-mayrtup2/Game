// База данных
const REGIONS = ["01","02","03","04","05","06","07","08","09","10","11","12","13","14","15","16","17","18","19","20","21","22","23","24","25","26","27","28","29","30","31","32","33","34","35","36","37","38","39","40","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","56","57","58","59","60","61","62","63","64","65","66","67","68","69","70","71","72","73","74","75","76","77","78","79","80","81","82","83","84","85","86","87","88","89","90","91","92","93","94","95","96","97","98","99","102","103","116","123","125","126","134","136","138","142","150","152","154","156","159","161","163","164","166","173","174","177","178","186","190","193","196","197","199","750","777","799","977","999"];
const LETTERS = "АВЕКМНОРСТУХ";

// Состояние игры
let state = JSON.parse(localStorage.getItem('numGenStateV4')) || {
    coins: 1000, spins: 100, collection: [], safe: [], autoLvl: 0, luckLvl: 0,
    totalSpins: 0, quests: { spin10: false, rare1: false }
};

// DOM-элементы
const el = {
    coin: document.getElementById('coinCount'), spin: document.getElementById('spinCount'),
    title: document.getElementById('statusTitle'), rarity: document.getElementById('rarityText'),
    progress: document.getElementById('progressFill'),
    pL1: document.getElementById('pL1'), pNum: document.getElementById('pNum'), pL2: document.getElementById('pL2'), pReg: document.getElementById('pReg'),
    plate: document.getElementById('plateElement'), glow: document.getElementById('glowEffect'),
    clickArea: document.getElementById('clickArea'), floatContainer: document.getElementById('floatingContainer'),
    collGrid: document.getElementById('collectionGrid'), safeGrid: document.getElementById('safeGrid'),
    collCountText: document.getElementById('collCountText'), safeCountText: document.getElementById('safeCountText'),
    buyAuto: document.getElementById('buyAutoBtn'), buyLuck: document.getElementById('buyLuckBtn'),
    flash: document.getElementById('screenFlash'), banner: document.getElementById('rarityBanner'), bannerText: document.getElementById('bannerText'),
    particles: document.getElementById('particleContainer'), questsList: document.getElementById('questsList'),
    statsContent: document.getElementById('statsContent'), searchInput: document.getElementById('searchInput')
};
const screens = { game: document.getElementById('screen-game'), menu: document.getElementById('screen-menu'), collection: document.getElementById('screen-collection'), safe: document.getElementById('screen-safe'), shop: document.getElementById('screen-shop'), quests: document.getElementById('screen-quests'), stats: document.getElementById('screen-stats') };

// --- Генерация ---
const rand = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randDigit = () => Math.floor(Math.random() * 10);

function generateNumber() {
    let l1 = rand(LETTERS), l2 = rand(LETTERS), l3 = rand(LETTERS);
    let n1 = randDigit(), n2 = randDigit(), n3 = randDigit();
    let numStr = `${n1}${n2}${n3}`; let letStr = `${l1}${l2}${l3}`; let region = rand(REGIONS);
    let rarity = { name: "Обычный", class: "common", color: "var(--common)", reward: 15 };
    let luckBonus = state.luckLvl * 5; const rng = Math.random() * 100;

    if (numStr === "001" || numStr === "777" || numStr === "999" || letStr === "ААА" || letStr === "ХХХ" || letStr === "ООО" || letStr === "АМР" || letStr === "ЕКХ") {
        if (rng < (3 + luckBonus)) rarity = { name: "МИФИЧЕСКИЙ 🌟", class: "mythic", color: "var(--mythic)", reward: 2000 };
        else rarity = { name: "ЛЕГЕНДАРНЫЙ", class: "legendary", color: "var(--legendary)", reward: 500 };
    } else if ((numStr[0] === numStr[1] && numStr[1] === numStr[2]) || numStr === "007" || (l1 === l2 && l2 === l3) || rng < (10 + luckBonus)) {
        rarity = { name: "ЛЕГЕНДАРНЫЙ", class: "legendary", color: "var(--legendary)", reward: 500 };
    } else if ((n1 === n2 || n2 === n3 || n1 === n3) || (l1 === l2 || l2 === l3) || rng < (35 + luckBonus)) {
        rarity = { name: "РЕДКИЙ", class: "rare", color: "var(--rare)", reward: 150 };
    } else if (n1 === 0 || n3 === 0 || region === "777" || region === "99" || rng < (65 + luckBonus)) {
        rarity = { name: "Необычный", class: "uncommon", color: "var(--uncommon)", reward: 50 };
    }
    return { l1, l2, l3, num: numStr, reg: region, fullString: `${l1} ${numStr} ${l2}${l3} | ${region}`, rarity };
}

function getUniqueNumber() {
    for (let i = 0; i < 50; i++) {
        let num = generateNumber();
        if (!state.collection.find(c => c.fullString === num.fullString) && !state.safe.find(c => c.fullString === num.fullString)) return num;
    }
    return generateNumber();
}

// --- Анимации ---
function playRarityAnimation(rarityClass, color) {
    el.plate.className = 'plate'; el.flash.className = 'flash-effect'; el.banner.className = 'rarity-banner';
    el.banner.style.background = `linear-gradient(90deg, transparent, ${color}, transparent)`;
    if (rarityClass !== 'common') { void el.flash.offsetWidth; el.flash.classList.add('flash-active'); }
    setTimeout(() => {
        if (rarityClass === 'mythic') { el.plate.classList.add('anim-mythic'); el.bannerText.textContent = "МИФИЧЕСКИЙ!"; el.banner.classList.add('banner-active'); createParticles(color, 40); }
        else if (rarityClass === 'legendary') { el.plate.classList.add('anim-legendary'); el.bannerText.textContent = "ЛЕГЕНДАРНЫЙ!"; el.banner.classList.add('banner-active'); createParticles(color, 25); }
        else if (rarityClass === 'rare') { el.plate.classList.add('anim-rare'); createParticles(color, 10); }
        else if (rarityClass === 'uncommon') { el.plate.classList.add('anim-uncommon'); }
    }, 50);
}

function createParticles(color, count) {
    el.particles.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div'); p.className = 'particle'; p.style.background = color; p.style.boxShadow = `0 0 10px ${color}`;
        const angle = Math.random() * Math.PI * 2; const dist = 50 + Math.random() * 100;
        p.style.setProperty('--tx', `${Math.cos(angle) * dist}px`); p.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        el.particles.appendChild(p);
    }
}

// --- Основная логика ---
let lastClick = 0;
function spin() {
    const now = Date.now();
    if (now - lastClick < 30) return;
    lastClick = now;

    if (state.spins > 0) { state.spins--; }
    else if (state.coins >= 10) { state.coins -= 10; }
    else { el.title.textContent = "Нет монет!"; return; }

    state.totalSpins++;
    checkQuests('spin');
    const result = getUniqueNumber();
    state.coins += result.rarity.reward;

    el.pL1.textContent = result.l1; el.pNum.textContent = result.num; el.pL2.textContent = result.l2 + result.l3; el.pReg.textContent = result.reg;
    el.rarity.textContent = result.rarity.name; el.rarity.style.color = result.rarity.color;
    el.title.textContent = result.rarity.class === 'common' ? "Ждёт прокрутки" : `Выбил: ${result.rarity.name}`;

    el.progress.style.width = `${Math.min(100, (state.totalSpins % 100) + 10)}%`;
    playRarityAnimation(result.rarity.class, result.rarity.color);

    el.glow.style.opacity = "1"; el.glow.style.boxShadow = `0 0 60px 15px ${result.rarity.color}`;
    setTimeout(() => el.glow.style.opacity = "0", 600);

    if (result.rarity.class !== 'common' && el.floatContainer.children.length < 5) {
        const float = document.createElement('div'); float.className = 'floating-text'; float.style.color = result.rarity.color;
        float.textContent = `+${result.rarity.reward} ₽`; float.style.left = `${50 + (Math.random() * 20 - 10)}%`; float.style.top = `40%`;
        el.floatContainer.appendChild(float); setTimeout(() => float.remove(), 800);
    }

    if (!state.collection.find(c => c.fullString === result.fullString)) {
        state.collection.push(result); updateCollection();
        if (result.rarity.class === 'rare' || result.rarity.class === 'legendary' || result.rarity.class === 'mythic') checkQuests('rare');
    } else {
        if (!state.safe.find(c => c.fullString === result.fullString)) { state.safe.push(result); updateSafe(); el.title.textContent = "Дубликат! Номер в сейфе."; }
    }
    updateUI(); save();
}

// --- Задания ---
function checkQuests(type) {
    if (type === 'spin' && state.totalSpins >= 10 && !state.quests.spin10) { state.quests.spin10 = true; state.coins += 500; }
    if (type === 'rare' && !state.quests.rare1) { state.quests.rare1 = true; state.coins += 1000; }
    renderQuests();
}

function renderQuests() {
    el.questsList.innerHTML = `
        <div class="shop-item"><div class="shop-icon">🎰</div><div class="shop-info"><h3>Прокрутить 10 раз</h3><p>Награда: 500 ₽</p></div><div>${state.quests.spin10 ? '✅' : '⏳'}</div></div>
        <div class="shop-item"><div class="shop-icon">💎</div><div class="shop-info"><h3>Выбить редкий номер</h3><p>Награда: 1000 ₽</p></div><div>${state.quests.rare1 ? '✅' : '⏳'}</div></div>
    `;
}

// --- Интерфейс ---
function updateUI() {
    el.coin.textContent = state.coins; el.spin.textContent = state.spins;
    el.collCountText.textContent = `${state.collection.length} номеров`;
    el.safeCountText.textContent = `${state.safe.length} дубликатов`;
    const autoCost = 500 + (state.autoLvl * 1500); el.buyAuto.textContent = state.autoLvl > 0 ? `Ур. ${state.autoLvl} (${autoCost} ₽)` : `Купить (${autoCost} ₽)`; el.buyAuto.disabled = state.coins < autoCost;
    const luckCost = 300 + (state.luckLvl * 800); el.buyLuck.textContent = state.luckLvl > 0 ? `Ур. ${state.luckLvl} (${luckCost} ₽)` : `Купить (${luckCost} ₽)`; el.buyLuck.disabled = state.coins < luckCost;
    renderStats();
}

function renderGrid(gridElement, array, filter = '') {
    gridElement.innerHTML = '';
    const sorted = [...array].filter(item => item.fullString.toLowerCase().includes(filter.toLowerCase())).sort((a, b) => {
        const ranks = { 'mythic': 4, 'legendary': 3, 'rare': 2, 'uncommon': 1, 'common': 0 }; return ranks[b.rarity.class] - ranks[a.rarity.class];
    });
    sorted.forEach(item => {
        const div = document.createElement('div'); div.className = 'coll-item'; div.style.borderTopColor = item.rarity.color;
        div.innerHTML = `<div class="coll-plate">${item.l1} ${item.num} ${item.l2}${item.l3}</div><div class="coll-rarity" style="color: ${item.rarity.color}">${item.rarity.name} • ${item.reg} рег.</div>`;
        gridElement.appendChild(div);
    });
}
function updateCollection() { renderGrid(el.collGrid, state.collection, el.searchInput.value); }
function updateSafe() { renderGrid(el.safeGrid, state.safe); }

function renderStats() {
    el.statsContent.innerHTML = `
        <div><b>Всего прокруток:</b> ${state.totalSpins}</div>
        <div><b>Номеров в коллекции:</b> ${state.collection.length}</div>
        <div><b>Дубликатов в сейфе:</b> ${state.safe.length}</div>
        <div><b>Уровень удачи:</b> ${state.luckLvl}</div>
        <div><b>Уровень автокрутки:</b> ${state.autoLvl}</div>
    `;
}

// --- Навигация ---
function switchScreen(screenName) { Object.values(screens).forEach(s => s.classList.remove('active')); screens[screenName].classList.add('active'); }
document.getElementById('menuBtn').addEventListener('click', () => switchScreen('menu'));
document.getElementById('btnPlay').addEventListener('click', () => switchScreen('game'));
document.getElementById('btnCollection').addEventListener('click', () => switchScreen('collection'));
document.getElementById('btnSafe').addEventListener('click', () => switchScreen('safe'));
document.getElementById('btnShop').addEventListener('click', () => switchScreen('shop'));
document.getElementById('btnQuests').addEventListener('click', () => switchScreen('quests'));
document.getElementById('btnStats').addEventListener('click', () => switchScreen('stats'));
document.querySelectorAll('[data-back]').forEach(btn => btn.addEventListener('click', () => switchScreen('menu')));
el.clickArea.addEventListener('click', spin);
el.searchInput.addEventListener('input', updateCollection);

// --- Магазин ---
el.buyAuto.addEventListener('click', () => { const cost = 500 + (state.autoLvl * 1500); if (state.coins >= cost) { state.coins -= cost; state.autoLvl++; updateUI(); save(); startAutoSpinner(); } });
el.buyLuck.addEventListener('click', () => { const cost = 300 + (state.luckLvl * 800); if (state.coins >= cost) { state.coins -= cost; state.luckLvl++; updateUI(); save(); } });

let autoInterval;
function startAutoSpinner() { if (autoInterval) clearInterval(autoInterval); if (state.autoLvl > 0) { const speed = Math.max(100, 1000 - (state.autoLvl * 150)); autoInterval = setInterval(spin, speed); } }
function save() { localStorage.setItem('numGenStateV4', JSON.stringify(state)); }

// Запуск
updateUI(); updateCollection(); updateSafe(); renderQuests(); startAutoSpinner();
