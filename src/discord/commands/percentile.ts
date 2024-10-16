import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { CFPercentileFactory, PercentileType } from "$src/codeforces/perc_store";
import { db } from "$db/index";
import { getRatingColor } from "$src/codeforces/range";
import { CFLineChart } from "$src/graphs/line";

export const percentileCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("percentile")
        .setDescription("Get your percentile based on your account stats")
        .addStringOption((opt) =>
            opt.setName('type')
                .setDescription('Percentile type')
                .addChoices([
                    { name: 'max', value: 'max' },
                    { name: 'current', value: 'current' },
                ])
        ),

    async execute(msg) {
        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();
        const type = (msg.options.getString('type') as PercentileType) || 'max';

        if (!user)
            return msg.reply("User has not registered their codeforces handle!");

        const percApi = CFPercentileFactory.get();

        const ratingPercMap = percApi.getMap(type);
        const usrRating = type === 'max' ? user.max_rating : user.rating;

        const chart = new CFLineChart(ratingPercMap)
            .addLabel(usrRating)
            .setRangeBackground('RATING_HORIZONTAL')
            .build()
            .toPNG();

        const attachment = new AttachmentBuilder(chart)
            .setName("canvas.png");

        const embed = new EmbedBuilder()
            .setTitle(`${user.handle} - Percentile - ${type}`)
            .setColor(getRatingColor(usrRating))
            .setImage("attachment://canvas.png");

        return msg.reply({
            embeds: [embed],
            files: [attachment]
        })
    },
};