import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { DiscordClient } from "../client";
import { getNavButtons } from "$src/lib/discordUtils";
import { formatRating } from "$src/lib/utils";
import { createDynamicSizedTable } from "../utils/dynamicTable";

const collectorTime = 60000 * 3;

export const leaderboardCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View current leaderboard"),

    async execute(msg, interaction) {
        const users = await db.selectFrom("users").selectAll().orderBy("rating desc").execute();
        const discord = DiscordClient.get();

        const indexWidth = 5;
        const userWidth = 19;
        const handleWidth = 19;
        const ratingWidth = 11;

        const data: string[][] = [];

        console.time("fetching users");
        for (let i = 0; i < users.length; i++) {
            const usr = users[i];
            const member = await DiscordClient.getUser(usr.discordId);
            data.push([(i + 1).toString(), member.displayName, usr.handle, formatRating(usr.rating, ratingWidth)]);
        }
        console.timeEnd("fetching users");


        console.time("constructing table");
        const slicedTables = createDynamicSizedTable(data, {
            head: ['#', 'User', 'Handle', 'Rating'],
            style: {
                head: [],
                border: [],
            },
            colAligns: ['center', 'center', 'center', 'center'],
            colWidths: [indexWidth, userWidth, handleWidth, ratingWidth]
        });
        console.timeEnd("constructing table");

        let currentPage = 0;
        const totalPages = slicedTables.length;

        const row = getNavButtons(currentPage, totalPages);

        await interaction.reply({
            content: `\`\`\`ansi\nLeaderboard - Page ${currentPage + 1} / ${totalPages} \n\n${slicedTables[currentPage]}\`\`\``,
            components: [row],
        });

        const filter = (i: any) => i.user.id === msg.user.id;
        const collector = msg.channel.createMessageComponentCollector({ filter, time: collectorTime });

        collector.on('collect', async (collectInteraction) => {
            if (collectInteraction.customId === 'prev') {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (collectInteraction.customId === 'next') {
                currentPage = Math.min(currentPage + 1, totalPages - 1);
            }
            const updatedRow = getNavButtons(currentPage, totalPages);
            await collectInteraction.update({
                content: `\`\`\`ansi\nLeaderboard - Page ${currentPage + 1} / ${totalPages} \n\n${slicedTables[currentPage]}\`\`\``,
                components: [updatedRow],
            });
        });

        collector.on('end', async () => {
            await interaction.reply({
                content: `\`\`\`ansi\nLeaderboard - Page ${currentPage + 1} / ${totalPages} \n\n${slicedTables[currentPage]}\`\`\``,
                components: [],
            });
        });
    },
};