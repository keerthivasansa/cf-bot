import { ChatInputCommandInteraction,  SlashCommandOptionsOnlyBuilder } from "discord.js";
import { InteractionHandler } from "./utils/msg";

export interface Command {
    info: SlashCommandOptionsOnlyBuilder,
    execute: InteractionHandler;
}