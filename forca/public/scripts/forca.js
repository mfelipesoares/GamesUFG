(() => {
    'use strict';

    const API = '/forca/api';
    const WORD_LENGTH = 5;

    const $ = (id) => document.getElementById(id);
    const wordEl = $('wordDisplay');
    const messageEl = $('message');
    const startBtn = $('startBtn');
    const dailyEl = $('daily');
    const keyEls = new Map([...document.querySelectorAll('.key')].map((k) => [k.dataset.key, k]));
    const parts = [1, 2, 3, 4, 5, 6].map((n) => $(`part-${n}`));

    // Estado do cliente. A palavra secreta e as regras ficam no servidor.
    const state = { game: null, busy: false, remaining: 0, limit: 5 };

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
        messageEl.className = 'message-box' + (kind ? ' ' + kind : '');
    }

    const isPlaying = () => state.game?.status === 'playing';

    function normalizeKey(value) {
        // "ç" -> "C", "á" -> "A"
        return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    }

    // ---------- renderização ----------
    function paintWord() {
        const masked = state.game?.masked ?? Array(WORD_LENGTH).fill(null);
        const lost = state.game?.status === 'lost';
        wordEl.replaceChildren(...masked.map((letter) => {
            const slot = document.createElement('div');
            slot.className = 'letter-slot';
            slot.textContent = letter ?? '';
            // Ao perder, as letras que o jogador não descobriu aparecem em vermelho.
            return slot;
        }));
        if (lost) {
            const found = new Set(state.game.correct);
            [...wordEl.children].forEach((slot, i) => {
                if (!found.has(masked[i])) slot.classList.add('missed');
            });
        }
    }

    function paintHangman() {
        const wrong = state.game?.wrongCount ?? 0;
        parts.forEach((part, i) => {
            part.classList.toggle('visible-part', i < wrong);
            part.classList.toggle('hidden-part', i >= wrong);
        });
    }

    function paintKeyboard() {
        const correct = new Set(state.game?.correct ?? []);
        const wrong = new Set(state.game?.wrong ?? []);
        keyEls.forEach((el, key) => {
            el.classList.toggle('correct', correct.has(key));
            el.classList.toggle('absent', wrong.has(key));
            el.disabled = !isPlaying() || correct.has(key) || wrong.has(key);
        });
    }

    function paint() {
        paintWord();
        paintHangman();
        paintKeyboard();
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

    function paintControls() {
        startBtn.classList.toggle('hidden', isPlaying());
        startBtn.disabled = isPlaying() || state.remaining <= 0;
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

    async function guess(letter) {
        if (state.busy || !isPlaying()) return;
        state.busy = true;
        try {
            const data = await api(`/games/${state.game.id}/guess`, {
                method: 'POST',
                body: JSON.stringify({ letter }),
            });
            state.game = data.game;
            paint();
            if (!isPlaying()) {
                state.remaining = data.remaining;
                paintPoints(data.stats.points);
                paintDaily();
                paintEndMessage();
                paintControls();
            }
        } catch (err) {
            showMessage(err.message, 'error');
        } finally {
            state.busy = false;
        }
    }

    // ---------- eventos ----------
    keyEls.forEach((el, key) => el.addEventListener('click', () => { el.blur(); guess(key); }));

    window.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
        const letter = normalizeKey(e.key);
        if (!/^[A-Z]$/.test(letter)) return;
        const el = keyEls.get(letter);
        if (el && !el.disabled) guess(letter);
    });

    startBtn.addEventListener('click', startGame);
    $('backBtn').addEventListener('click', () => { window.location.href = '/dashboard'; });

    // ---------- inicialização ----------
    async function init() {
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
