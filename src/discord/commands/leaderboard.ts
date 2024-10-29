import { SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { DiscordClient } from "../client";

export const leaderboardCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("leaderboard")
        .setDescription("View current leaderboard"),

    async execute(msg) {
        await msg.deferReply();

        const users = await db.selectFrom("users").selectAll().orderBy("rating desc").execute();

        console.log(users);

        const discord = DiscordClient.get();
        const chunkSize = 10;
        const totalPages = Math.ceil(users.length / chunkSize);

        const createSubmissionTable = async (page: number): Promise<string> => {
            const start = page * chunkSize;
            const end = Math.min(start + chunkSize, users.length);
        
            const table = new CliTable3({
                head: ['#', 'User', 'Handle', 'Rating'],
                style: {
                    head: [],
                    border: [],
                },
                colAligns: ['center', 'center', 'center', 'center'],
                colWidths: [5, 19, 19, 8]
            });
        
            for (let i = start; i < end; i++) {
                const usr = users[i];
                const member = await discord.users.fetch(usr.discordId);
                table.push([(i + 1).toString(), member.displayName, usr.handle, usr.rating]);
            }
        
            return table.toString();
        }

        let currentPage = 0;
        const tableMsg = await createSubmissionTable(currentPage);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentPage === totalPages - 1),
            );

        await msg.editReply({
            content: `\`\`\`Leaderboard - Page ${currentPage}\n\n${tableMsg}\`\`\``,
            components: [row],
        });

        const filter = (i: any) => i.user.id === msg.user.id;
        const collector = msg.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev') {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (interaction.customId === 'next') {
                currentPage = Math.min(currentPage + 1, totalPages - 1);
            }

            const updatedTableMsg = await createSubmissionTable(currentPage);

            const updatedRow = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('prev')
                        .setLabel('Previous')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 0),
                    new ButtonBuilder()
                        .setCustomId('next')
                        .setLabel('Next')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === totalPages - 1),
                );

            await interaction.update({
                content: `\`\`\`Leaderboard - Page ${currentPage}\n\n${updatedTableMsg}\`\`\``,
                components: [updatedRow],
            });
        });
    },
};