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
export declare function fetchExecutors(): Promise<Executor[]>;
export declare function getStatusEmoji(exp: Executor): string;
export declare function getStatusText(exp: Executor): string;
export declare function getPlatformEmoji(platform: string): string;
//# sourceMappingURL=executors.d.ts.map