// === KONSTANTS & STATE ===
const APP = {
    currentPlayerId: null,
    data: null, // Хранилище данных игрока
    brawlers: [], // Список бойцов
    ui: {
        screens: document.querySelectorAll('.screen'),
        tabs: document.querySelectorAll('.tab-content'),
        navItems: document.querySelectorAll('.nav-item')
    }
};

// === INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
    // Проверка Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    // Проверка сохраненного ID
    const savedId = localStorage.getItem('bs_player_id');
    if (savedId) {
        APP.currentPlayerId = savedId;
        login(savedId);
    } else {
        showScreen('welcome-screen');
    }

    // Слушатели событий
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    document.getElementById('btn-refresh').addEventListener('click', () => loadData(APP.currentPlayerId));
    document.getElementById('btn-back').addEventListener('click', () => {
        document.getElementById('brawler-detail-screen').style.display = 'none';
    });
    
    // Навигация по табам
    APP.ui.navItems.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = btn.getAttribute('data-tab');
            switchTab(targetId);
        });
    });

    // Поиск и сортировка
    document.getElementById('brawler-search').addEventListener('input', filterBrawlers);
    document.getElementById('brawler-sort').addEventListener('change', sortBrawlers);
});

// === NAVIGATION ===
function showScreen(id) {
    APP.ui.screens.forEach(s => s.classList.remove('active'));
    const target = document.getElementById(id);
    if(target) target.classList.add('active');
}

function switchTab(tabId) {
    // UI Updates
    APP.ui.tabs.forEach(t => t.classList.remove('active'));
    APP.ui.navItems.forEach(n => n.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

// === LOGIN LOGIC ===
function handleLogin() {
    let input = document.getElementById('player-tag').value.trim().toUpperCase();
    if (!input) return;
    
    // Очистка от решетки если есть
    if (input.startsWith('#')) input = input.substring(1);
    
    // Простейшая валидация (Brawl Stars теги содержат определенные символы)
    const isValid = /^[0289PYLQGRJCUV]+$/.test(input); 
    
    if (input.length < 3) {
        showLoginError("Слишком короткий ID");
        return;
    }

    // Сохраняем и грузим
    localStorage.setItem('bs_player_id', input);
    APP.currentPlayerId = input;
    login(input);
}

function showLoginError(msg) {
    const err = document.getElementById('login-error');
    err.textContent = msg;
    err.style.display = 'block';
    setTimeout(() => err.style.display = 'none', 3000);
}

async function login(tag) {
    showScreen('loader-screen');
    await loadData(tag);
    showScreen('app-container');
    renderAll();
}

// === DATA FETCHING (MOCK + REAL STRUCTURE) ===
async function loadData(tag) {
    // В реальном приложении здесь был бы запрос к вашему прокси-серверу
    // const response = await fetch(`https://your-proxy.com/v1/players/%23${tag}`);
    
    // ИМИТАЦИЯ ЗАГРУЗКИ (MOCK DATA)
    return new Promise(resolve => {
        setTimeout(() => {
            APP.data = generateMockData(tag);
            APP.brawlers = APP.data.brawlers;
            resolve();
        }, 1500); // Задержка 1.5 сек для эффекта загрузки
    });
}

// ГЕНЕРАТОР ТЕСТОВЫХ ДАННЫХ
function generateMockData(tag) {
    return {
        name: "BRAWL_GOD",
        tag: "#" + tag,
        trophies: 24500,
        highestTrophies: 25100,
        expLevel: 145,
        '3vs3Victories': 3450,
        soloVictories: 520,
        duoVictories: 890,
        brawlers: [
            { name: "SHELLY", rank: 25, trophies: 750, highestTrophies: 760, power: 11 },
            { name: "COLT", rank: 20, trophies: 500, highestTrophies: 512, power: 9 },
            { name: "EL PRIMO", rank: 22, trophies: 600, highestTrophies: 620, power: 10 },
            { name: "SPIKE", rank: 27, trophies: 850, highestTrophies: 880, power: 11 },
            { name: "CROW", rank: 15, trophies: 300, highestTrophies: 310, power: 7 },
            { name: "LEON", rank: 23, trophies: 650, highestTrophies: 670, power: 10 },
            { name: "MORTIS", rank: 21, trophies: 550, highestTrophies: 580, power: 9 },
            { name: "DYNAMIKE", rank: 18, trophies: 400, highestTrophies: 420, power: 8 },
            { name: "PIPER", rank: 24, trophies: 700, highestTrophies: 715, power: 11 }
        ]
    };
}

// === RENDERING ===
function renderAll() {
    renderHeader();
    renderHome();
    renderBrawlersList(APP.brawlers);
    renderModes();
    renderProgress();
}

function renderHeader() {
    document.getElementById('header-username').textContent = APP.data.name;
    document.getElementById('header-tag').textContent = APP.data.tag;
}

function renderHome() {
    // Анимация чисел
    animateValue("home-trophies", 0, APP.data.trophies, 1000);
    document.getElementById('home-max-trophies').textContent = APP.data.highestTrophies;
    document.getElementById('home-exp-level').textContent = APP.data.expLevel;
    
    document.getElementById('home-3v3').textContent = APP.data['3vs3Victories'];
    document.getElementById('home-solo').textContent = APP.data.soloVictories;
    document.getElementById('home-duo').textContent = APP.data.duoVictories;
}

function renderBrawlersList(list) {
    const container = document.getElementById('brawlers-list');
    container.innerHTML = '';
    
    document.getElementById('brawlers-count').textContent = `${list.length}/${APP.data.brawlers.length}`;

    list.forEach(b => {
        const el = document.createElement('div');
        el.className = 'brawler-card';
        // Используем заглушку для изображений, в реальном проекте нужен маппинг ID -> URL
        const imgUrl = `https://cdn.fandomwikis.com/brawlstars/images/3/3d/Shelly_Portrait.png`; // Пример для Шелли, здесь нужна логика подстановки
        
        el.innerHTML = `
            <div class="b-img-container">
                <!-- В демо используем цветной блок вместо реальных картинок для всех -->
                <div style="width:100%; height:100%; background: linear-gradient(45deg, var(--bg-secondary), var(--accent)); display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:bold; opacity:0.8;">
                    ${b.name[0]}
                </div>
            </div>
            <div class="b-info">
                <div class="b-name">${b.name}</div>
                <div class="b-stats">
                    <span class="b-trophy">🏆 ${b.trophies}</span>
                    <span>R${b.rank}</span>
                </div>
            </div>
        `;
        
        el.addEventListener('click', () => openBrawlerDetail(b));
        container.appendChild(el);
    });
}

function filterBrawlers() {
    const query = document.getElementById('brawler-search').value.toLowerCase();
    const filtered = APP.brawlers.filter(b => b.name.toLowerCase().includes(query));
    renderBrawlersList(filtered);
}

function sortBrawlers() {
    const type = document.getElementById('brawler-sort').value;
    const sorted = [...APP.brawlers];
    
    if (type === 'trophies') sorted.sort((a,b) => b.trophies - a.trophies);
    if (type === 'rank') sorted.sort((a,b) => b.rank - a.rank);
    if (type === 'power') sorted.sort((a,b) => b.power - a.power);
    
    renderBrawlersList(sorted);
}

// === DETAILS & MODES ===
function openBrawlerDetail(brawler) {
    const screen = document.getElementById('brawler-detail-screen');
    document.getElementById('detail-name').textContent = brawler.name;
    document.getElementById('detail-trophies').textContent = brawler.trophies;
    document.getElementById('detail-max-trophies').textContent = brawler.highestTrophies;
    document.getElementById('detail-power').textContent = `PWR ${brawler.power}`;
    document.getElementById('detail-rank').textContent = `Rank ${brawler.rank}`;
    
    // Рассчет винрейта (фейковый для демо)
    const wr = 45 + Math.floor(Math.random() * 20);
    document.getElementById('detail-winrate').textContent = `${wr}%`;
    
    // Генерация иконок
    const iconDiv = document.createElement('div');
    iconDiv.innerHTML = `<span class="material-icons-round" style="color:var(--accent); font-size:2rem;">bolt</span>`;
    document.getElementById('detail-gears').innerHTML = '';
    document.getElementById('detail-gears').appendChild(iconDiv);

    screen.style.display = 'flex';
}

function renderModes() {
    const container = document.getElementById('modes-list');
    const modes = [
        {name: "Gem Grab", winrate: 55},
        {name: "Brawl Ball", winrate: 48},
        {name: "Heist", winrate: 62},
        {name: "Knockout", winrate: 51}
    ];
    
    container.innerHTML = modes.map(m => `
        <div class="stat-card" style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
            <div style="text-align:left;">
                <div style="font-weight:bold;">${m.name}</div>
                <div style="font-size:0.75rem; color:#aaa;">24 матча</div>
            </div>
            <div style="color:${m.winrate > 50 ? 'var(--success)' : 'var(--danger)'}; font-weight:bold;">
                ${m.winrate}% WR
            </div>
        </div>
    `).join('');
}

function renderProgress() {
    const totalBrawlers = 80; 
    const current = APP.brawlers.length;
    
    document.getElementById('prog-brawlers').textContent = `${current}/${totalBrawlers}`;
    document.getElementById('fill-brawlers').style.width = `${(current/totalBrawlers)*100}%`;
}

// Utils
function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
}
