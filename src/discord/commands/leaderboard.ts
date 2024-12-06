import { SlashCommandBuilder, ChatInputCommandInteraction } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { getNavButtons } from "$src/lib/discordUtils";
import { formatRating } from "$src/lib/utils";
import { createDynamicSizedTable } from "$src/discord/utils/dynamicTable";

const collectorTime = 60000 * 3; // 3 minutes

export const leaderboardCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View current leaderboard")
        .addStringOption(option =>
            option.setName("sort")
                .setDescription("Sort by rating or score")
                .setRequired(false)
                .addChoices(
                    { name: "Rating", value: "rating" },
                    { name: "Score", value: "score" }
                )
        ),

    async execute(interaction: ChatInputCommandInteraction) {
        const sortBy = interaction.options.getString("sort") || "rating";

        // Defer the reply to avoid timeout while we fetch the data
        await interaction.deferReply();

        // Fetch users, sorting by rating or score
        const users = await db.selectFrom("users")
            .selectAll()
            .orderBy(sortBy === "rating" ? "rating desc" : "score desc")
            .where(sortBy === "rating" ? "rating" : "score", "is not", null)  // Ensure non-null values are sorted
            .execute();

        const ranklist = users.map((user, index) => ({
            rank: (index + 1).toString(),
            handle: user.handle,
            value: sortBy === "rating" ? formatRating(user.rating, 12) : user.score.toString(),
        }));

        if (ranklist.length === 0) {
            await interaction.editReply("No leaderboard data available.");
            return;
        }

        const initialChunkSize = 10;
        let currentChunkSize = initialChunkSize;
        const totalPages = Math.ceil(ranklist.length / currentChunkSize);

        const createMessageContent = (page: number): string => {
            const start = page * currentChunkSize;
            const end = Math.min(start + currentChunkSize, ranklist.length);

            const tableData = [];

            for (let i = start; i < end; i++) {
                const entry = ranklist[i];
                tableData.push([entry.rank, entry.handle, entry.value]);
            }

            const tableConfig = {
                head: ["Rank", "Name", sortBy],
                colWidths: [6, 30, 12],
                style: { head: [], border: [], "padding-left": 1, "padding-right": 1 },
            };

            const tables = createDynamicSizedTable(tableData, tableConfig);
            const title = sortBy === "score" ? "Daily Problems Leaderboard" : "Leaderboard";
            return `${title} - Page ${page + 1}/${totalPages}\n\n${tables.join('\n')}`;
        };
        let currentPage = 0;
        const messageContent = createMessageContent(currentPage);
        const buttons = getNavButtons(currentPage, totalPages);

        await interaction.editReply({
            content: `\`\`\`ansi\n${messageContent}\`\`\``,
            components: [buttons],
        });

        const filter = (i: any) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: collectorTime });

        collector.on("collect", async (collectInteraction) => {
            if (collectInteraction.customId === "prev") {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (collectInteraction.customId === "next") {
                currentPage = Math.min(currentPage + 1, totalPages - 1);
            }

            const updatedMessageContent = createMessageContent(currentPage);
            const updatedButtons = getNavButtons(currentPage, totalPages);

            await collectInteraction.update({
                content: `\`\`\`ansi\n${updatedMessageContent}\`\`\``,
                components: [updatedButtons],
            });
        });

        collector.on("end", async () => {
            await interaction.editReply({
                content: `\`\`\`ansi\n${createMessageContent(currentPage)}\`\`\``,
                components: [],
            });
        });
    },
};
