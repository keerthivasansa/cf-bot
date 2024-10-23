import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { sql } from "kysely";

export const infoCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Get your current registered handle"),

    async execute(msg) {

        const user = await db.selectFrom('users').select([
            'handle',
            'rating',
            'score',
            sql`ROW_NUMBER() OVER (ORDER BY score DESC)`.$castTo<number>().as("rank")
        ])
            .where('discordId', '=', msg.user.id).executeTakeFirst();

        if (!user) {
            msg.reply('You have not registered your handle yet!');
            return;
        }

        const table = new CliTable3({
            style: {
                head: [],
                border: [],
            },
            colAligns: ['center', 'center'],
            colWidths: [8, 25],
        });

        table.push(
            ['Handle', user.handle],
            ['Rating', user.rating],
            ['Score', user.score],
            ['Rank', `#${user.rank}`]
        );

        return msg.reply(`\`\`\`js\n${table.toString()}\`\`\``);
    },
};