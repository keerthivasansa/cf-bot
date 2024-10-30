import { AttachmentBuilder, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import type { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";
import CliTable3 from "cli-table3";
import { wrapText, formatRating } from "$src/lib/utils";
import { getNavButtons } from "$src/lib/discordUtils";

const INT_MAX = 2147483647;
const collectorTime = 60000 * 3;

export const stalkCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("stalk")
        .setDescription("Fetch the most recent submissions of a user")
        .addBooleanOption(option => option
            .setName("sort")
            .setDescription("Sort as per rating"))
        .addBooleanOption(option => option
            .setName("contest")
            .setDescription("Show only contest problems"))
        .addUserOption(option => option
            .setName('user')
            .setDescription('Mention the user to stalk them instead')
        ),

    async execute(msg) {
        await msg.deferReply(); // Defer to await

        // Get user ID if mentioned
        const mention = msg.options.getUser('user');
        const selectedUser = mention ? mention : msg.user;

        const user = await db.selectFrom('users').selectAll().where('discordId', '=', selectedUser.id).executeTakeFirst();
        if (!user)
            return msg.editReply("User has not registered their Codeforces handle!");

        // Fetch user submissions
        const cfApi = CFApiFactory.get();
        const allUserSubmissions = await cfApi.getUserSubmissions(user.handle, 10000);

        if (allUserSubmissions.length === 0) {
            return msg.editReply("Participate in some contests!");
        }

        // Sort submissions
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

        // Filter Unique and Contest only
        const onlyContest = msg.options.getBoolean("contest") != null ? msg.options.getBoolean("contest") : false;
        const processedProblems = new Set<string>();
        const filteredSubmissions = allUserSubmissions.filter((submission) => {
            if (submission.relativeTimeSeconds === INT_MAX && onlyContest) return false;

            if (submission.verdict === 'OK' && !processedProblems.has(submission.problem.name)) {
                processedProblems.add(submission.problem.name);

                return true;
            }
            return false;
        });

        const initialChunkSize = 10;
        let currentChunkSize = initialChunkSize;
        const totalPages = Math.ceil(filteredSubmissions.length / currentChunkSize);

        const createSubmissionTable = (page: number): string => {
            let tableMsg: string;
            let characterCount: number;
            do {
                const start = page * currentChunkSize;
                const end = Math.min(start + currentChunkSize, filteredSubmissions.length);

                const nameWidth = 19;
                const ratingWidth = 20;
                const submissionTimeWidth = 19;
                const table = new CliTable3({
                    head: ['Problem Name', 'Rating', 'Submission Time'],
                    style: { head: [], border: [] },
                    colAligns: ['center', 'center', 'center'],
                    colWidths: [nameWidth, ratingWidth, submissionTimeWidth],
                });

                for (let i = start; i < end; i++) {
                    const problem = filteredSubmissions[i].problem;
                    const rating = problem.rating ? formatRating(problem.rating, ratingWidth) : '?';
                    const name = wrapText(problem.name, nameWidth);

                    const timeAgo = (timeInS: number): string => {
                        const now = Date.now();
                        const diff = now - timeInS * 1000;
                        const seconds = Math.floor(diff / 1000);
                        const minutes = Math.floor(seconds / 60);
                        const hours = Math.floor(minutes / 60);
                        const days = Math.floor(hours / 24);

                        if (days > 0) return `${days} day(s) ago`;
                        else if (hours > 0) return `${hours} hour(s) ago`;
                        else if (minutes > 0) return `${minutes} minute(s) ago`;
                        else return `${seconds} second(s) ago`;
                    };
                    const submissionTime = wrapText(timeAgo(filteredSubmissions[i].creationTimeSeconds), submissionTimeWidth);

                    table.push([name, rating.toString(), submissionTime]);
                }

                tableMsg = table.toString();
                characterCount = tableMsg.length + 100;
                
                if (characterCount > 2000) currentChunkSize--;

            } while (characterCount > 2000 && currentChunkSize > 1);
            currentChunkSize = 10;

            return tableMsg;
        };

        let currentPage = 0;
        const tableMsg = createSubmissionTable(currentPage);
        const row = getNavButtons(currentPage, totalPages);

        await msg.editReply({
            content: `\`\`\`ansi\nUser ${user.handle} Submissions\n\n${tableMsg}\`\`\``,
            components: [row],
        });

        const collector = msg.channel.createMessageComponentCollector({ filter: (i => i.user.id === msg.user.id), time: collectorTime });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'prev') {
                currentPage = Math.max(currentPage - 1, 0);
            } else if (interaction.customId === 'next') {
                currentPage = Math.min(currentPage + 1, totalPages - 1);
            }

            const updatedTableMsg = createSubmissionTable(currentPage);
            const updatedRow = getNavButtons(currentPage, totalPages);

            await interaction.update({
                content: `\`\`\`ansi\nUser ${user.handle} Submissions\n\n${updatedTableMsg}\`\`\``,
                components: [updatedRow],
            });
        });

        collector.on('end', async () => {
            await msg.editReply({
                content: `\`\`\`ansi\nUser ${user.handle} Submissions\n\n${createSubmissionTable(currentPage)}\`\`\``,
                components: [],
            });
        });
    },
};
