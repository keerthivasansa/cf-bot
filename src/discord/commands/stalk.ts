import { AttachmentBuilder, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import type { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";
import CliTable3 from "cli-table3";

const INT_MAX = 2147483647;

export const stalkCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("stalk")
        .setDescription("Fetch the most recent submissions of a user")
        .addBooleanOption(option => option
            .setName("sort")
            .setDescription("Sort as per rating"))
        .addBooleanOption(option => option
            .setName("contest")
            .setDescription("Show only contest problems")),
    
    async execute(msg) {
        await msg.deferReply(); // defer reply to avoid timeout

        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();
        if (!user)
            return msg.editReply("User has not registered their Codeforces handle!");

        const cfApi = CFApiFactory.get();
        const allUserSubmissions = await cfApi.getUserSubmissions(user.handle, 10000);

        if (allUserSubmissions.length === 0) {
            return msg.editReply("Participate in some contests!");
        }

        const sortByRating = msg.options.getBoolean("sort");
        if (sortByRating) {
            allUserSubmissions.sort((a, b) => {
                if (b.problem.rating === undefined && a.problem.rating === undefined) {
                    return b.creationTimeSeconds - a.creationTimeSeconds;
                }

                if (b.problem.rating === undefined) {
                    return 0 - a.problem.rating;
                }

                if (a.problem.rating === undefined) {
                    return b.problem.rating;
                }

                return b.problem.rating - a.problem.rating;
            });
        }

        const onlyContest = msg.options.getBoolean("contest") != null ? msg.options.getBoolean("contest") : false;
        console.log(onlyContest);
        const processedProblems = new Set<string>();
        const filteredSubmissions = allUserSubmissions.filter((submission) => {
            if (submission.relativeTimeSeconds === INT_MAX && onlyContest) return false;
            
            if (submission.verdict === 'OK' && !processedProblems.has(submission.problem.name)) {
                processedProblems.add(submission.problem.name);

                return true;
            }
            return false;
        });

        const chunkSize = 10; // Show 10 submissions per page
        const totalPages = Math.ceil(filteredSubmissions.length / chunkSize);

        const wrapText = (text: string, maxWidth: number): string => {
            const words = text.split(' ');
            let line = '';
            let result = '';
            for (let word of words) {
                if (line.length + word.length > maxWidth) {
                    result += line + '\n';  // wrap the text
                    line = word + ' ';
                } else {
                    line += word + ' ';
                }
            }
            result += line.trim(); // Add the last line
            return result;
        };

        const getEmojiForRating = (rating: number): string => {
            if (rating < 1200) return "🔘";
            if (rating < 1400) return "🟢";    
            if (rating < 1600) return "🩵";    
            if (rating < 1900) return "🔵";    
            if (rating < 2100) return "🟣";    
            if (rating < 2300) return "🟡";   
            if (rating < 2400) return "🟠";   
            if (rating < 2600) return "🔴";    
            if (rating < 3000) return "🔥";    
            if (rating < 3500) return "✨";    
            return "👑";
        };

        const formatRating = (rating: number): string => {
            const emoji = getEmojiForRating(rating);
            const ratingString = rating.toString();
        
            return `${emoji} ${ratingString}`;
        };

        const createSubmissionTable = (page: number): string => {
            const start = page * chunkSize;
            const end = Math.min(start + chunkSize, filteredSubmissions.length);
            const nameWidth = 19;
            const ratingWidth = 11;
            const submissionTimeWidth = 19;
            const table = new CliTable3({
                head: ['Problem Name', 'Rating', 'Submission Time'],
                style: {
                    head: [], // disable colors in header cells
                    border: [], // disable colors for the border
                },
                colAligns: ['center', 'center', 'center'],
                colWidths: [nameWidth, ratingWidth, submissionTimeWidth], // set the widths of each column (optional)
            });

            for (let i = start; i < end; i++) {
                const problem = filteredSubmissions[i].problem;
                const rating = problem.rating ? formatRating(problem.rating) : '?';
                const name = wrapText(problem.name, nameWidth); // Wrap the text if it's too long

                const timeAgo = (timeInS: number): string => {
                    const now = Date.now();
                    const diff = now - timeInS * 1000; // Convert to milliseconds
                    const seconds = Math.floor(diff / 1000);
                    const minutes = Math.floor(seconds / 60);
                    const hours = Math.floor(minutes / 60);
                    const days = Math.floor(hours / 24);

                    if (days > 0) {
                        return `${days} day(s) ago`;
                    } else if (hours > 0) {
                        return `${hours} hour(s) ago`;
                    } else if (minutes > 0) {
                        return `${minutes} minute(s) ago`;
                    } else {
                        return `${seconds} second(s) ago`;
                    }
                };

                const submissionTime = wrapText(timeAgo(filteredSubmissions[i].creationTimeSeconds), submissionTimeWidth);
                table.push([name, rating.toString(), submissionTime]);
            }

            return table.toString();
        };

        let currentPage = 0;
        const tableMsg = createSubmissionTable(currentPage);

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
            content: `\`\`\`User ${user.handle} Submissions\n\n${tableMsg}\`\`\``,
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

            const updatedTableMsg = createSubmissionTable(currentPage);

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
                content: `\`\`\`User ${user.handle} Submissions\n\n${updatedTableMsg}\`\`\``,
                components: [updatedRow],
            });
        });
    },
};
