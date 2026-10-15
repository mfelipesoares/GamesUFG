(() => {
    'use strict';

    const API = '/ranking/api';
    const $ = (id) => document.getElementById(id);
    const boardEl = $('board');
    const messageEl = $('message');
    const tabs = [...document.querySelectorAll('.tab')];

    let currentGame = 'all';
    let requestId = 0; // descarta respostas antigas se o usuário trocar de aba rápido

    const GAME_NAMES = { forca: 'Forca', wordle: 'Wordle' };

    function showMessage(text, kind = '') {
        messageEl.textContent = text;
        messageEl.className = 'message' + (kind ? ' ' + kind : '');
    }

    async function load(game) {
        const res = await fetch(`${API}/ranking?game=${encodeURIComponent(game)}`, { credentials: 'same-origin' });
        if (res.status === 401) {
            window.location.replace('/');
            throw new Error('Não autenticado.');
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Não foi possível carregar o ranking.');
        return data;
    }

    function makeAvatar(name, picture) {
        const avatar = document.createElement('div');
        avatar.className = 'avatar';
        const initial = document.createElement('span');
        initial.textContent = (name || 'J').trim().charAt(0).toUpperCase() || 'J';
        avatar.appendChild(initial);
        if (picture) {
            const img = document.createElement('img');
            img.className = 'avatar-img hidden';
            img.alt = '';
            img.referrerPolicy = 'no-referrer';
            img.addEventListener('load', () => { img.classList.remove('hidden'); initial.classList.add('hidden'); });
            img.src = picture;
            avatar.appendChild(img);
        }
        return avatar;
    }

    function renderRow(entry) {
        const li = document.createElement('li');
        li.className = 'row' + (entry.isMe ? ' me' : '') + (entry.position <= 3 ? ` p${entry.position}` : '');

        const pos = document.createElement('div');
        pos.className = 'pos';
        pos.textContent = `${entry.position}º`;

        const who = document.createElement('div');
        who.className = 'who';
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = entry.isMe ? `${entry.name} (você)` : entry.name;
        const sub = document.createElement('span');
        sub.className = 'sub';
        sub.textContent = `${entry.wins} ${entry.wins === 1 ? 'vitória' : 'vitórias'} em ${entry.played} ${entry.played === 1 ? 'partida' : 'partidas'}`;
        who.append(name, sub);

        const points = document.createElement('div');
        points.className = 'points';
        points.textContent = entry.points;
        const unit = document.createElement('small');
        unit.textContent = 'pontos';
        points.appendChild(unit);

        li.append(pos, makeAvatar(entry.name, entry.picture), who, points);
        return li;
    }

    function render(data) {
        // Cabeçalho (usuário logado)
        const name = data.user?.name || 'Jogador';
        $('userName').textContent = name;
        $('userInitial').textContent = name.trim().charAt(0).toUpperCase() || 'J';
        const avatar = $('userAvatar');
        if (data.user?.picture && !avatar.getAttribute('src')) {
            avatar.addEventListener('load', () => { avatar.classList.remove('hidden'); $('userInitial').classList.add('hidden'); });
            avatar.src = data.user.picture;
        }
        const total = data.byGame.forca.points + data.byGame.wordle.points;
        $('userPoints').textContent = `${total} pontos`;

        // Cartão "sua posição"
        const meCard = $('meCard');
        if (data.me) {
            meCard.classList.remove('hidden');
            $('mePosition').textContent = `${data.me.position}º`;
            let detail = `${data.me.points} pontos · ${data.me.wins}/${data.me.played} vitórias · ${data.totalPlayers} ${data.totalPlayers === 1 ? 'jogador' : 'jogadores'}`;
            if (data.game === 'all') {
                detail += ` · Forca ${data.byGame.forca.points} + Wordle ${data.byGame.wordle.points}`;
            }
            $('meDetail').textContent = detail;
        } else {
            meCard.classList.add('hidden');
        }

        boardEl.replaceChildren(...data.entries.map(renderRow));
        if (data.entries.length === 0) {
            const where = data.game === 'all' ? '' : ` na ${GAME_NAMES[data.game]}`;
            showMessage(`Ninguém pontuou${where} ainda. Seja o primeiro!`);
        } else {
            showMessage('');
        }
    }

    async function select(game) {
        currentGame = game;
        tabs.forEach((t) => {
            const active = t.dataset.game === game;
            t.classList.toggle('active', active);
            t.setAttribute('aria-selected', String(active));
        });
        const mine = ++requestId;
        try {
            const data = await load(game);
            if (mine === requestId) render(data);
        } catch (err) {
            if (mine === requestId) showMessage(err.message, 'error');
        }
    }

    tabs.forEach((t) => t.addEventListener('click', () => select(t.dataset.game)));
    $('backBtn').addEventListener('click', () => { window.location.href = '/dashboard'; });

    select(currentGame);
})();
