import { Logger } from './logger.js';
const API_URL = 'https://whatexpsare.online/api/status/exploits';
export async function fetchExecutors() {
    try {
        const response = await fetch(API_URL, {
            headers: { 'Accept': 'application/json' },
        });
        if (!response.ok) {
            Logger.error(`WEAO API error: ${response.status}`);
            return [];
        }
        const data = await response.json();
        return data.map((e) => ({
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
    }
    catch (error) {
        Logger.error('Error fetching executors from WEAO:', error);
        return [];
    }
}
export function getStatusEmoji(exp) {
    if (exp.unknown)
        return '❔';
    if (exp.detected)
        return '🔴';
    if (exp.updateStatus)
        return '🟢';
    return '🟡';
}
export function getStatusText(exp) {
    if (exp.unknown)
        return 'Unknown';
    if (exp.detected)
        return 'Detected';
    if (exp.updateStatus)
        return 'Updated';
    return 'Pending Update';
}
export function getPlatformEmoji(platform) {
    switch (platform.toLowerCase()) {
        case 'windows': return '🪟';
        case 'mac': return '🍎';
        case 'android': return '🤖';
        case 'ios': return '📱';
        default: return '💻';
    }
}
//# sourceMappingURL=executors.js.map