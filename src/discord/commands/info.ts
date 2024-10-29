import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { sql } from "kysely";

export const infoCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Get your current registered handle")
        .addUserOption(option => option
            .setName('user')
            .setDescription('Mention a user to get their info')
        ),

    async execute(msg) {
        const mention = msg.options.getUser('user');
        const selectedUser = mention ? mention : msg.user;

        const user = await db.selectFrom('users').select([
            'handle',
            'rating',
            'score',
        ])
            .where('discordId', '=', selectedUser.id).executeTakeFirst();

        if (!user) {
            msg.reply('You have not registered your handle yet!');
            return;
        }

        // TODO pretty inefficient
        const ranks = await db.selectFrom('users').select([
            sql<number>`ROW_NUMBER() OVER (ORDER BY rating desc)`.as('rank'),
            'discordId'
        ]).execute();

        let usrRank = -1;
        for (let usr of ranks) {
            if (usr.discordId == selectedUser.id) {
                usrRank = usr.rank;
                break;
            }
        };

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
            ['Rank', `#${usrRank}`]
        );

        return msg.reply(`\`\`\`js\n${table.toString()}\`\`\``);
    },
};