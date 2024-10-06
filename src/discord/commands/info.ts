import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";

export const infoCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Get your current registered handle"),

    async execute(msg) {
        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();
        if (!user) {
            msg.reply('You have not registered your handle yet!');
            return;
        }

        // 3, 8, 8
        const table = new CliTable3({
            style: {
                head: [], //disable colors in header cells
                border: [], //disable colors for the border
            },
            colAligns: ['center', 'center'],
            colWidths: [8, 25],
        });

        table.push(
            ['Handle', user.handle],
            ['Rating', user.rating],
            ['Score', user.score],
            ['Rank', '#1']
        );

        return msg.reply(`\`\`\`js\n${table.toString()}\`\`\``);
    },
};