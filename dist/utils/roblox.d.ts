export interface RobloxUser {
    id: string;
    name: string;
    displayName: string;
    isBanned: boolean;
    created: string;
    description: string;
}
export declare class RobloxAPI {
    private static readonly BASE_URL;
    /**
     * Get Roblox user information by username
     */
    static getUserByUsername(username: string): Promise<RobloxUser | null>;
    /**
     * Get Roblox user information by ID (includes profile description)
     */
    static getUserById(userId: string): Promise<RobloxUser | null>;
    /**
     * Fetch a user's profile description to check for verification code
     */
    static getProfileDescription(userId: string): Promise<string | null>;
    /**
     * Generate a verification code for a Discord user
     */
    static generateVerificationCode(discordId: string): string;
}
//# sourceMappingURL=roblox.d.ts.map