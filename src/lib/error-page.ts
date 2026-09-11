export function renderErrorPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Something went wrong — SME Hostels</title>
    <style>
      body { margin: 0; font-family: system-ui, sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
      .card { text-align: center; padding: 2rem; max-width: 400px; }
      h1 { font-size: 1.25rem; color: #111827; margin-bottom: 0.5rem; }
      p { color: #6b7280; font-size: 0.875rem; margin-bottom: 1.5rem; }
      a { display: inline-block; background: #16a34a; color: #fff; padding: 0.625rem 1.25rem; border-radius: 9999px; text-decoration: none; font-size: 0.875rem; font-weight: 600; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Something went wrong</h1>
      <p>An unexpected error occurred on our end. Please try again.</p>
      <a href="/">Go home</a>
    </div>
  </body>
</html>`;
}
