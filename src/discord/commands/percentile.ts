import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { CFPercentileFactory } from "$src/codeforces/perc_store";
import { db } from "$db/index";
import { getRatingColor } from "$src/codeforces/range";

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
        const type = (msg.options.getString('type') as 'max' | 'current') || 'max';

        if (!user)
            return msg.reply("User has not registered their codeforces handle!");

        const percApi = CFPercentileFactory.get();

        const perc = await percApi.get(user.rating, type)
        console.log({ perc });

        const embed = new EmbedBuilder()
            .setTitle(`${user.handle} - Percentile - ${type}`)
            .setColor(getRatingColor(user.rating))
            .addFields([
                {
                    name: `${perc}%`,
                    value: " "
                }
            ])

        return msg.reply({
            embeds: [embed]
        })
    },
};