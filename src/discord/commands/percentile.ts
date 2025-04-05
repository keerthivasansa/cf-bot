import { AttachmentBuilder, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { CFPercentileFactory, PercentileType } from "$src/codeforces/perc_store";
import { db } from "$db/index";
import { getRatingColor } from "$src/codeforces/range";
import { CFLineChart } from "$src/graphs/line";
import { CFApiFactory } from "$src/codeforces/client";

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
        )
        .addUserOption(option => option
            .setName('user')
            .setDescription('Mention a user to get their percentile')
        )
        .addStringOption(option => option
            .setName('handle')
            .setDescription('Codeforces handle of the user')
        ),

    async execute(msg, interaction) {
        const mention = msg.options.getUser('user');
        const handle = msg.options.getString('handle');
        
        let user;
        try {
            if (handle) {
                // Try to get from database first
                user = await db.selectFrom('users').selectAll().where('handle', '=', handle).executeTakeFirst();
                
                // If not in database, fetch from CF API
                if (!user) {
                    const cfApi = CFApiFactory.get();
                    const cfUsers = await cfApi.getUsersInfo([handle]);
                    if (!cfUsers || cfUsers.length === 0) {
                        return interaction.reply("Invalid Codeforces handle!");
                    }
                    const cfUser = cfUsers[0];
                    user = {
                        handle: cfUser.handle,
                        rating: cfUser.rating || 0,
                        max_rating: cfUser.maxRating || 0
                    };
                }
            } else {
                const selectedUser = mention ? mention : msg.user;
                user = await db.selectFrom('users').selectAll().where('discordId', '=', selectedUser.id).executeTakeFirst();
                if (!user) {
                    return interaction.reply("User has not registered their codeforces handle!");
                }
            }

            const type = (msg.options.getString('type') as PercentileType) || 'max';

            const percApi = CFPercentileFactory.get();

            const ratingPercMap = percApi.getMap(type);
            const usrRating = type === 'max' ? user.max_rating : user.rating;

            const percentile = ratingPercMap.get(usrRating);
            if (!percentile) {
                return interaction.reply(`No percentile data available for rating ${usrRating}`);
            }

            console.log({ usrRating, perc: percentile });

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

            return interaction.reply({
                embeds: [embed],
                files: [attachment]
            });
        } catch (error) {
            console.error(error);
            return interaction.reply("Error fetching user data!");
        }
    },
};