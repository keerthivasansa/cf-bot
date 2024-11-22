import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import Table from "cli-table3"; // Add this import
import { getNavButtons } from "$src/lib/discordUtils"; // Add this import

export const helpCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("help")
        .setDescription("List all commands and their descriptions"),

    async execute(msg, interaction) {
        const commands = [
            { name: "verify", description: "Link your Codeforces handle to your Discord account and start your journey!" },
            { name: "info", description: "Get the Codeforces handle currently linked to your profile." },
            { name: "daily", description: "Challenge yourself with a random Codeforces problem every day!" },
            { name: "leaderboard", description: "See who's leading in your server's Codeforces rankings!" },
            { name: "ranklist", description: "Check the detailed rankings for any specific Codeforces contest." },
            { name: "rating", description: "View a visual graph of your Codeforces rating over time." },
            { name: "stalk", description: "Curious? Check out the latest submissions made by any user!" },
            { name: "probrat", description: "Get the official or predicted ratings of problems in a specific contest." },
            { name: "perf", description: "Analyze your performance over contests with a detailed graph." },
            { name: "percentile", description: "See where you rank among Codeforces users worldwide!" },
            { name: "speed", description: "Find out how fast you solve problems during contests!" },
        ];

        let chunkSize = 5; // Adjust entries per page as needed
        let totalPages = Math.ceil(commands.length / chunkSize);
        let currentPage = 0;

        const createMessageContent = (page: number): string => {
            const start = page * chunkSize;
            const end = Math.min(start + chunkSize, commands.length);
            const pageData = commands.slice(start, end);

            const table = new Table({
                head: ['Command', 'Description'],
                colAligns: ['center', 'center'],
                colWidths: [15, 45], // Set column widths
                wordWrap: true,      // Enable word wrapping
                style: {
                    head: [],
                    border: [],
                    "padding-left": 0,
                    "padding-right": 0,
                },
            });

            pageData.forEach(cmd => {
                table.push([`/${cmd.name}`, cmd.description]);
            });

            return `Here are the available commands - Page ${page + 1}/${totalPages}\n\n${table.toString()}`;
        };

        let messageContent = createMessageContent(currentPage);
        const buttons = getNavButtons(currentPage, totalPages);

        await interaction.reply({
            content: `\`\`\`${messageContent}\`\`\``,
            components: [buttons],
        });

        const filter = (i: any) => i.user.id === msg.user.id;
        const collector = msg.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (collectInteraction) => {
            if (collectInteraction.customId === 'prev') {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (collectInteraction.customId === 'next') {
                currentPage = Math.min(currentPage + 1, totalPages - 1);
            }

            messageContent = createMessageContent(currentPage);
            const updatedButtons = getNavButtons(currentPage, totalPages);

            await collectInteraction.update({
                content: `\`\`\`${messageContent}\`\`\``,
                components: [updatedButtons],
            });
        });

        collector.on('end', async () => {
            await interaction.reply({ components: [] });
        });
    },
};