import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import Table from "cli-table3"; // Add this import
import { getNavButtons } from "$src/lib/discordUtils"; // Add this import

export const helpCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("help")
        .setDescription("List all commands and their descriptions"),

    async execute(msg) {
        const commands = [
            { name: "verify", description: "Verify your codeforces handle" },
            { name:"info" , description: "Get user's current registered handle"},
            { name: "daily", description: "Get the daily codeforces problem" },
            { name: "leaderboard", description: "Get the server leaderboard" },
            { name: "ranklist", description: "Get the ranklist for a specific contest" },
            { name: "rating", description: "Fetch a user's rating graph" },
            { name: "stalk", description: "Fetch the most recent submissions of a user" },
            { name: "probrat", description: "Get the official/predicted rating of problems for a given contest" },
            { name: "perf", description: "Fetch a user's performance graph" },
            { name: "percentile", description: "Get your percentile based on your account stats" },
            { name:"speed" , description: "Get user's speed of solving problems in contest"},
        ];

        // Pagination setup
        let chunkSize = 10; // Start with 10 entries per page
        let totalPages = Math.ceil(commands.length / chunkSize);
        let currentPage = 0;

        const createMessageContent = (page) => {
            const tableMsg = createCommandsTable(page, chunkSize, commands);
            return `Here are the available commands - Page ${page + 1}/${totalPages}\n\n${tableMsg}`;
        };

        const messageContent = createMessageContent(currentPage);
        const buttons = getNavButtons(currentPage, totalPages);

        const sentMessage = await msg.reply({
            content: `\`\`\`${messageContent}\`\`\``,
            components: [buttons],
        });

        const filter = (interaction) => ['prev', 'next'].includes(interaction.customId) && interaction.user.id === msg.user.id;
        const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev') {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (interaction.customId === 'next') {
                currentPage = Math.min(currentPage + 1, totalPages - 1);
            }

            const newMessageContent = createMessageContent(currentPage);
            const newButtons = getNavButtons(currentPage, totalPages);

            await interaction.update({
                content: `\`\`\`${newMessageContent}\`\`\``,
                components: [newButtons],
            });
        });

        collector.on('end', async () => {
            await sentMessage.edit({ components: [] });
        });
    },
};

// Helper function to create the commands table
function createCommandsTable(page, chunkSize, commands) {
    const table = new Table({
        head: ['Command', 'Description'],
        colAligns: ['center', 'center'],
        style: {
            head: [],
            border: [],
            "padding-left": 0,
            "padding-right": 0,
        },
    });

    const start = page * chunkSize;
    const end = start + chunkSize;
    const chunk = commands.slice(start, end);

    chunk.forEach(cmd => {
        table.push([`/${cmd.name}`, cmd.description]);
    });

    return table.toString();
}