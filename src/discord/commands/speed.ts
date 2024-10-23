import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";
import { CFLineChart } from "$src/graphs/line";
import { EmbedBuilder } from "@discordjs/builders";
import { type } from "os";

const INT_MAX = 2147483647;

export const speedCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("speed")
        .setDescription("Fetch a user's speed of solving problems in contest")
        .addIntegerOption(option => option
            .setName("count")
            .setDescription("Number of contests to fetch the speed for")
            .setMinValue(5)),
    
    async execute(msg) {
        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();
        const showEntire = msg.options.getBoolean('full');

        if (!user)
            return msg.reply("User has not registered their codeforces handle!")

        const cfApi = CFApiFactory.get();

        const allUserSubmissions = await cfApi.getUserSubmissions(user.handle, 10000);
        if (allUserSubmissions.length === 0) {
            return msg.reply("Participate in some contests!");
        }
        allUserSubmissions.sort((a, b) => {
            if (a.contestId == b.contestId) {
                return a.relativeTimeSeconds - b.relativeTimeSeconds;
            }

            return b.contestId - a.contestId;
        })

        // console.log(allUserSubmissions.length);

        const selectedData: Map<number, {totalTime: number, totalCount: number}> = new Map();
        let totalContests = msg.options.getInteger("count") === null ? INT_MAX : msg.options.getInteger("count");
        let prevContestID = -1;
        let prevRelativeTime = -1;
        for (let i = 0; i < allUserSubmissions.length && totalContests > 0; i++) {
            const verdict = allUserSubmissions[i].verdict
            if (verdict != 'OK') continue;

            const relativeTimeInSeconds = allUserSubmissions[i].relativeTimeSeconds;
            if (relativeTimeInSeconds === INT_MAX) continue;

            const problem = allUserSubmissions[i].problem;
            if (problem.rating === undefined) continue;

            if (prevContestID != allUserSubmissions[i].contestId) {
                prevRelativeTime = 0;
                prevContestID = allUserSubmissions[i].contestId;
                totalContests--;
            }

            const relativeTimeInMinutes = (relativeTimeInSeconds - prevRelativeTime) / 60;
            if (!selectedData.has(problem.rating)) {
                selectedData.set(problem.rating, {totalTime: 0, totalCount: 0});
            }
            const currentValue = selectedData.get(problem.rating)!;
            currentValue.totalTime += relativeTimeInMinutes;
            currentValue.totalCount++;

            prevRelativeTime = relativeTimeInSeconds;
        }

        const sortedByRating = new Map([...selectedData.entries()].sort((a, b) => a[0] - b[0]));
        const ratingTimeMap: Map<number, number> = new Map();
        for (const [key, value] of sortedByRating.entries()) {
            const k = key;
            const v = (value.totalTime / value.totalCount);
            ratingTimeMap.set(k, v);
        }

        const chartUrl = new CFLineChart(ratingTimeMap)
            .markPoints()
            .addOffsetToChart()
            .setXTicksStepSize(100)
            .setXLabel("Problem Ratings")
            .setYLabel("Minutes Spent Solving")
            .build()
            .toPNG();

        const attachment = new AttachmentBuilder(chartUrl)
            .setName('canvas.png');

        const embed = new EmbedBuilder()
            .setTitle(`${user.handle} - Speed`)
            .setImage('attachment://canvas.png');

        return msg.reply({
            embeds: [embed],
            files: [attachment]
        });

    },
};