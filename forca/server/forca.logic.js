// "Ç" -> "C", "Á" -> "A": a comparação é sem acento (as palavras do jogo não têm acento).
export function normalizeLetter(value) {
    return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().trim();
}

export function isValidLetter(letter) {
    return /^[A-Z]$/.test(letter);
}

export const wrongLetters = (word, guesses) => guesses.filter((l) => !word.includes(l));
export const correctLetters = (word, guesses) => guesses.filter((l) => word.includes(l));

export function isWon(word, guesses) {
    return [...word].every((l) => guesses.includes(l));
}

// Vitória: 100 pontos, menos 10 por erro cometido (50 a 100). Derrota: 0.
export function scoreForWin(wrongCount) {
    return Math.max(100 - wrongCount * 10, 0);
}
