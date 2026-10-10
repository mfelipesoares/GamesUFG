// Callback chamado pelo Google Identity Services (data-callback no HTML).
// Precisa estar no escopo global (window).
window.handleCredentialResponse = async function (response) {
    const result = document.getElementById('result');
    const show = (msg, isError = true) => {
        result.textContent = msg;
        result.className = isError ? 'error' : '';
        result.setAttribute('role', isError ? 'alert' : 'status');
    };

    show('Verificando sua conta...', false);

    try {
        const res = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'same-origin',
            body: JSON.stringify({ token: response.credential }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            show(data.error || 'Não foi possível entrar. Tente novamente.');
            return;
        }

        window.location.replace(data.redirect || '/dashboard');
    } catch (err) {
        show('Falha de comunicação com o servidor. Verifique sua conexão e tente novamente.');
    }
};
