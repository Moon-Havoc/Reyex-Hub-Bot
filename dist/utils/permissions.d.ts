import { GuildMember } from 'discord.js';
export declare function getStaffRoleId(): string;
export declare function getOwnerRoleId(): string;
export declare function getAdminRoleId(): string;
/** Has the Staff role OR server Administrator permission */
export declare function isStaff(member: GuildMember): boolean;
/** Has the Owner role (separate from staff) */
export declare function isOwner(member: GuildMember): boolean;
/** Has the Admin role OR server Administrator permission */
export declare function isAdmin(member: GuildMember): boolean;
/** True if invoker's highest role is above target's highest role */
export declare function hasRoleHierarchy(invoker: GuildMember, target: GuildMember): boolean;
/** @deprecated Use getStaffRoleId() instead */
export declare const STAFF_ROLE_ID: string;
/** @deprecated Use getOwnerRoleId() instead */
export declare const OWNER_ROLE_ID: string;
//# sourceMappingURL=permissions.d.ts.map