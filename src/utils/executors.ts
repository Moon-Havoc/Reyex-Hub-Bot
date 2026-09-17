import { Logger } from './logger.js';

export interface Executor {
  id: string;
  title: string;
  version: string;
  platform: string;
  detected: boolean;
  updateStatus: boolean;
  free: boolean;
  cost?: string;
  websitelink?: string;
  discordlink?: string;
  uncStatus: boolean;
  suncPercentage?: number;
  uncPercentage?: number;
  decompiler?: boolean;
  multiInject?: boolean;
  clientmods?: boolean;
  raknet?: boolean;
  beta: boolean;
  unknown: boolean;
  possibleBanwave: boolean;
  hasIssues: boolean;
  detectionReason?: string;
  updatedDate: string;
}

const API_URL = 'https://whatexpsare.online/api/status/exploits';

export async function fetchExecutors(): Promise<Executor[]> {
  try {
    const response = await fetch(API_URL, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      Logger.error(`WEAO API error: ${response.status}`);
      return [];
    }

    const data = await response.json() as any[];

    return data.map((e: any) => ({
      id: e._id,
      title: e.title,
      version: e.version,
      platform: e.platform || 'Unknown',
      detected: e.detected ?? false,
      updateStatus: e.updateStatus ?? false,
      free: e.free ?? false,
      cost: e.cost,
      websitelink: e.websitelink,
      discordlink: e.discordlink,
      uncStatus: e.uncStatus ?? false,
      suncPercentage: e.suncPercentage,
      uncPercentage: e.uncPercentage,
      decompiler: e.decompiler ?? false,
      multiInject: e.multiInject ?? false,
      clientmods: e.clientmods ?? false,
      raknet: e.raknet ?? false,
      beta: e.beta ?? false,
      unknown: e.unknown ?? false,
      possibleBanwave: e.possibleBanwave ?? false,
      hasIssues: e.hasIssues ?? false,
      detectionReason: e.detectionReason,
      updatedDate: e.updatedDate || 'Unknown',
    }));
  } catch (error) {
    Logger.error('Error fetching executors from WEAO:', error);
    return [];
  }
}

export function getStatusEmoji(exp: Executor): string {
  if (exp.unknown) return '❔';
  if (exp.detected) return '🔴';
  if (exp.updateStatus) return '🟢';
  return '🟡';
}

export function getStatusText(exp: Executor): string {
  if (exp.unknown) return 'Unknown';
  if (exp.detected) return 'Detected';
  if (exp.updateStatus) return 'Updated';
  return 'Pending Update';
}

export function getPlatformEmoji(platform: string): string {
  switch (platform.toLowerCase()) {
    case 'windows': return '🪟';
    case 'mac': return '🍎';
    case 'android': return '🤖';
    case 'ios': return '📱';
    default: return '💻';
  }
}
