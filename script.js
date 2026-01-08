// ==========================================
// ВАШ ТОКЕН API BRAWL STARS
const API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6Ijg3NTNiODhlLTE5ZWUtNGM2MC04NDcyLTlkYjc5MDBjMWYwNCIsImlhdCI6MTc2Nzc3MjA0MCwic3ViIjoiZGV2ZWxvcGVyL2Q0MjcyODk2LTBhMjYtODNkOS01MGQzLTgzZTczMzQyZGM5MiIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiOTguOTMuMTY2Ljg4Il0sInR5cGUiOiJjbGllbnQifV19.EHw0MzRsMT3cDQuqFkk2AlVDyMPp_z9LGZts8dflroQLA5lh36G1xh_t7uStdeqYCwN41dnZA8ajPLu6MmjvLA';
// ==========================================

const APP = {
    currentPlayerId: null,
    data: null,
    brawlers: [],
    // Прокси для обхода CORS (браузерной защиты)
    proxyUrl: 'https://corsproxy.io/?', 
    apiUrl: 'https://api.brawlstars.com/v1/players/%23',
    
    ui: {
        screens: document.querySelectorAll('.screen'),
        tabs: document.querySelectorAll('.tab-content'),
        navItems: document.querySelectorAll('.nav-item')
    }
};

document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }

    // Проверка сохраненного входа
    const savedId = localStorage.getItem('bs_player_id');
    if (savedId) {
        APP.currentPlayerId = savedId;
        performLogin(savedId);
    } else {
        showScreen('welcome-screen');
    }

    // Слушатели событий
    document.getElementById('btn-login').addEventListener('click', handleLoginInput);
    document.getElementById('btn-refresh').addEventListener('click', () => performLogin(APP.currentPlayerId));
    document.getElementById('btn-logout').addEventListener('click', handleLogout); // Кнопка ВЫХОД
    
    document.getElementById('btn-back').addEventListener('click', () => {
        document.getElementById('brawler-detail-screen').style.display = 'none';
    });

    APP.ui.navItems.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });

    document.getElementById('brawler-search').addEventListener('input', filterBrawlers);
    document.getElementById('brawler-sort').addEventListener('change', sortBrawlers);
});

// === ВХОД / ВЫХОД ===

function handleLoginInput() {
    let input = document.getElementById('player-tag').value.trim().toUpperCase();
    if (!input) return;
    if (input.startsWith('#')) input = input.substring(1);

    localStorage.setItem('bs_player_id', input);
    APP.currentPlayerId = input;
    performLogin(input);
}

function handleLogout() {
    localStorage.removeItem('bs_player_id');
    APP.currentPlayerId = null;
    APP.data = null;
    document.getElementById('player-tag').value = '';
    showScreen('welcome-screen');
}

async function performLogin(tag) {
    showScreen('loader-screen');
    
    // 1. Пытаемся получить реальные данные
    const success = await loadRealData(tag);
    
    if (success) {
        showScreen('app-container');
        renderAll();
    } else {
        // 2. Если не вышло (ошибка токена/IP), грузим Демо, чтобы приложение работало
        console.warn("Switching to Mock Data due to API error");
        showToast("⚠️ Ошибка доступа к API. Показан ДЕМО режим.");
        
        APP.data = generateMockData(tag);
        APP.brawlers = APP.data.brawlers;
        
        showScreen('app-container');
        renderAll();
    }
}

// === API REQUEST ===

async function loadRealData(tag) {
    // Формируем URL через прокси
    const targetUrl = APP.apiUrl + tag;
    const fullUrl = APP.proxyUrl + encodeURIComponent(targetUrl);
    
    try {
        console.log("Attempting fetch:", targetUrl);
        const response = await fetch(fullUrl, { 
            method: 'GET', 
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('API Error Status:', response.status);
            if (response.status === 403) showToast("⛔ Доступ запрещен (Неверный IP токена)");
            if (response.status === 404) showToast("🔍 Игрок не найден");
            if (response.status === 429) showToast("⏳ Слишком много запросов");
            return false;
        }

        const data = await response.json();
        APP.data = data;
        APP.brawlers = data.brawlers;
        return true;

    } catch (error) {
        console.error('Network/CORS Error:', error);
        return false;
    }
}

// === УТИЛИТЫ И РЕНДЕР (ОСТАЛИСЬ ПРЕЖНИМИ, НО ДОБАВЛЕН TOAST) ===

function showToast(msg) {
    // Создаем всплывающее уведомление
    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    // Анимация
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

function renderAll() {
    // Шапка
    document.getElementById('header-username').textContent = APP.data.name;
    document.getElementById('header-tag').textContent = APP.data.tag;
    
    // Главная
    document.getElementById('home-trophies').textContent = (APP.data.trophies || 0).toLocaleString();
    document.getElementById('home-max-trophies').textContent = (APP.data.highestTrophies || 0).toLocaleString();
    document.getElementById('home-exp-level').textContent = APP.data.expLevel || 0;
    
    document.getElementById('home-3v3').textContent = APP.data['3vs3Victories'] || 0;
    document.getElementById('home-solo').textContent = APP.data.soloVictories || 0;
    document.getElementById('home-duo').textContent = APP.data.duoVictories || 0;

    renderBrawlersList(APP.brawlers);
    
    // Прогресс
    const totalBrawlers = 84; 
    const current = APP.brawlers.length;
    document.getElementById('prog-brawlers').textContent = `${current}/${totalBrawlers}`;
    document.getElementById('fill-brawlers').style.width = `${Math.min((current/totalBrawlers)*100, 100)}%`;
}

function renderBrawlersList(list) {
    const container = document.getElementById('brawlers-list');
    container.innerHTML = '';
    document.getElementById('brawlers-count').textContent = `${list.length}/${APP.data.brawlers.length}`;

    list.forEach(b => {
        const el = document.createElement('div');
        el.className = 'brawler-card';
        const color = getRarityColor(b.rank); 
        
        el.innerHTML = `
            <div class="b-img-container">
                <div style="width:100%; height:100%; background: ${color}; display:flex; align-items:center; justify-content:center; font-size:2rem; font-weight:bold; color:rgba(0,0,0,0.5);">
                    ${b.name.substring(0, 2)}
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
        el.addEventListener('click', () => openDetail(b));
        container.appendChild(el);
    });
}

function openDetail(b) {
    document.getElementById('detail-name').textContent = b.name;
    document.getElementById('detail-trophies').textContent = b.trophies;
    document.getElementById('detail-max-trophies').textContent = b.highestTrophies;
    document.getElementById('detail-power').textContent = `PWR ${b.power}`;
    document.getElementById('detail-rank').textContent = `RANK ${b.rank}`;
    document.getElementById('brawler-detail-screen').style.display = 'flex';
}

function switchTab(id) {
    APP.ui.tabs.forEach(t => t.classList.remove('active'));
    APP.ui.navItems.forEach(n => n.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelector(`[data-tab="${id}"]`).classList.add('active');
}

function filterBrawlers() {
    const q = document.getElementById('brawler-search').value.toLowerCase();
    const filtered = APP.brawlers.filter(b => b.name.toLowerCase().includes(q));
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

function showScreen(id) {
    APP.ui.screens.forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function getRarityColor(rank) {
    if(rank < 10) return '#B9F2FF'; 
    if(rank < 20) return '#FFA'; 
    if(rank < 25) return '#C061FF'; 
    if(rank < 30) return '#00D166'; 
    return '#FFCC00'; 
}

// Запасные демо-данные (на случай сбоя токена)
function generateMockData(tag) {
    return {
        name: "DEMO_USER",
        tag: "#" + tag,
        trophies: 12500,
        highestTrophies: 13000,
        expLevel: 85,
        '3vs3Victories': 1200,
        soloVictories: 350,
        duoVictories: 400,
        brawlers: [
            { name: "SHELLY", rank: 20, trophies: 500, highestTrophies: 510, power: 9 },
            { name: "COLT", rank: 15, trophies: 300, highestTrophies: 320, power: 7 },
            { name: "SPIKE", rank: 25, trophies: 750, highestTrophies: 750, power: 11 }
        ]
    };
}
