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
     * Look up a Roblox user by username.
     * Returns the exact-match first, then the first result.
     */
    static getUserByUsername(username: string): Promise<RobloxUser | null>;
    /**
     * Fetch full profile by numeric Roblox user ID.
     */
    static getUserById(userId: string): Promise<RobloxUser | null>;
    /**
     * Convenience wrapper — returns just the profile description.
     */
    static getProfileDescription(userId: string): Promise<string | null>;
    /**
     * Generate a **random** verification code tied to a Discord user for
     * this bot session.  Codes are stored in memory so a restart
     * naturally invalidates all pending verifications (users must re-run
     * `/verify start`).  The MongoDB document also tracks expiry
     * independently, so both gates must pass.
     *
     * Format: `REYEX-XXXXXX`  (6 random uppercase alphanumeric chars)
     */
    static generateVerificationCode(discordId: string): string;
    /**
     * Verify that `code` is the one we issued to `discordId` and hasn't
     * been purged from the in-memory store (e.g. after a restart).
     */
    static validateCode(discordId: string, code: string): boolean;
    /**
     * Clear the in-memory code for a user once they've successfully
     * verified (or explicitly cancelled).
     */
    static clearCode(discordId: string): void;
    /** Returns a human-readable account age string, e.g. "3 years, 2 months" */
    static accountAge(createdIso: string): string;
}
//# sourceMappingURL=roblox.d.ts.map