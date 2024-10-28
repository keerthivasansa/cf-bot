import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { DiscordClient } from "../client";

export const leaderboardCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View current leaderboard"),

    async execute(msg) {
        const users = await db.selectFrom("users").selectAll().orderBy("rating desc").limit(10).execute();

        const table = new CliTable3({
            style: {
                head: [], //disable colors in header cells
                border: [], //disable colors for the border
            },
            colAligns: ['center', 'center', 'center', 'center'],
            colWidths: [5, 24, 24, 8]
        });

        table.push(
            ['#', 'User', 'Handle', 'Rating']
        )

        const discord = DiscordClient.get();

        for (let i = 0; i < users.length; i++) {
            const usr = users[i];
            const member = await discord.users.fetch(usr.discordId);
            table.push([(i + 1).toString(), member.displayName, usr.handle, usr.rating]);
        }

        const out = `\`\`\`${table.toString()}\`\`\``;

        console.log(out);
        console.log()

        msg.reply(out);
    },
};