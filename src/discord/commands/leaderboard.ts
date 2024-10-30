import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { DiscordClient } from "../client";
import { getNavButtons } from "$src/lib/discordUtils";
import { formatRating } from "$src/lib/utils";

const collectorTime = 60000 * 3;

export const leaderboardCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View current leaderboard"),

    async execute(msg, interaction) {
        const users = await db.selectFrom("users").selectAll().orderBy("rating desc").execute();

        const discord = DiscordClient.get();
        const chunkSize = 10;
        const totalPages = Math.ceil(users.length / chunkSize);

        const createSubmissionTable = async (page: number): Promise<string> => {
            const start = page * chunkSize;
            const end = Math.min(start + chunkSize, users.length);

            const indexWidth = 5;
            const userWidth = 19;
            const handleWidth = 19;
            const ratingWidth = 11;
        
            const table = new CliTable3({
                head: ['#', 'User', 'Handle', 'Rating'],
                style: {
                    head: [],
                    border: [],
                },
                colAligns: ['center', 'center', 'center', 'center'],
                colWidths: [indexWidth, userWidth, handleWidth, ratingWidth]
            });
        
            for (let i = start; i < end; i++) {
                const usr = users[i];
                const member = await discord.users.fetch(usr.discordId);
                table.push([(i + 1).toString(), member.displayName, usr.handle, formatRating(usr.rating, ratingWidth)]);
            }
        
            return table.toString();
        }

        let currentPage = 0;
        const tableMsg = await createSubmissionTable(currentPage);

        const row = getNavButtons(currentPage, totalPages);

        await interaction.reply({
            content: `\`\`\`ansi\nLeaderboard - Page ${currentPage}\n\n${tableMsg}\`\`\``,
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

            const updatedTableMsg = await createSubmissionTable(currentPage);

            const updatedRow = getNavButtons(currentPage,  totalPages);

            await collectInteraction.update({
                content: `\`\`\`ansi\nLeaderboard - Page ${currentPage}\n\n${updatedTableMsg}\`\`\``,
                components: [updatedRow],
            });
        });

        collector.on('end', async () => {
            await interaction.reply({
                content: `\`\`\`ansi\nLeaderboard - Page ${currentPage}\n\n${tableMsg}\`\`\``,
                components: [],
            });
        });
    },
};