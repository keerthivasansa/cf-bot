import { AttachmentBuilder, Embed, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";
import { CFLineChart } from "$src/graphs/line";
import { EmbedBuilder } from "@discordjs/builders";
import { getRatingColor } from "$src/codeforces/range";

export const ratingCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("rating")
        .setDescription("Fetch a user's rating graph")
        .addBooleanOption(option => option
            .setName("full")
            .setDescription("Show entire history"))
        .addUserOption(option => option
            .setName('user')
            .setDescription('Mention the user you want to check the rating of')
        ),

    async execute(msg, interaction) {
        const mention = msg.options.getUser('user');
        const selectedUser = mention ? mention : msg.user;

        const user = await db.selectFrom('users').selectAll().where('discordId', '=', selectedUser.id).executeTakeFirst();
        const showEntire = msg.options.getBoolean('full');

        if (!user)
            return interaction.reply("User has not registered their codeforces handle!")

        const cfApi = CFApiFactory.get();
        const allRatings = await cfApi.getUserRatings(user.handle);

        if (allRatings.length === 0)
            return interaction.reply("You have not participated in any contests yet!");

        const last10 = allRatings.slice(Math.max(0, allRatings.length - 10));

        const selected = showEntire ? allRatings : last10;
        const selectedData = new Map<Date, number>();

        let currRating = 0;
        for (let i = 0; i < selected.length; i++) {
            const s = selected[i];
            const d = new Date(s.ratingUpdateTimeSeconds * 1000);
            currRating = s.newRating;
            selectedData.set(d, s.newRating);
        }

        const chartUrl = new CFLineChart(selectedData)
            .labelMaxPoint()
            .setRangeBackground('RATING')
            .addOffsetToChart()
            .markPoints()
            .build()
            .toPNG();

        const attachment = new AttachmentBuilder(chartUrl)
            .setName('canvas.png');

        const embed = new EmbedBuilder()
            .setTitle(`${user.handle} - Rating`)
            .setColor(getRatingColor(currRating))
            .setImage('attachment://canvas.png');

        return interaction.reply({
            embeds: [embed],
            files: [attachment]
        });
    },

};
