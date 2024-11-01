import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionContextType, ModalBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { randomInt } from "crypto";
import { db } from "$db/index";
import { CFApiFactory } from "$src/codeforces/client";

export const verifyCmd: Command = {
    info: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your codeforces handle')
        .addStringOption(
            (option) =>
                option.setName('handle')
                    .setDescription('Your codeforces handle')
                    .setRequired(true)
        )
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]),

    async execute(msg, interaction) {
        const handle = msg.options.getString('handle');
        const cfApi = CFApiFactory.get();
        const user = await db.selectFrom('users').select('handle').where('discordId', '=', msg.user.id).executeTakeFirst();
        const alpha = ['A', 'B', 'C']
        if (user.handle === handle)
            return interaction.reply("You have already verified that handle!");

        const randNum = randomInt(1000, 2000);
        const index = randomInt(0, 2);
        console.log({ index });
        const randAlpha = alpha[index];

        const probId = `${randNum}${randAlpha}`;

        const btn = new ButtonBuilder()
            .setLabel('Done')
            .setCustomId('DONE')
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(btn);

        let replyMsg = "";
        if (user)
            replyMsg += `You have already registered a handle: \`${user.handle}\`, to change it to \`${handle}\`, \n`
        replyMsg += `Submit a \`COMPILATION_ERROR\` to this problem: \`${probId}\` (https://codeforces.com/problemset/problem/${randNum}/${randAlpha}) and press the button once you are done!`;

        const response = await interaction.reply({
            content: replyMsg,
            components: [actionRow],
        });

        const confirmation = await response.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 180_000, // three minutes
            filter: (i) => i.user.id === msg.user.id,
            dispose: true,
        });

        if (confirmation.customId === 'DONE') {
            await response.edit({ components: [] });
            const submissions = await cfApi.getUserSubmissions(handle, 1);
            if (submissions.length < 1) {
                await confirmation.update('No problem has been submitted, verification failed.');
                return;
            }
            const prob = submissions[0].problem;
            if (prob.contestId !== randNum || prob.index !== randAlpha || submissions[0].verdict !== 'COMPILATION_ERROR') {
                await confirmation.update('Verification failed.')
                return;
            }

            const info = await cfApi.getUsersInfo([handle]);

            if (user)
                await db.updateTable('users')
                    .set({
                        handle,
                        rating: info[0].rating,
                        max_rating: info[0].maxRating
                    }).where('discordId', '=', msg.user.id)
                    .execute();
            else
                await db.insertInto('users').values({
                    discordId: msg.user.id,
                    handle,
                    rating: info[0].rating,
                    max_rating: info[0].maxRating
                }).execute();

            await confirmation.update(`Handle: \`${handle}\` has been verified!`);
        } else
            throw new Error("Unknown interaction: " + confirmation.customId);
    }
};