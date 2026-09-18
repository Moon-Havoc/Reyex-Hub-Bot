import { Logger } from './logger.js';

// ─── Types ────────────────────────────────────────────────────

export interface Executor {
  id:               string;
  title:            string;
  version:          string;
  platform:         string;
  detected:         boolean;
  updateStatus:     boolean;   // true = updated to current Roblox version
  unknown:          boolean;   // true = detection status is truly unknown
  unknownDetection: boolean;   // true = may or may not be detected
  free:             boolean;
  cost?:            string;
  purchaselink?:    string;
  websitelink?:     string;
  discordlink?:     string;
  uncStatus:        boolean;
  suncPercentage?:  number;
  uncPercentage?:   number;
  decompiler:       boolean;
  multiInject:      boolean;
  clientmods:       boolean;
  raknet:           boolean;
  beta:             boolean;
  keysystem:        boolean;
  possibleBanwave:  boolean;
  hasIssues:        boolean;
  detectionReason?: string;
  updatedDate:      string;
  rbxversion?:      string;
  index:            number;    // WEAO's display order
  hidden:           boolean;   // not meant for public display
  unlinked:         boolean;   // delisted from WEAO
}

// ─── API fetcher ──────────────────────────────────────────────

const API_URL = 'https://whatexpsare.online/api/status/exploits';

export async function fetchExecutors(): Promise<Executor[]> {
  try {
    const response = await fetch(API_URL, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      Logger.error(`WEAO API error: HTTP ${response.status}`);
      return [];
    }

    const data = await response.json() as Record<string, unknown>[];

    return data
      .map((e): Executor => ({
        id:               String(e._id ?? ''),
        title:            String(e.title ?? 'Unknown'),
        version:          String(e.version ?? '?'),
        platform:         String(e.platform ?? 'Unknown'),
        detected:         Boolean(e.detected),
        updateStatus:     Boolean(e.updateStatus),
        unknown:          Boolean(e.unknown),
        unknownDetection: Boolean(e.unknownDetection),
        free:             Boolean(e.free),
        cost:             e.cost  ? String(e.cost)  : undefined,
        purchaselink:     e.purchaselink ? String(e.purchaselink) : undefined,
        websitelink:      e.websitelink  ? String(e.websitelink)  : undefined,
        discordlink:      e.discordlink  ? String(e.discordlink)  : undefined,
        uncStatus:        Boolean(e.uncStatus),
        suncPercentage:   typeof e.suncPercentage === 'number' ? e.suncPercentage : undefined,
        uncPercentage:    typeof e.uncPercentage  === 'number' ? e.uncPercentage  : undefined,
        decompiler:       Boolean(e.decompiler),
        multiInject:      Boolean(e.multiInject),
        clientmods:       Boolean(e.clientmods),
        raknet:           Boolean(e.raknet),
        beta:             Boolean(e.beta),
        keysystem:        Boolean(e.keysystem),
        possibleBanwave:  Boolean(e.possibleBanwave),
        hasIssues:        Boolean(e.hasIssues),
        detectionReason:  e.detectionReason ? String(e.detectionReason) : undefined,
        updatedDate:      String(e.updatedDate ?? 'Unknown'),
        rbxversion:       e.rbxversion ? String(e.rbxversion) : undefined,
        index:            typeof e.index === 'number' ? e.index : 999,
        hidden:           Boolean(e.hidden),
        unlinked:         Boolean(e.unlinked),
      }))
      // Filter out hidden / delisted entries — they're not public
      .filter(e => !e.hidden && !e.unlinked);
  } catch (error) {
    Logger.error('Error fetching executors from WEAO', error);
    return [];
  }
}

// ─── Status helpers ───────────────────────────────────────────

/**
 * Status priority:
 *   unknown / unknownDetection → ❔ Unknown
 *   detected                   → 🔴 Detected
 *   updateStatus && !detected  → 🟢 Updated
 *   !updateStatus && !detected → 🟡 Pending Update
 */
export function getStatusEmoji(exp: Executor): string {
  if (exp.unknown || exp.unknownDetection) return '❔';
  if (exp.detected)     return '🔴';
  if (exp.updateStatus) return '🟢';
  return '🟡';
}

export function getStatusText(exp: Executor): string {
  if (exp.unknown || exp.unknownDetection) return 'Unknown';
  if (exp.detected)     return 'Detected';
  if (exp.updateStatus) return 'Updated';
  return 'Pending Update';
}

export function getPlatformEmoji(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'windows': return '🪟';
    case 'mac':     return '🍎';
    case 'android': return '🤖';
    case 'ios':     return '📱';
    default:        return '💻';
  }
}
