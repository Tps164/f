// ==========================================
// ВАШ ТОКЕН (Я оставил тот, что вы прислали)
const API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6Ijg3NTNiODhlLTE5ZWUtNGM2MC04NDcyLTlkYjc5MDBjMWYwNCIsImlhdCI6MTc2Nzc3MjA0MCwic3ViIjoiZGV2ZWxvcGVyL2Q0MjcyODk2LTBhMjYtODNkOS01MGQzLTgzZTczMzQyZGM5MiIsInNjb3BlcyI6WyJicmF3bHN0YXJzIl0sImxpbWl0cyI6W3sidGllciI6ImRldmVsb3Blci9zaWx2ZXIiLCJ0eXBlIjoidGhyb3R0bGluZyJ9LHsiY2lkcnMiOlsiOTguOTMuMTY2Ljg4Il0sInR5cGUiOiJjbGllbnQifV19.EHw0MzRsMT3cDQuqFkk2AlVDyMPp_z9LGZts8dflroQLA5lh36G1xh_t7uStdeqYCwN41dnZA8ajPLu6MmjvLA';
// ==========================================

const APP = {
    currentPlayerId: null,
    data: null,
    brawlers: [],
    // Используем спец. прокси от RoyaleAPI, он лучше работает с CORS
    apiUrl: 'https://bsproxy.royaleapi.dev/v1/players/%23',
    
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

    const savedId = localStorage.getItem('bs_player_id');
    if (savedId) {
        APP.currentPlayerId = savedId;
        performLogin(savedId);
    } else {
        showScreen('welcome-screen');
    }

    document.getElementById('btn-login').addEventListener('click', handleLoginInput);
    document.getElementById('btn-refresh').addEventListener('click', () => performLogin(APP.currentPlayerId));
    document.getElementById('btn-logout').addEventListener('click', handleLogout);
    
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
    
    // Пытаемся получить данные
    const success = await loadRealData(tag);
    
    if (success) {
        showScreen('app-container');
        renderAll();
    } else {
        // ЕСЛИ ОШИБКА - ВОЗВРАЩАЕМ НА ГЛАВНУЮ (Никаких демо-данных!)
        showScreen('welcome-screen');
        // Текст ошибки уже показан в функции loadRealData через Toast
    }
}

// === ЗАПРОС К API ===

async function loadRealData(tag) {
    // Прямой запрос через RoyaleAPI Proxy (без corsproxy.io)
    const url = APP.apiUrl + tag;
    
    try {
        console.log("Fetching:", url);
        
        const response = await fetch(url, { 
            method: 'GET', 
            headers: {
                'Authorization': `Bearer ${API_TOKEN}`,
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            console.error('API Error:', response.status);
            
            if (response.status === 403) {
                showToast("⛔ Ошибка доступа (403). Токен не подходит к IP.");
                // ВАЖНО: Токен привязан к IP 98.93.166.88. 
                // Если запрос идет не с этого IP, сервер его отклонит.
            } else if (response.status === 404) {
                showToast("🔍 Игрок с таким тегом не найден.");
            } else if (response.status === 429) {
                showToast("⏳ Слишком много запросов. Подождите.");
            } else {
                showToast(`❌ Ошибка сервера: ${response.status}`);
            }
            return false;
        }

        const data = await response.json();
        
        // Проверка на всякий случай, вернул ли сервер корректную структуру
        if (!data || !data.name) {
             showToast("❌ Пришли пустые данные");
             return false;
        }

        APP.data = data;
        APP.brawlers = data.brawlers;
        return true;

    } catch (error) {
        console.error('Network Error:', error);
        showToast("🌐 Ошибка сети или CORS. Проверьте интернет.");
        return false;
    }
}

// === УТИЛИТЫ (Toast, Render...) ===

function showToast(msg) {
    // Удаляем старые тосты
    const old = document.querySelector('.toast-msg');
    if(old) old.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-msg';
    toast.textContent = msg;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

function renderAll() {
    // Данные точно есть, иначе мы бы сюда не попали
    document.getElementById('header-username').textContent = APP.data.name;
    document.getElementById('header-tag').textContent = APP.data.tag;
    
    document.getElementById('home-trophies').textContent = (APP.data.trophies || 0).toLocaleString();
    document.getElementById('home-max-trophies').textContent = (APP.data.highestTrophies || 0).toLocaleString();
    document.getElementById('home-exp-level').textContent = APP.data.expLevel || 0;
    
    document.getElementById('home-3v3').textContent = APP.data['3vs3Victories'] || 0;
    document.getElementById('home-solo').textContent = APP.data.soloVictories || 0;
    document.getElementById('home-duo').textContent = APP.data.duoVictories || 0;

    renderBrawlersList(APP.brawlers);
    renderProgress();
}

function renderProgress() {
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
    APP.ui.navItems.forEach(n => n.classList.remove('act
