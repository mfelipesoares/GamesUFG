import { config } from './config.js';

// "Ação" -> "ACAO": o jogador pode digitar com acento; a comparação é sem acento.
export function normalizeWord(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

export function isValidGuess(word) {
    return new RegExp(`^[A-Z]{${config.wordLength}}$`).test(word);
}

// Resultado de cada letra: 'correct' (lugar certo), 'present' (existe em outro lugar), 'absent'.
// Duas passadas para tratar letras repetidas como o Wordle original:
// só marca "present" se ainda sobrar aquela letra na palavra secreta.
export function evaluateGuess(guess, target) {
    const result = Array(guess.length).fill('absent');
    const remaining = {};

    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === target[i]) result[i] = 'correct';
        else remaining[target[i]] = (remaining[target[i]] || 0) + 1;
    }
    for (let i = 0; i < guess.length; i++) {
        if (result[i] === 'correct') continue;
        if (remaining[guess[i]] > 0) {
            result[i] = 'present';
            remaining[guess[i]]--;
        }
    }
    return result;
}

// 1ª tentativa = 100 pontos, perdendo 15 a cada tentativa extra (mínimo 25).
export function scoreForWin(attemptsUsed) {
    return Math.max(100 - (attemptsUsed - 1) * 15, 25);
}
