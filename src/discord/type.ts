import { ChatInputCommandInteraction,  SlashCommandOptionsOnlyBuilder } from "discord.js";

export interface Command {
    info: SlashCommandOptionsOnlyBuilder,
    execute: (msg: ChatInputCommandInteraction) => void;
}