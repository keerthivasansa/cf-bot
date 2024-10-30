import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";
import { CFLineChart } from "$src/graphs/line";
import { EmbedBuilder } from "@discordjs/builders";
import { getRatingColor } from "$src/codeforces/range";

const MULTIPLY_FACTOR = 4;

export const perfCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("perf")
        .setDescription("Fetch a user's performance graph")
        .addBooleanOption(option => option
            .setName("full")
            .setDescription("Show entire performance history"))
        .addUserOption(option => option
            .setName('user')
            .setDescription('Mention a user to get their speed')
        ),

    async execute(msg) {
        const mention = msg.options.getUser('user');
        const selectedUser = mention ? mention : msg.user;

        const user = await db.selectFrom('users').selectAll().where('discordId', '=', selectedUser.id).executeTakeFirst();
        const showEntire = msg.options.getBoolean('full');

        if (!user)
            return msg.reply("User has not registered their codeforces handle!")


        const cfApi = CFApiFactory.get();

        const allRatings = await cfApi.getUserRatings(user.handle);

        if (allRatings.length === 0)
            return msg.reply("You have not participated in any contests yet!");

        msg.deferReply();

        const last10Index = Math.max(0, allRatings.length - 10);

        const getRatingWithRank = async (contestId: number, rank: number) => {
            const perf = await cfApi.getContestRatingChanges(contestId);
            const k = 20;
            const C = 75;

            let sum = 0;
            let count = 0;

            for (let j = 1; j <= k; j++) {
                if (rank - j >= 0) {
                    sum += perf[rank - j].oldRating;
                    count++;
                }

                if (rank + j < perf.length) {
                    sum += perf[rank + j].oldRating;
                    count++;
                }
            }

            return Math.ceil(sum / count) + C;
        }

        const perfRatingMap = new Map<Date, number>();

        if (showEntire || last10Index < 5) {
            const st = showEntire ? 0 : last10Index;
            for (let i = st; i < 5; i++) {
                const s = allRatings[i];
                const rank = await getRatingWithRank(s.contestId, s.rank);
                const d = new Date(s.ratingUpdateTimeSeconds * 1000);
                perfRatingMap.set(d, rank);
            }
        }

        let currRating = 0;
        for (let i = Math.max(5, last10Index); i < allRatings.length; i++) {
            const s = allRatings[i];
            const d = new Date(s.ratingUpdateTimeSeconds * 1000);
            const perfRating = s.oldRating + (s.newRating - s.oldRating) * MULTIPLY_FACTOR;
            currRating = Math.max(perfRating, 0)
            perfRatingMap.set(d, currRating);
        }

        const chartUrl = new CFLineChart(perfRatingMap)
            .markPoints()
            .labelMaxPoint()
            .setRangeBackground('RATING')
            .build()
            .toPNG();


        const attachment = new AttachmentBuilder(chartUrl)
            .setName('canvas.png');

        const embed = new EmbedBuilder()
            .setTitle(`${user.handle} - Performance`)
            .setColor(getRatingColor(currRating))
            .setImage('attachment://canvas.png');

        return msg.editReply({
            embeds: [embed],
            files: [attachment]
        });
    },
};
