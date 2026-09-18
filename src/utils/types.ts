import {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  GuildMember,
  Collection,
  Client as DiscordClient,
} from 'discord.js';

// ─── Typed Command Interface ───────────────────────────────────

export interface Command {
  data: { name: string; toJSON(): object };
  execute(interaction: ChatInputCommandInteraction): Promise<void>;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}

// ─── Extended Discord Client ───────────────────────────────────

export interface ExtendedClient extends DiscordClient {
  commands: Collection<string, Command>;
}

// ─── Re-export common interaction types ───────────────────────

export type {
  ChatInputCommandInteraction,
  AutocompleteInteraction,
  ButtonInteraction,
  GuildMember,
};
