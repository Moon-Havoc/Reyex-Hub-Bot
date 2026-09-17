import { GuildMember } from 'discord.js';

const STAFF_ROLE_ID = '1549497563688992828';
const OWNER_ROLE_ID = '1549497563688992828';

export function isStaff(member: GuildMember): boolean {
  return member.roles.cache.has(STAFF_ROLE_ID);
}

export function isOwner(member: GuildMember): boolean {
  return member.roles.cache.has(OWNER_ROLE_ID);
}

export { STAFF_ROLE_ID, OWNER_ROLE_ID };
