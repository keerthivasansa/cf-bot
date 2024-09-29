import { ChatInputCommandInteraction,  SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface Command {
    command: SlashCommandOptionsOnlyBuilder,
    execute: (msg: ChatInputCommandInteraction) => void;
}