import { ChatInputCommandInteraction, AutocompleteInteraction, ButtonInteraction, GuildMember, Collection, Client as DiscordClient } from 'discord.js';
export interface Command {
    data: {
        name: string;
        toJSON(): object;
    };
    execute(interaction: ChatInputCommandInteraction): Promise<void>;
    autocomplete?(interaction: AutocompleteInteraction): Promise<void>;
}
export interface ExtendedClient extends DiscordClient {
    commands: Collection<string, Command>;
}
export type { ChatInputCommandInteraction, AutocompleteInteraction, ButtonInteraction, GuildMember, };
//# sourceMappingURL=types.d.ts.map