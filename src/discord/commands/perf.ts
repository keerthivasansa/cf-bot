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
            .setDescription("Show entire performance history")),

    async execute(msg) {
        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();
        const showEntire = msg.options.getBoolean('full');

        if (!user)
            return msg.reply("User has not registered their codeforces handle!")

        const cfApi = CFApiFactory.get();

        const allRatings = await cfApi.getUserRatings(user.handle);

        if (allRatings.length === 0)
            return msg.reply("You have not participated in any contests yet!");

        const last10 = allRatings.slice(Math.max(0, allRatings.length - 10));

        const selected = showEntire ? allRatings : last10;
        const selectedData = new Map<Date, number>();

        let currRating = 0;
        for (let i = 0; i < selected.length; i++) {
            const s = selected[i];
            const d = new Date(s.ratingUpdateTimeSeconds * 1000);
            const perfRating = s.oldRating + (s.newRating - s.oldRating) * MULTIPLY_FACTOR;
            currRating = Math.max(perfRating, 0)
            selectedData.set(d, currRating);
        }

        const chartUrl = new CFLineChart(selectedData)
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

        return msg.reply({
            embeds: [embed],
            files: [attachment]
        });
    },
};
