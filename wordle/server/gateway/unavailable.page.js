// Página exibida quando um microsserviço não responde.
// Fica em JS (e não em .html) para entrar no bundle do `bun build --compile`.

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
));

export function renderUnavailablePage({ label }) {
    const nome = escapeHtml(label);
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${nome} indisponível</title>
<style>
  :root { --bg:#f4f5f7; --card:#fff; --text:#1f2430; --muted:#5d6577; --accent:#2f6fed; --border:#e2e5ec; }
  @media (prefers-color-scheme: dark) {
    :root { --bg:#14161c; --card:#1d2029; --text:#eceef4; --muted:#9aa2b5; --accent:#6c9bff; --border:#2c3040; }
  }
  * { box-sizing: border-box; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         padding:16px; background:var(--bg); color:var(--text);
         font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif; }
  main { width:100%; max-width:440px; text-align:center; background:var(--card);
         border:1px solid var(--border); border-radius:16px; padding:32px 24px; }
  .icon { font-size:48px; line-height:1; margin-bottom:12px; }
  h1 { font-size:1.4rem; margin:0 0 8px; }
  p { margin:0 0 24px; color:var(--muted); line-height:1.5; }
  .actions { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
  a, button { font:inherit; font-weight:600; padding:12px 20px; border-radius:10px; cursor:pointer;
              text-decoration:none; border:1px solid var(--accent); }
  button { background:var(--accent); color:#fff; }
  a { background:transparent; color:var(--accent); }
</style>
</head>
<body>
<main>
  <div class="icon" aria-hidden="true">🛠️</div>
  <h1>${nome} indisponível</h1>
  <p>Não conseguimos falar com este serviço agora. Ele pode estar reiniciando. Tente novamente em instantes.</p>
  <div class="actions">
    <button type="button" onclick="location.reload()">Tentar novamente</button>
    <a href="/dashboard">Voltar ao início</a>
  </div>
</main>
</body>
</html>`;
}
