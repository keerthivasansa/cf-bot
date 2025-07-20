import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "src/codeforces/client";
import CliTable3 from "cli-table3";
import { getNavButtons } from "$src/lib/discordUtils";

const collectorTime = 60000 * 3; // 3 minutes

export const ranklistCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("ranklist")
        .setDescription("Get the ranklist for a specific contest")
        .addIntegerOption(option =>
            option.setName("contest")
                .setDescription("The contest number")
                .setRequired(true)
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Mention a user to show their details')
                .setRequired(false)
        ),

    async execute(msg, interaction) {
        const contestId = msg.options.getInteger("contest");
        const mention = msg.options.getUser('user');
        const userHandles = new Set<string>();

        if (mention) {
            // Fetch the specified user's Codeforces handle from the database
            const user = await db.selectFrom('users')
                .select('handle')
                .where('discordId', '=', mention.id)
                .executeTakeFirst();

            if (!user || !user.handle) {
                await interaction.reply("User has not registered their Codeforces handle!");
                return;
            }

            userHandles.add(user.handle.trim().toLowerCase());
        } else {
            // Fetch user handles from the db
            const users = await db.selectFrom('users').select('handle').execute();
            users.forEach(user => {
                if (user.handle) {
                    userHandles.add(user.handle.trim().toLowerCase());
                }
            });
        }

        // Convert the set of user handles to a semicolon-separated string
        const handlesParam = Array.from(userHandles).join(';');
        console.log('Handles Param:', handlesParam);

        try {
            // Use the Codeforces API
            const cfApi = CFApiFactory.get();
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

            if (ranklist.length === 0) {
                await interaction.reply("No standings found for the specified contest and user(s).");
                return;
            }

            const contestInfo = await cfApi.getContestInfo(contestId);

            let chunkSize = ranklist.length;
            let messageContent = '';
            let totalPages = 0;
            let currentPage = 0;

            const createMessageContent = (page: number, chunkSize: number): string => {
                const start = page * chunkSize;
                const end = Math.min(start + chunkSize, ranklist.length);
                const pageData = ranklist.slice(start, end);

                const headers = ["Rank", "Handle", ...problems.map((_, index) => String.fromCharCode(65 + index))];
                const table = new CliTable3({
                    head: headers ,
                    colAligns: ['center', 'center', ...new Array(problems.length).fill('center')],
                    style: {
                        head: [],
                        border: [],
                        "padding-left": 0,
                        "padding-right": 0,
                    },
                });

                pageData.forEach(entry => {
                    const rowData: any = [entry.rank, entry.handle];
                    entry.problemResults.forEach((result: any) => {
                        const formattedTime = formatTime(result[1]);
                        const attemptDisplay = result[0] === 0 ? '' : `+${result[0]}`;
                        const cellContent = result[1] ? `${attemptDisplay}(${formattedTime})` : attemptDisplay;
                        rowData.push(cellContent);
                    });
                    table.push(rowData);
                });

                return `Ranklist for ${contestInfo.name} - Page ${page + 1}/${totalPages}\n\n${table.toString()}`;
            };

            // Adjust chunkSize to ensure message length is within Discord's limit
            while (chunkSize > 0) {
                totalPages = Math.ceil(ranklist.length / chunkSize);
                messageContent = createMessageContent(currentPage, chunkSize);

                if (messageContent.length <= 2000) {
                    break;
                }
                chunkSize--;
            }

            if (chunkSize === 0) {
                await interaction.reply("The ranklist is too large to display within Discord's character limit.");
                return;
            }

            const buttons = getNavButtons(currentPage, totalPages);

            await interaction.reply({
                content: `\`\`\`${messageContent}\`\`\``,
                components: [buttons],
            });

            const filter = (i: any) => i.user.id === msg.user.id;
            const collector = msg.channel.createMessageComponentCollector({ filter, time: collectorTime });

            collector.on('collect', async (collectInteraction) => {
                if (collectInteraction.customId === 'prev') {
                    currentPage = Math.max(currentPage - 1, 0);
                } else if (collectInteraction.customId === 'next') {
                    currentPage = Math.min(currentPage + 1, totalPages - 1);
                }

                messageContent = createMessageContent(currentPage, chunkSize);
                const updatedButtons = getNavButtons(currentPage, totalPages);

                await collectInteraction.update({
                    content: `\`\`\`${messageContent}\`\`\``,
                    components: [updatedButtons],
                });
            });

            collector.on('end', async () => {
                await msg.editReply({ components: [] });
            });

        } catch (error) {
            console.error('API Error:', error);

            if (error && error.response && error.response.data && error.response.data.comment) {
                await interaction.reply({ content: removeExtra(`${error.response.data.comment}`), components: [] });
            } else {
                await interaction.reply({ content: "Error fetching data from API", components: [] });
            }
        }
    },
};

// Format time helper function
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