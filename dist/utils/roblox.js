import { Logger } from './logger.js';
export class RobloxAPI {
    static BASE_URL = 'https://users.roblox.com';
    /**
     * Get Roblox user information by username
     */
    static async getUserByUsername(username) {
        try {
            const response = await fetch(`${this.BASE_URL}/v1/users/search?keyword=${encodeURIComponent(username)}&limit=10&userType=Public`);
            if (!response.ok) {
                Logger.error(`Roblox API error: ${response.status}`);
                return null;
            }
            const data = await response.json();
            if (!data.data || data.data.length === 0) {
                return null;
            }
            // Find exact match or first result
            const user = data.data.find((u) => u.name.toLowerCase() === username.toLowerCase()) || data.data[0];
            // Fetch full profile to get description
            const fullUser = await this.getUserById(user.id);
            return fullUser;
        }
        catch (error) {
            Logger.error('Error fetching Roblox user:', error);
            return null;
        }
    }
    /**
     * Get Roblox user information by ID (includes profile description)
     */
    static async getUserById(userId) {
        try {
            const response = await fetch(`${this.BASE_URL}/v1/users/${userId}`);
            if (!response.ok) {
                Logger.error(`Roblox API error: ${response.status}`);
                return null;
            }
            const data = await response.json();
            return {
                id: String(data.id),
                name: data.name,
                displayName: data.displayName,
                isBanned: data.isBanned,
                created: data.created,
                description: data.description || '',
            };
        }
        catch (error) {
            Logger.error('Error fetching Roblox user by ID:', error);
            return null;
        }
    }
    /**
     * Fetch a user's profile description to check for verification code
     */
    static async getProfileDescription(userId) {
        try {
            const user = await this.getUserById(userId);
            if (!user)
                return null;
            return user.description;
        }
        catch (error) {
            Logger.error('Error fetching profile description:', error);
            return null;
        }
    }
    /**
     * Generate a verification code for a Discord user
     */
    static generateVerificationCode(discordId) {
        const hash = discordId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const suffix = ((hash * 9301 + 49297) % 233280).toString(36).toUpperCase().slice(0, 4);
        return `REYEX-${suffix}`;
    }
}
//# sourceMappingURL=roblox.js.map