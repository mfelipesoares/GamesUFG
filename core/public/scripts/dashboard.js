document.addEventListener('DOMContentLoaded', async () => {
    const $ = (id) => document.getElementById(id);

    // --- Sessão: carrega o usuário ou volta ao login ---
    try {
        const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (!res.ok) throw new Error('unauthenticated');
        const { user } = await res.json();
        const firstName = (user.name || 'Jogador').split(' ')[0];

        document.querySelector('.player-name').textContent = user.name || 'Jogador';
        document.querySelector('.profile-menu-name').textContent = user.name || 'Jogador';
        const avatar = $('player-avatar');
        if (avatar && user.picture) {
            avatar.src = user.picture;
            avatar.alt = 'Foto de ' + (user.name || 'perfil');
            avatar.addEventListener('load', () => avatar.classList.remove('hidden'));
            avatar.addEventListener('error', () => avatar.classList.add('hidden'));
        }
        document.querySelector('.welcome h1 span').textContent = firstName + '!';
    } catch {
        window.location.replace('/');
        return;
    }
    const playButtons = document.querySelectorAll('.play-button');

    playButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.href = `/${btn.dataset.game}`;
        });
    });
    async function logout() {
        try {
            await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
        } finally {
            window.location.replace('/');
        }
    }
    $('logout-button')?.addEventListener('click', logout);
    $('profile-logout')?.addEventListener('click', logout);

    // --- Menu de perfil e menu lateral (mobile) ---
    const profileBtn = $('profile-button');
    const profileMenu = $('profile-menu');
    profileBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        profileMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', () => profileMenu?.classList.add('hidden'));
    const menuToggle = $('menu-toggle');
    menuToggle?.addEventListener('click', () => {
        const open = $('sidebar').classList.toggle('open');
        menuToggle.setAttribute('aria-expanded', String(open));
    });
});

