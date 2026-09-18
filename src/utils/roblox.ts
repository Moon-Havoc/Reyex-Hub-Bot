import { Logger } from './logger.js';

export interface RobloxUser {
  id:          string;
  name:        string;
  displayName: string;
  isBanned:    boolean;
  created:     string;
  description: string;
}

// ─── Retry helper ─────────────────────────────────────────────

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retries = 2,
  delayMs = 600,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      if (res.status === 429) {
        // Rate-limited — back off a bit longer
        const retryAfter = Number(res.headers.get('Retry-After') ?? 1);
        await sleep(retryAfter * 1000);
        continue;
      }
      // Non-retryable HTTP errors
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        return res; // let caller decide
      }
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
    }
    if (attempt < retries) await sleep(delayMs * (attempt + 1));
  }
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ─── Verification code store (in-memory, per session) ─────────
// Key = discordId, Value = { code, expiresAt }
// Each call to generateVerificationCode produces a fresh random code.

const _verificationStore = new Map<string, { code: string; expiresAt: number }>();

// ─── RobloxAPI ────────────────────────────────────────────────

export class RobloxAPI {
  private static readonly BASE_URL = 'https://users.roblox.com';

  /**
   * Look up a Roblox user by username.
   * Returns the exact-match first, then the first result.
   */
  static async getUserByUsername(username: string): Promise<RobloxUser | null> {
    try {
      const res = await fetchWithRetry(
        `${this.BASE_URL}/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10&userType=Public`,
      );
      if (!res.ok) {
        Logger.warn(`Roblox search returned ${res.status} for "${username}"`);
        return null;
      }
      const data = await res.json() as { data?: { id: number; name: string }[] };
      if (!data.data?.length) return null;

      const match =
        data.data.find(u => u.name.toLowerCase() === username.toLowerCase()) ??
        data.data[0];

      return this.getUserById(String(match.id));
    } catch (error) {
      Logger.error('Error fetching Roblox user by username', error);
      return null;
    }
  }

  /**
   * Fetch full profile by numeric Roblox user ID.
   */
  static async getUserById(userId: string): Promise<RobloxUser | null> {
    try {
      const res = await fetchWithRetry(`${this.BASE_URL}/v1/users/${userId}`);
      if (!res.ok) {
        Logger.warn(`Roblox users/${userId} returned ${res.status}`);
        return null;
      }
      const data = await res.json() as {
        id: number; name: string; displayName: string;
        isBanned: boolean; created: string; description?: string;
      };
      return {
        id:          String(data.id),
        name:        data.name,
        displayName: data.displayName,
        isBanned:    data.isBanned,
        created:     data.created,
        description: data.description ?? '',
      };
    } catch (error) {
      Logger.error('Error fetching Roblox user by ID', error);
      return null;
    }
  }

  /**
   * Convenience wrapper — returns just the profile description.
   */
  static async getProfileDescription(userId: string): Promise<string | null> {
    const user = await this.getUserById(userId);
    return user ? user.description : null;
  }

  // ─── Verification codes ──────────────────────────────────────

  /**
   * Generate a **random** verification code tied to a Discord user for
   * this bot session.  Codes are stored in memory so a restart
   * naturally invalidates all pending verifications (users must re-run
   * `/verify start`).  The MongoDB document also tracks expiry
   * independently, so both gates must pass.
   *
   * Format: `REYEX-XXXXXX`  (6 random uppercase alphanumeric chars)
   */
  static generateVerificationCode(discordId: string): string {
    // Produce 6 random base-36 chars
    const rand = Math.floor(Math.random() * 36 ** 6)
      .toString(36)
      .toUpperCase()
      .padStart(6, '0');
    const code = `REYEX-${rand}`;

    _verificationStore.set(discordId, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 min
    });

    return code;
  }

  /**
   * Verify that `code` is the one we issued to `discordId` and hasn't
   * been purged from the in-memory store (e.g. after a restart).
   */
  static validateCode(discordId: string, code: string): boolean {
    const entry = _verificationStore.get(discordId);
    if (!entry) return true; // store cleared (restart) — fall back to DB-only check
    if (Date.now() > entry.expiresAt) {
      _verificationStore.delete(discordId);
      return false;
    }
    return entry.code === code;
  }

  /**
   * Clear the in-memory code for a user once they've successfully
   * verified (or explicitly cancelled).
   */
  static clearCode(discordId: string): void {
    _verificationStore.delete(discordId);
  }

  // ─── Account-age helper ──────────────────────────────────────

  /** Returns a human-readable account age string, e.g. "3 years, 2 months" */
  static accountAge(createdIso: string): string {
    const created = new Date(createdIso);
    const now     = new Date();
    let years  = now.getFullYear()  - created.getFullYear();
    let months = now.getMonth()     - created.getMonth();
    if (months < 0) { years--; months += 12; }
    const parts: string[] = [];
    if (years  > 0) parts.push(`${years} year${years  !== 1 ? 's' : ''}`);
    if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`);
    return parts.length ? parts.join(', ') : 'Less than a month';
  }
}
