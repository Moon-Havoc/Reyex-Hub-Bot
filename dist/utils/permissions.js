import { PermissionFlagsBits } from 'discord.js';
// ─── Role IDs from environment (falls back to hardcoded if not set) ───────────
// Set STAFF_ROLE_ID and OWNER_ROLE_ID in your .env file.
function getRoleId(envKey, fallback) {
    const val = process.env[envKey];
    if (!val || val.trim() === '')
        return fallback;
    return val.trim();
}
export function getStaffRoleId() {
    return getRoleId('STAFF_ROLE_ID', '1549497563688992828');
}
export function getOwnerRoleId() {
    return getRoleId('OWNER_ROLE_ID', getStaffRoleId());
}
export function getAdminRoleId() {
    return getRoleId('ADMIN_ROLE_ID', getStaffRoleId());
}
// ─── Permission Checks ────────────────────────────────────────
/** Has the Staff role OR server Administrator permission */
export function isStaff(member) {
    return (member.roles.cache.has(getStaffRoleId()) ||
        member.roles.cache.has(getAdminRoleId()) ||
        member.permissions.has(PermissionFlagsBits.Administrator));
}
/** Has the Owner role (separate from staff) */
export function isOwner(member) {
    return (member.roles.cache.has(getOwnerRoleId()) ||
        member.id === member.guild.ownerId);
}
/** Has the Admin role OR server Administrator permission */
export function isAdmin(member) {
    return (member.roles.cache.has(getAdminRoleId()) ||
        member.permissions.has(PermissionFlagsBits.Administrator));
}
/** True if invoker's highest role is above target's highest role */
export function hasRoleHierarchy(invoker, target) {
    return invoker.roles.highest.position > target.roles.highest.position;
}
// ─── Legacy exports (backwards compat) ───────────────────────
/** @deprecated Use getStaffRoleId() instead */
export const STAFF_ROLE_ID = getStaffRoleId();
/** @deprecated Use getOwnerRoleId() instead */
export const OWNER_ROLE_ID = getOwnerRoleId();
//# sourceMappingURL=permissions.js.map