export interface Executor {
    id: string;
    title: string;
    version: string;
    platform: string;
    detected: boolean;
    updateStatus: boolean;
    unknown: boolean;
    unknownDetection: boolean;
    free: boolean;
    cost?: string;
    purchaselink?: string;
    websitelink?: string;
    discordlink?: string;
    uncStatus: boolean;
    suncPercentage?: number;
    uncPercentage?: number;
    decompiler: boolean;
    multiInject: boolean;
    clientmods: boolean;
    raknet: boolean;
    beta: boolean;
    keysystem: boolean;
    possibleBanwave: boolean;
    hasIssues: boolean;
    detectionReason?: string;
    updatedDate: string;
    rbxversion?: string;
    index: number;
    hidden: boolean;
    unlinked: boolean;
}
export declare function fetchExecutors(): Promise<Executor[]>;
/**
 * Status priority:
 *   unknown / unknownDetection → ❔ Unknown
 *   detected                   → 🔴 Detected
 *   updateStatus && !detected  → 🟢 Updated
 *   !updateStatus && !detected → 🟡 Pending Update
 */
export declare function getStatusEmoji(exp: Executor): string;
export declare function getStatusText(exp: Executor): string;
export declare function getPlatformEmoji(platform: string): string;
//# sourceMappingURL=executors.d.ts.map