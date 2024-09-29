import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, InteractionContextType, ModalBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "./type";
import { randomInt } from "crypto";
import { CodeforcesApi } from "../../codeforces/client";
import { db } from "../../../db";

export const verifyCmd: Command = {
    command: new SlashCommandBuilder()
        .setName('verify')
        .setDescription('Verify your codeforces handle')
        .addStringOption((option) => option.setName('handle').setDescription('Your codeforces handle').setRequired(true))
        .setContexts([InteractionContextType.Guild, InteractionContextType.BotDM]),

    async execute(msg) {
        const handle = msg.options.getString('handle');
        const currTime = performance.now();
        const alpha = ['A', 'B', 'C']

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

        const response = await msg.reply({
            content: `Submit a \`COMPILATION_ERROR\` to this problem: \`${probId}\` (https://codeforces.com/problemset/problem/${randNum}/${randAlpha}) and press the button once you are done!`,
            components: [actionRow],
        });

        const confirmation = await response.awaitMessageComponent({
            componentType: ComponentType.Button,
            time: 120_000, // two minutes
            filter: (i) => i.user.id === msg.user.id
        });

        if (confirmation.customId === 'DONE') {
            const cfApi = new CodeforcesApi();
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

            await db.insertInto('users').values({
                discordId: msg.user.id,
                handle,
            }).execute();

            await confirmation.update(`Handle: \`${handle}\` has been verified!`);
        } else
            throw new Error("Unknown interaction: " + confirmation.customId);
    }
};