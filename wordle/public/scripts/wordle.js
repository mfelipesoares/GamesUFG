(() => {
    'use strict';

    const API = '/wordle/api';
    const ROWS = 6;
    const COLS = 5;
    const REVEAL_STEP_MS = 250;

    const $ = (id) => document.getElementById(id);
    const boardEl = $('board');
    const messageEl = $('message');
    const startBtn = $('startBtn');
    const dailyEl = $('daily');
    const keyEls = new Map([...document.querySelectorAll('.key')].map((k) => [k.dataset.key, k]));

    // Estado do cliente. A palavra secreta e a validação ficam no servidor.
    const state = { game: null, draft: '', busy: false, remaining: 0, limit: 5 };
    const tiles = [];
    const rowEls = [];

    // ---------- util ----------
    async function api(path, options = {}) {
        const res = await fetch(API + path, {
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        if (res.status === 401) {
            // Sessão expirada/encerrada: volta ao login.
            window.location.replace('/');
            throw new Error('Não autenticado.');
        }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            const err = new Error(data.error || 'Erro inesperado. Tente novamente.');
            err.status = res.status;
            throw err;
        }
        return data;
    }

    function showMessage(text, kind = '') {
        messageEl.textContent = text;
        messageEl.className = 'message' + (kind ? ' ' + kind : '');
    }

    const isPlaying = () => state.game?.status === 'playing';

    function normalizeKey(value) {
        // "ç" -> "C", "á" -> "A"
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    }

    // ---------- renderização ----------
    function buildBoard() {
        for (let r = 0; r < ROWS; r++) {
            const rowEl = document.createElement('div');
            rowEl.className = 'board-row';
            rowEl.setAttribute('role', 'row');
            const rowTiles = [];
            for (let c = 0; c < COLS; c++) {
                const tile = document.createElement('div');
                tile.className = 'tile';
                tile.setAttribute('role', 'gridcell');
                rowEl.appendChild(tile);
                rowTiles.push(tile);
            }
            boardEl.appendChild(rowEl);
            tiles.push(rowTiles);
            rowEls.push(rowEl);
        }
    }

    // animateRow: índice da linha recém-avaliada (recebe a animação de revelar).
    function paint(animateRow = -1) {
        const attempts = state.game?.attempts ?? [];
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const tile = tiles[r][c];
                let letter = '';
                let result = '';
                if (r < attempts.length) {
                    letter = attempts[r].word[c];
                    result = attempts[r].result[c];
                } else if (r === attempts.length && isPlaying()) {
                    letter = state.draft[c] || '';
                }
                tile.textContent = letter;
                tile.className = 'tile' + (result ? ' ' + result : '') + (letter && !result ? ' filled' : '');
                if (r === animateRow) {
                    tile.classList.add('reveal');
                    tile.style.animationDelay = `${c * 100}ms`;
                } else {
                    tile.style.animationDelay = '';
                }
            }
        }
        paintKeyboard();
    }

    function paintKeyboard() {
        const rank = { absent: 1, present: 2, correct: 3 };
        const best = {};
        for (const attempt of state.game?.attempts ?? []) {
            [...attempt.word].forEach((letter, i) => {
                const res = attempt.result[i];
                if (!best[letter] || rank[res] > rank[best[letter]]) best[letter] = res;
            });
        }
        keyEls.forEach((el, key) => {
            el.classList.remove('correct', 'present', 'absent');
            if (best[key]) el.classList.add(best[key]);
        });
    }

    function paintDaily() {
        dailyEl.textContent = `Jogos restantes hoje: ${state.remaining}/${state.limit}`;
    }

    function paintPoints(points) {
        $('userPoints').textContent = `${points ?? 0} pontos`;
    }

    function paintProfile(user, points) {
        const name = user?.name || 'Jogador';
        $('userName').textContent = name;
        $('userInitial').textContent = name.trim().charAt(0).toUpperCase() || 'J';
        paintPoints(points);
        const avatar = $('userAvatar');
        if (user?.picture && !avatar.getAttribute('src')) {
            avatar.addEventListener('load', () => { avatar.classList.remove('hidden'); $('userInitial').classList.add('hidden'); });
            avatar.addEventListener('error', () => avatar.classList.add('hidden'));
            avatar.src = user.picture;
        }
    }

    // Mostra o botão de novo jogo (ou o aviso de limite) conforme o estado atual.
    function paintControls() {
        const canStart = !isPlaying() && state.remaining > 0;
        startBtn.classList.toggle('hidden', isPlaying());
        startBtn.disabled = !canStart;
        startBtn.textContent = state.game ? 'Novo jogo' : 'Começar';
    }

    function paintEndMessage() {
        const g = state.game;
        if (!g || g.status === 'playing') return;
        if (g.status === 'won') showMessage(`Parabéns, você venceu! 🎉 +${g.score} pontos`, 'ok');
        else showMessage(`Fim de jogo! A palavra era: ${g.word}`, 'error');
        if (state.remaining === 0) {
            messageEl.textContent += ` Você usou todos os seus ${state.limit} jogos de hoje. Volte amanhã!`;
        }
    }

    // ---------- ações ----------
    async function refreshSummary() {
        const me = await api('/me');
        state.remaining = me.remaining;
        state.limit = me.dailyLimit;
        paintProfile(me.user, me.stats.points);
        paintDaily();
    }

    async function startGame() {
        if (state.busy) return;
        state.busy = true;
        startBtn.disabled = true;
        try {
            const data = await api('/games', { method: 'POST' });
            state.game = data.game;
            state.draft = '';
            state.remaining = data.remaining;
            showMessage('');
            paintDaily();
            paint();
        } catch (err) {
            showMessage(err.message, 'error');
            if (err.status === 429) state.remaining = 0;
        } finally {
            state.busy = false;
            paintControls();
        }
    }

    async function submitGuess() {
        if (state.busy || !isPlaying()) return;
        if (state.draft.length < COLS) {
            showMessage('Palavra muito curta!', 'error');
            const row = rowEls[state.game.attempts.length];
            row.classList.remove('shake');
            void row.offsetWidth; // reinicia a animação
            row.classList.add('shake');
            return;
        }

        state.busy = true;
        showMessage('');
        try {
            const data = await api(`/games/${state.game.id}/guess`, {
                method: 'POST',
                body: JSON.stringify({ word: state.draft }),
            });
            state.game = data.game;
            state.draft = '';
            paint(state.game.attempts.length - 1);

            if (!isPlaying()) {
                state.remaining = data.remaining;
                paintPoints(data.stats.points);
                paintDaily();
                // Espera a animação das letras antes de mostrar o resultado.
                setTimeout(() => { paintEndMessage(); paintControls(); }, COLS * 100 + REVEAL_STEP_MS);
            }
        } catch (err) {
            showMessage(err.message, 'error');
        } finally {
            state.busy = false;
        }
    }

    function handleKey(key) {
        if (state.busy || !isPlaying()) return;
        if (key === 'ENTER') return submitGuess();
        if (key === 'BACK') {
            state.draft = state.draft.slice(0, -1);
            showMessage('');
            return paint();
        }
        if (/^[A-Z]$/.test(key) && state.draft.length < COLS) {
            state.draft += key;
            showMessage('');
            paint();
        }
    }

    // ---------- eventos ----------
    keyEls.forEach((el, key) => {
        el.addEventListener('click', () => {
            el.blur(); // senão o Enter do teclado físico "clicaria" de novo nesta tecla
            handleKey(key);
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.target === startBtn && e.key === 'Enter') return;
        if (e.key === 'Enter') { e.preventDefault(); handleKey('ENTER'); }
        else if (e.key === 'Backspace') { e.preventDefault(); handleKey('BACK'); }
        else if (e.key.length === 1) {
            const letter = normalizeKey(e.key);
            if (/^[A-Z]$/.test(letter)) handleKey(letter);
        }
    });

    startBtn.addEventListener('click', startGame);
    $('backBtn').addEventListener('click', () => { window.location.href = '/dashboard'; });

    // ---------- inicialização ----------
    async function init() {
        buildBoard();
        paint();
        try {
            await refreshSummary();
            const { game } = await api('/games/current');
            state.game = game;
            paint();
            if (!game) {
                showMessage(state.remaining > 0
                    ? 'Clique em "Começar" para jogar.'
                    : `Você usou todos os seus ${state.limit} jogos de hoje. Volte amanhã!`);
            } else if (game.status !== 'playing') {
                paintEndMessage();
            }
        } catch (err) {
            showMessage(err.message, 'error');
        }
        paintControls();
    }

    init();
})();
