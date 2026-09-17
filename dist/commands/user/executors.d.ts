import { Executor } from '../../utils/executors.js';
export declare function formatExecutorForEmbed(exp: Executor): {
    title: string;
    version: string;
    platform: string;
    detected: boolean;
    updated: boolean;
    free: boolean;
    cost: string | undefined;
    websitelink: string | undefined;
    discordlink: string | undefined;
    uncStatus: boolean;
    suncPercentage: number | undefined;
    uncPercentage: number | undefined;
    decompiler: boolean | undefined;
    multiInject: boolean | undefined;
    possibleBanwave: boolean;
    hasIssues: boolean;
    detectionReason: string | undefined;
    updatedDate: string;
    statusEmoji: string;
    statusText: string;
    platformEmoji: string;
};
declare const _default: {
    data: import("discord.js").SlashCommandOptionsOnlyBuilder;
    execute(interaction: any): Promise<void>;
};
export default _default;
//# sourceMappingURL=executors.d.ts.map