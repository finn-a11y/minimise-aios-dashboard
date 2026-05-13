import tenantConfig from '../../tenant.config.json';

/**
 * Returns the per-tenant config (read from tenant.config.json at the repo root).
 *
 * Returned shape:
 *   {
 *     tenant_id:   string (uuid),
 *     tenant_slug: string,
 *     tenant_name: string,
 *     tagline:     string | null,
 *     logo_path:   string,
 *     accent_hex:  string | null,
 *     live_url:    string
 *   }
 *
 * The config is statically imported at build time — no network fetch. Forking
 * a new client = edit tenant.config.json + rebuild.
 */
export function useTenant() {
  return tenantConfig;
}
