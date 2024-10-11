import { AttachmentBuilder, Embed, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";
import { CFLineChart } from "$src/graphs/line";
import { EmbedBuilder } from "@discordjs/builders";

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

        const ratingChanges = await cfApi.getUserRatings(user.handle);

        if (ratingChanges.length === 0)
            return msg.reply("You have not participated in any contests yet!");

        const allRatings = ratingChanges.map((rating) => rating.oldRating + (rating.newRating - rating.oldRating) * MULTIPLY_FACTOR);

        const last10 = allRatings.slice(Math.max(0, allRatings.length - 10));

        const chartUrl = new CFLineChart(showEntire ? allRatings : last10)
            .labelMaxPoint()
            .setRangeBackground('RATING')
            .build()
            .toPNG();

        const attachment = new AttachmentBuilder(chartUrl)
            .setName('canvas.png');

        const embed = new EmbedBuilder()
            .setTitle(`${user.handle} - Performance`)
            .setColor([255, 0, 0])
            .setImage('attachment://canvas.png');

        return msg.reply({
            embeds: [embed],
            files: [attachment]
        });
    },
};
