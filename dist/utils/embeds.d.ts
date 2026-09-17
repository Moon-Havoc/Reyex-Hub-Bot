import { EmbedBuilder, Client, ActionRowBuilder, ButtonBuilder } from 'discord.js';
export declare const BrandColors: {
    PRIMARY: string;
    SUCCESS: string;
    ERROR: string;
    WARNING: string;
    INFO: string;
    DARK: string;
    ACCENT: string;
    MUTED: string;
};
export declare const BrandConfig: {
    FOOTER_TEXT: string;
    FOOTER_ICON: string;
    THUMBNAIL: string;
    AUTHOR_NAME: string;
    AUTHOR_ICON: string;
};
/**
 * Fetch the bot's avatar and set it as the brand icon/thumbnail.
 */
export declare function initBrandAssets(client: Client): Promise<void>;
/**
 * Core branded embed builder
 */
export declare function createBrandedEmbed(options: {
    color?: keyof typeof BrandColors | string;
    title?: string;
    description?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    thumbnail?: string;
    image?: string;
    author?: string;
    footer?: string;
    timestamp?: boolean;
}): EmbedBuilder;
export declare function createSuccessEmbed(options: {
    title: string;
    description?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}): EmbedBuilder;
export declare function createErrorEmbed(options: {
    title: string;
    description?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}): EmbedBuilder;
export declare function createWarningEmbed(options: {
    title: string;
    description?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}): EmbedBuilder;
export declare function createInfoEmbed(options: {
    title: string;
    description?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}): EmbedBuilder;
export declare function createBrandedInfoEmbed(options: {
    title: string;
    description?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}): EmbedBuilder;
export declare function createGameEmbed(options: {
    gameName: string;
    description: string;
    scriptUrl: string;
    category: string;
    usageCount?: number;
    free?: boolean;
    keyRequired?: boolean;
    mobileCompatible?: boolean;
}): EmbedBuilder;
export declare function createGamesListEmbed(options: {
    games: Array<{
        name: string;
        description: string;
        category: string;
        usageCount: number;
        free: boolean;
        keyRequired: boolean;
        mobileCompatible: boolean;
    }>;
    category?: string;
}): EmbedBuilder;
export declare function createProfileEmbed(options: {
    username: string;
    discriminator: string;
    isVerified: boolean;
    robloxUsername?: string;
    scriptsUsed: number;
    joinedAt: Date;
    lastSeen: Date;
    verifiedAt?: Date;
    lastScriptUsed?: Date;
    avatar?: string;
}): EmbedBuilder;
export declare function createStatsEmbed(options: {
    totalUsers: number;
    verifiedUsers: number;
    activeUsers: number;
    totalGames: number;
    scriptsUsed: number;
    verificationRate: number;
    activeRate: number;
}): EmbedBuilder;
export declare function createGiveawayEmbed(options: {
    name: string;
    description: string;
    prize: string;
    endTime: Date;
    participants: number;
    isActive: boolean;
    winner?: string;
}): EmbedBuilder;
export declare function createBroadcastEmbed(options: {
    title: string;
    message: string;
    author: string;
}): EmbedBuilder;
export declare function createPollEmbed(options: {
    question: string;
    options: {
        text: string;
        voters: string[];
    }[];
    createdBy: string;
    endTime?: Date;
    isActive: boolean;
}): EmbedBuilder;
export interface FormattedExecutor {
    title: string;
    version: string;
    platform: string;
    detected: boolean;
    updated: boolean;
    free: boolean;
    cost?: string;
    websitelink?: string;
    discordlink?: string;
    uncStatus: boolean;
    suncPercentage?: number;
    uncPercentage?: number;
    decompiler?: boolean;
    multiInject?: boolean;
    possibleBanwave?: boolean;
    hasIssues?: boolean;
    detectionReason?: string;
    updatedDate?: string;
    statusEmoji: string;
    statusText: string;
    platformEmoji: string;
}
export declare function createExecutorsEmbed(options: {
    executors: FormattedExecutor[];
    platformFilter?: string;
    lastUpdated: Date;
}): EmbedBuilder;
export declare function createExecutorButtons(currentPlatform?: string): ActionRowBuilder<ButtonBuilder>[];
//# sourceMappingURL=embeds.d.ts.map