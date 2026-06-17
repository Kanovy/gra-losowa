let stan = {
    balans: 100,
    waluta: "$",
    graAktywna: false,
    bet: 0,
    liczbaMin: 0,
    odkryteDiamenty: 0,
    minyMiejsca: [],
    odkrytePola: []
};

let staty = {
    wins: 0,
    losses: 0,
    maxWin: 0,
    maxLoss: 0,
    streak: 0,
    biezacyStreak: 0
};

function wczytajDane() {
    let lokalnePortfel = localStorage.getItem('portfel_dane');
    if (!lokalnePortfel) {
        zapiszDane();
    } else {
        let json = JSON.parse(lokalnePortfel);
        stan.balans = Math.floor(parseFloat(json.balans));
    }

    let lokalneStaty = localStorage.getItem('mines_statystyki');
    if (lokalneStaty) {
        staty = JSON.parse(lokalneStaty);
    }

    odswiezWidokBalansu();
    odswiezStatystyki();
    generujPustaSiatke();
}

function zapiszDane() {
    localStorage.setItem('portfel_dane', JSON.stringify({ balans: Math.floor(stan.balans), waluta: stan.waluta }));
    localStorage.setItem('mines_statystyki', JSON.stringify(staty));
}

function odswiezWidokBalansu() {
    document.getElementById('wallet-amount').innerHTML = Math.floor(stan.balans) + ' <span class="currency">' + stan.waluta + '</span>';
}

function odswiezStatystyki() {
    document.getElementById('stat-wins').innerText = staty.wins;
    document.getElementById('stat-losses').innerText = staty.losses;
    document.getElementById('stat-max-win').innerText = Math.floor(staty.maxWin) + " $";
    document.getElementById('stat-max-loss').innerText = Math.floor(staty.maxLoss) + " $";
    document.getElementById('stat-streak').innerText = staty.streak;
}

function pokazMenuGlowne() {
    document.getElementById('mines-view').classList.add('hidden');
    document.getElementById('games-view').classList.remove('hidden');
}

document.getElementById('open-mines').addEventListener('click', () => {
    document.getElementById('games-view').classList.add('hidden');
    document.getElementById('mines-view').classList.remove('hidden');
});

document.getElementById('logo-home').addEventListener('click', (e) => {
    e.preventDefault();
    if (stan.graAktywna) return alert("Zakończ rundę przed wyjściem!");
    pokazMenuGlowne();
});

document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    if (stan.graAktywna) return alert("Zakończ rundę przed wyjściem!");
    pokazMenuGlowne();
});

function usunKropki(e) {
    if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === '+' || e.key === '-') {
        e.preventDefault();
    }
}
document.getElementById('bet-amount').addEventListener('keydown', usunKropki);
document.getElementById('mines-count').addEventListener('keydown', usunKropki);

function generujPustaSiatke() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    for (let i = 0; i < 25; i++) {
        let tile = document.createElement('div');
        tile.classList.add('tile');
        tile.dataset.index = i;
        tile.addEventListener('click', () => kliknieciePola(i));
        board.appendChild(tile);
    }
}

function obliczMnoznik(miny, diamenty) {
    if (diamenty === 0) return 1.00;
    let n = 25;
    let prod = 1;
    for (let i = 0; i < diamenty; i++) {
        prod *= (n - miny - i) / (n - i);
    }
    return parseFloat((0.99 / prod).toFixed(2));
}

document.getElementById('start-btn').addEventListener('click', () => {
    let betInput = Math.floor(parseInt(document.getElementById('bet-amount').value));
    let countInput = Math.floor(parseInt(document.getElementById('mines-count').value));

    if (isNaN(betInput) || betInput <= 0 || betInput > stan.balans) return alert("Brak środków lub zła stawka!");
    if (isNaN(countInput) || countInput < 1 || countInput > 24) return alert("Miny: 1-24!");

    stan.balans -= betInput;
    zapiszDane();
    odswiezWidokBalansu();

    stan.graAktywna = true;
    stan.bet = betInput;
    stan.liczbaMin = countInput;
    stan.odkryteDiamenty = 0;
    stan.odkrytePola = [];
    document.getElementById('game-status-text').innerText = "Gramy...";
    document.getElementById('game-status-text').style.color = "#fff";

    stan.minyMiejsca = [];
    while (stan.minyMiejsca.length < stan.liczbaMin) {
        let los = Math.floor(Math.random() * 25);
        if (!stan.minyMiejsca.includes(los)) stan.minyMiejsca.push(los);
    }

    generujPustaSiatke();
    document.getElementById('board').classList.remove('disabled-grid');
    document.getElementById('start-btn').disabled = true;
    document.getElementById('cashout-btn').disabled = false;
    document.getElementById('current-multiplier').innerText = "1.00";
});

function kliknieciePola(idx) {
    if (!stan.graAktywna || stan.odkrytePola.includes(idx)) return;
    stan.odkrytePola.push(idx);

    const tiles = document.querySelectorAll('.tile');

    if (stan.minyMiejsca.includes(idx)) {
        tiles[idx].classList.add('mine');
        tiles[idx].innerText = "💣";
        zakonczRunde(false);
    } else {
        stan.odkryteDiamenty++;
        tiles[idx].classList.add('gem');
        tiles[idx].innerText = "💎";

        let m = obliczMnoznik(stan.liczbaMin, stan.odkryteDiamenty);
        document.getElementById('current-multiplier').innerText = m.toFixed(2);

        if (stan.odkryteDiamenty === (25 - stan.liczbaMin)) {
            zakonczRunde(true);
        }
    }
}

document.getElementById('cashout-btn').addEventListener('click', () => {
    if (stan.graAktywna && stan.odkryteDiamenty > 0) zakonczRunde(true);
});

function zakonczRunde(czyWygrana) {
    stan.graAktywna = false;
    document.getElementById('board').classList.add('disabled-grid');
    document.getElementById('start-btn').disabled = false;
    document.getElementById('cashout-btn').disabled = true;

    const tiles = document.querySelectorAll('.tile');
    let mnoznik = obliczMnoznik(stan.liczbaMin, stan.odkryteDiamenty);
    let wygranaKwota = Math.floor(stan.bet * mnoznik);

    stan.minyMiejsca.forEach(m => {
        if (!stan.odkrytePola.includes(m)) {
            tiles[m].classList.add('revealed-mine');
            tiles[m].innerText = "💣";
        }
    });

    if (czyWygrana) {
        stan.balans += wygranaKwota;
        document.getElementById('game-status-text').innerText = `+${Math.floor(wygranaKwota)}$ (${mnoznik}x)`;
        document.getElementById('game-status-text').style.color = "#00ff88";

        staty.wins++;
        let profit = wygranaKwota - stan.bet;
        if (profit > staty.maxWin) staty.maxWin = profit;
        staty.biezacyStreak++;
        if (staty.biezacyStreak > staty.streak) staty.streak = staty.biezacyStreak;
    } else {
        document.getElementById('game-status-text').innerText = `-${Math.floor(stan.bet)}$`;
        document.getElementById('game-status-text').style.color = "#ff3333";

        staty.losses++;
        if (stan.bet > staty.maxLoss) staty.maxLoss = stan.bet;
        staty.biezacyStreak = 0;
    }

    zapiszDane();
    odswiezWidokBalansu();
    odswiezStatystyki();
}

document.getElementById('reset-btn').addEventListener('click', function() {
    localStorage.removeItem('portfel_dane');
    localStorage.removeItem('mines_statystyki');
    location.reload();
});

document.querySelector('.add-funds-btn').addEventListener('click', function() {
    stan.balans += 50;
    zapiszDane();
    odswiezWidokBalansu();
});

window.onload = wczytajDane;