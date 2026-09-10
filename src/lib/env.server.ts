// Reads environment variables/secrets in both local dev and Cloudflare Workers production.
//
// Cloudflare Workers: secrets are available via `process.env` when using
// @cloudflare/vite-plugin with nodejs_compat flag (which is set in wrangler.toml).
// The plugin polyfills process.env from the Workers env binding at request time.
//
// Local dev: @cloudflare/vite-plugin reads .dev.vars and injects into process.env.

export function getEnv() {
  return {
    SUPABASE_URL:              process.env.SUPABASE_URL              ?? "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    MNOTIFY_API_KEY:           process.env.MNOTIFY_API_KEY           ?? "",
    MNOTIFY_SENDER_ID:         process.env.MNOTIFY_SENDER_ID         ?? "SMEHOSTEL",
    HUBTEL_CLIENT_ID:          process.env.HUBTEL_CLIENT_ID          ?? "",
    HUBTEL_CLIENT_SECRET:      process.env.HUBTEL_CLIENT_SECRET      ?? "",
    ADMIN_SETUP_KEY:           process.env.ADMIN_SETUP_KEY           ?? "",
  };
}
