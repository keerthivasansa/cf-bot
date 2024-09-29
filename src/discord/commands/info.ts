import { SlashCommandBuilder } from "discord.js";
import { Command } from "./type";
import { db } from "../../../db";

export const infoCmd: Command = {
    command: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Get your current registered handle"),

    async execute(msg) {
        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();
        if (!user) {
            msg.reply('You have not registered your handle yet!');
            return;
        }
        msg.reply(`Your codeforces handle: \`${user.handle}\``);
    },
};