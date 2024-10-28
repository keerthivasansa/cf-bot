import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "src/codeforces/client"; // Import CFApiFactory
import CliTable3 from "cli-table3";

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
        const contestId = msg.options.getInteger("contest");

        // Fetch user handles from the database
        const userHandles = new Set<string>();
        const users = await db.selectFrom('users').select('handle').execute();
        users.forEach(user => {
            userHandles.add(user.handle.trim().toLowerCase());
        });

        // Convert the set of user handles to a semicolon-separated string
        const handlesParam = Array.from(userHandles).join(';');

        try {
            // Use the cfapi method
            const { rows: standings, problems } = await CFApiFactory.get().getContestStandings(contestId, handlesParam);

            // Filter the API response based on the user handles and participant type
            const ranklist: any[] = [];
            standings.forEach((row: any) => {
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

            // Prepare data for tabulate
            const headers = ["Rank", "Handle", ...problems.map((_, index) => String.fromCharCode(65 + index))];
            const tableData = ranklist.map(entry => {
                const rowData: any = { Rank: entry.rank, Handle: entry.handle };
                entry.problemResults.forEach((result, index) => {
                    const formattedTime = formatTime(result[1]);
                    rowData[String.fromCharCode(65 + index)] = result[1] ? `${result[0]}\n(${formattedTime})` : `${result[0]}`;
                });
                return rowData;
            });

            // Create the table
            const table = new CliTable3({
                head: headers,
                colAligns: ['center', 'center', ...new Array(problems.length).fill('center')],
                style: {
                    head: [], //disable colors in header cells
                    border: [], //disable colors for the border
                    'padding-left': 0,
                    'padding-right': 0,
                },
            });
            
            // @ts-ignore
            table.push(...tableData.map(row => Object.values(row)));

            // Send the table as a reply
            msg.reply(`\`\`\`js\n${table.toString()}\`\`\``);

        } 
        catch (error) {
            if (error && error.response && error.response.data && error.response.data.comment) {
                msg.reply(removeExtra(`${error.response.data.comment}`));
            } 
            // else if (error && error.message) {
            //     msg.reply(`Error fetching contest standings: ${error.message}`);
            // } 
            else {
                msg.reply("Error fetching data from API");
            }
        }
    },
};

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

function removeExtra(input: string): string {
    const colonIndex = input.indexOf(':');
    if (colonIndex === -1) {
        return input; 
    }
    return input.substring(colonIndex + 1).trim();
}