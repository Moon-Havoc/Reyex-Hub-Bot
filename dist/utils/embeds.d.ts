import { EmbedBuilder, Client, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } from 'discord.js';
export declare const BrandColors: {
    PRIMARY: '#DC143C';
    SUCCESS: '#2ECC71';
    ERROR: '#E74C3C';
    WARNING: '#F39C12';
    INFO: '#3498DB';
    DARK: '#1a1a1a';
    ACCENT: '#8B0000';
    MUTED: '#95A5A6';
    PURPLE: '#9B59B6';
    GOLD: '#F1C40F';
};
export type BrandColorKey = keyof typeof BrandColors;
export declare const BrandConfig: {
    FOOTER_TEXT: string;
    FOOTER_ICON: string;
    THUMBNAIL: string;
    AUTHOR_NAME: string;
    AUTHOR_ICON: string;
};
export declare function initBrandAssets(client: Client): Promise<void>;
/** Render a filled progress bar: `████░░░░ 42%` */
export declare function progressBar(percent: number, length?: number): string;
/** Inline bold progress bar field value */
export declare function progressField(percent: number, length?: number): string;
/** Pluralise: `1 vote` / `5 votes` */
export declare function plural(n: number, word: string, suffix?: string): string;
/** Unix timestamp tag shorthand */
export declare const ts: {
    relative: (d: Date) => string;
    short: (d: Date) => string;
    long: (d: Date) => string;
    date: (d: Date) => string;
};
export interface EmbedOptions {
    color?: BrandColorKey | string;
    title?: string;
    description?: string;
    url?: string;
    fields?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
    thumbnail?: string | null;
    image?: string;
    author?: string | {
        name: string;
        iconURL?: string;
        url?: string;
    };
    footer?: string | {
        text: string;
        iconURL?: string;
    };
    timestamp?: boolean;
}
export declare function createBrandedEmbed(options: EmbedOptions): EmbedBuilder;
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
    page?: number;
    perPage?: number;
}): EmbedBuilder;
export declare function createProfileEmbed(options: {
    username: string;
    discriminator: string;
    discordId: string;
    isVerified: boolean;
    robloxUsername?: string;
    robloxId?: string;
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
    uptime?: number;
}): EmbedBuilder;
export declare function createGiveawayEmbed(options: {
    name: string;
    description: string;
    prize: string;
    endTime: Date;
    participants: number;
    isActive: boolean;
    winner?: string;
    hostedBy?: string;
}): EmbedBuilder;
export declare function createBroadcastEmbed(options: {
    title: string;
    message: string;
    author: string;
}): EmbedBuilder;
export declare function createPollEmbed(options: {
    question: string;
    options: Array<{
        text: string;
        voters: string[];
    }>;
    createdBy: string;
    endTime?: Date;
    isActive: boolean;
}): EmbedBuilder;
export declare function createWelcomeEmbed(options: {
    username: string;
    userId: string;
    guildName: string;
    memberCount: number;
    avatar?: string;
}): EmbedBuilder;
export declare function createModLogEmbed(options: {
    action: string;
    target: string;
    targetId: string;
    moderator: string;
    reason: string;
    extra?: {
        name: string;
        value: string;
        inline?: boolean;
    }[];
}): EmbedBuilder;
export interface ExecutorDisplay {
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
    updatedDate: string;
    statusEmoji: string;
    statusText: string;
    platformEmoji: string;
}
export declare function createExecutorsEmbed(options: {
    executors: ExecutorDisplay[];
    platformFilter: string;
    lastUpdated: Date;
}): EmbedBuilder;
export declare function createExecutorButtons(activePlatform: string): ActionRowBuilder<ButtonBuilder>[];
export type HelpCategory = 'user' | 'moderation' | 'admin' | 'info';
export declare const HELP_CATEGORIES: Record<HelpCategory, {
    label: string;
    emoji: string;
    description: string;
    commands: {
        name: string;
        desc: string;
    }[];
}>;
export declare function createHelpEmbed(category: HelpCategory): EmbedBuilder;
export declare function createHelpSelectMenu(): StringSelectMenuBuilder;
//# sourceMappingURL=embeds.d.ts.map