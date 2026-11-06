export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>AUTEM — Página no disponible</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #161513; color: #f5f2eb; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 32rem; width: 100%; text-align: center; padding: 2.5rem 1.5rem; }
      .badge { display: inline-flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(197, 160, 89, 0.35); background: rgba(197, 160, 89, 0.12); color: #dfb86c; font-size: 0.65rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 1.25rem; }
      h1 { font-family: Georgia, serif; font-weight: 300; font-size: 2.2rem; margin: 0 0 0.75rem; letter-spacing: -0.02em; }
      p { color: #9c978e; font-size: 0.95rem; line-height: 1.6; margin: 0 0 2rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.75rem 1.5rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; cursor: pointer; text-decoration: none; transition: all 0.2s ease; }
      .primary { background: #c5a059; color: #161513; border: none; }
      .primary:hover { background: #dfb86c; }
      .secondary { background: rgba(255, 255, 255, 0.05); color: #f5f2eb; border: 1px solid rgba(255, 255, 255, 0.15); }
      .secondary:hover { border-color: #c5a059; color: #dfb86c; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="badge">AUTEM Studio</div>
      <h1>No se pudo cargar la página</h1>
      <p>Ocurrió una interrupción temporal al cargar este espacio. Puedes intentar recargar o regresar al inicio.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Reintentar</button>
        <a class="secondary" href="${import.meta.env.BASE_URL}">Volver al inicio</a>
      </div>
    </div>
  </body>
</html>`;
}
