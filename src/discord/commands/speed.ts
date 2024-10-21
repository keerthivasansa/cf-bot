import { AttachmentBuilder, SlashCommandBuilder } from "discord.js";
import type { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";
import { CFLineChart } from "$src/graphs/line";
import { EmbedBuilder } from "@discordjs/builders";
// import { getRatingColor } from "$src/codeforces/range";
// import CliTable3 from "cli-table3";
// import { ratingCmd } from "./rating";

const INT_MAX = 2147483647;

export const speedCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("speed")
        .setDescription("Fetch a user's speed of solving problems in contest"),
        // .addBooleanOption(option => option
        //     .setName("full")
        //     .setDescription("Show speed of all contests")),
    
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

        console.log(allUserSubmissions.length);

        const selectedData: Map<number, [number, number]> = new Map();
        let prevContestID = -1;
        let prevRelativeTime = -1;
        for (let i = 0; i < allUserSubmissions.length; i++) {
            const verdict = allUserSubmissions[i].verdict
            if (verdict != 'OK') continue;

            const relativeTimeInSeconds = allUserSubmissions[i].relativeTimeSeconds;
            if (relativeTimeInSeconds === INT_MAX) continue;

            const problem = allUserSubmissions[i].problem;
            if (problem.rating === undefined) continue;

            if (prevContestID != allUserSubmissions[i].contestId) {
                prevRelativeTime = 0;
                prevContestID = allUserSubmissions[i].contestId;
            }

            const relativeTimeInMinutes = (relativeTimeInSeconds - prevRelativeTime) / 60;
            if (!selectedData.has(problem.rating)) {
                selectedData.set(problem.rating, [0, 0]);
            }
            const currentValue = selectedData.get(problem.rating)!;
            currentValue[0] += relativeTimeInMinutes;
            currentValue[1]++;

            prevRelativeTime = relativeTimeInSeconds;
        }

        const sortedByKey = new Map([...selectedData.entries()].sort((a, b) => a[0] - b[0]));
        console.log(sortedByKey);
        const finalData: Map<number, number> = new Map();
        for (const [key, value] of sortedByKey.entries()) {
            const k = key;
            const v = (value[0] / value[1]);
            finalData.set(k, v);
        }

        const chartUrl = new CFLineChart(finalData)
            .labelMaxPoint()
            .setRangeBackground('RATING')
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