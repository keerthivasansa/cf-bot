import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { sql } from "kysely";
import { formatRating } from "$src/lib/utils";

export const infoCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Get your current registered handle")
        .addUserOption(option => option
            .setName('user')
            .setDescription('Mention a user to get their info')
        ),

    async execute(msg, interaction) {
        const mention = msg.options.getUser('user');
        const selectedUser = mention ? mention : msg.user;

        const user = await db.selectFrom('users').select([
            'handle',
            'rating',
            'score',
        ])
            .where('discordId', '=', selectedUser.id).executeTakeFirst();

        if (!user)
            return interaction.reply('You have not registered your handle yet!');

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

        const dataWidth = 25;
        const table = new CliTable3({
            style: {
                head: [],
                border: [],
            },
            colAligns: ['center', 'center'],
            colWidths: [8, dataWidth],
        });

        table.push(
            ['Handle', user.handle],
            ['Rating', formatRating(user.rating, dataWidth)],
            ['Score', user.score],
            ['Rank', `#${usrRank}`]
        );

        return interaction.reply(`\`\`\`ansi\n${table.toString()}\`\`\``);
    },
};