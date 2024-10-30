import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "src/codeforces/client";
import CliTable3 from "cli-table3";
import { getNavButtons } from "$src/lib/discordUtils";

const collectorTime = 60000 * 3; // 3 min

export const ranklistCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("ranklist")
        .setDescription("Get the ranklist for a specific contest")
        .addIntegerOption(option =>
            option.setName("contest")
                .setDescription("The contest number")
                .setRequired(true)
        ),

    async execute(msg) {
        await msg.deferReply();

        const contestId = msg.options.getInteger("contest");

        // Fetch user handles from the database
        const userHandles = new Set<string>();
        const users = await db.selectFrom('users').select('handle').execute();
        users.forEach(user => {
            userHandles.add(user.handle.trim().toLowerCase());
        });

        // Convert the set of user handles to a semicolon-separated string
        const handlesParam = Array.from(userHandles).join(';');
        console.log('Handles Param:', handlesParam);

        try {
            // Use the cfapi method
            const cfApi = CFApiFactory.get()
            const { rows: standings, problems } = await cfApi.getContestStandings(contestId, handlesParam);

            // Filter the API response based on the user handles and participant type
            const ranklist: any[] = [];
            standings.forEach((row) => {
                const handle = row.party.members[0].handle.trim().toLowerCase();
                const participantType = row.party.participantType;
                if (userHandles.has(handle) && participantType === 'CONTESTANT') {
                    const rank = row.rank;
                    const problemResults = row.problemResults.map((result: any) => [
                        result.rejectedAttemptCount,
                        result.bestSubmissionTimeSeconds || '',
                    ]);
                    ranklist.push({
                        handle,
                        rank,
                        problemResults,
                        participantType,
                    });
                }
            });

            const contestInfo = await cfApi.getContestInfo(contestId);

            // Pagination setup
            let chunkSize = 10; // Start with 10 entries per page
            let totalPages = Math.ceil(ranklist.length / chunkSize);
            let currentPage = 0;
            let tableMsg = '';
            let messageContent = '';

            // Dynamically adjust chunkSize
            while (chunkSize > 0) {
                totalPages = Math.ceil(ranklist.length / chunkSize);
                currentPage = Math.min(currentPage, totalPages - 1);

                tableMsg = createRanklistTable(currentPage, chunkSize, ranklist, problems);
                messageContent = `Ranklist for ${contestInfo.name} - Page ${currentPage + 1}/${totalPages}\n\n${tableMsg}`;
                console.log(messageContent.length, chunkSize);
                if (messageContent.length <= 2000) {
                    break;
                } else {
                    chunkSize--;
                }
            }

            if (chunkSize === 0) {
                await msg.editReply({
                    content: `Cannot display ranklist. The data is too large to display.`,
                    components: [],
                });
                return;
            }

            const row = getNavButtons(currentPage, totalPages);

            await msg.editReply({
                content: `\`\`\`${messageContent}\`\`\``,
                components: [row],
            });

            const filter = (i: any) => i.user.id === msg.user.id;
            const collector = msg.channel.createMessageComponentCollector({ filter, time: collectorTime });

            collector.on('collect', async (interaction) => {
                if (interaction.customId === 'prev') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (interaction.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                }

                tableMsg = createRanklistTable(currentPage, chunkSize, ranklist, problems);
                messageContent = `Ranklist for Contest ${contestId} - Page ${currentPage + 1}/${totalPages}\n\n${tableMsg}`;

                const updatedRow = getNavButtons(currentPage, totalPages);

                await interaction.update({
                    content: `\`\`\`${messageContent}\`\`\``,
                    components: [updatedRow],
                });
            });

            collector.on('end', async () => {
                await msg.editReply({ components: [] });
            });

        }
        catch (error) {
            console.error('API Error:', error);

            if (error && error.response && error.response.data && error.response.data.comment) {
                await msg.editReply({ content: removeExtra(`${error.response.data.comment}`), components: [] });
            }
            else {
                await msg.editReply({ content: "Error fetching data from API", components: [] });
            }
        }
    },
};

// Create ranklist table function
function createRanklistTable(page: number, chunkSize: number, ranklist: any[], problems: any[]): string {
    const start = page * chunkSize;
    const end = Math.min(start + chunkSize, ranklist.length);
    const pageData = ranklist.slice(start, end);

    // Prepare data for table
    const headers = ["Rank", "Handle", ...problems.map((_, index) => String.fromCharCode(65 + index))];
    const table = new CliTable3({
        head: headers,
        colAligns: ['center', 'center', ...new Array(problems.length).fill('center')],
        style: {
            head: [],
            border: [],
            compact: true,
            "padding-left": 0,
            "padding-right": 0,
        },
    });

    pageData.forEach(entry => {
        const rowData: any = [entry.rank, entry.handle];
        entry.problemResults.forEach((result: any) => {
            const formattedTime = formatTime(result[1]);
            const cellContent = result[1] ? `${result[0]}(${formattedTime})` : `${result[0]}`;
            rowData.push(cellContent);
        });
        table.push(rowData);
    });

    return table.toString();
}

// Format time
function formatTime(seconds: number | string): string {
    if (seconds === '') return '';
    const totalSeconds = Number(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    const paddedMinutes = minutes.toString().padStart(2, '0');
    const paddedSeconds = secs.toString().padStart(2, '0');
    if (hours > 0) {
        return `${hours}:${paddedMinutes}:${paddedSeconds}`;
    } else {
        return `${paddedMinutes}:${paddedSeconds}`;
    }
}

// Remove extra text from error messages
function removeExtra(input: string): string {
    const colonIndex = input.indexOf(':');
    if (colonIndex === -1) {
        return input;
    }
    return input.substring(colonIndex + 1).trim();
}