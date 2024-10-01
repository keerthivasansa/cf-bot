import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { ClistsApi } from "$src/clists/client";

export const probRatCmd: Command = {
    command: new SlashCommandBuilder()
        .setName("probrat")
        .setDescription("Get the official / predicted rating of problems for a given contest")
        .addNumberOption((option) =>
            option.setName("contest_id")
                .setDescription("ID of the contest")
                .setRequired(true)
        ),

    async execute(msg) {
        const api = new ClistsApi();

        const contestId = msg.options.getNumber('contest_id');

        const resp = await api.getContestRatings(contestId);
        const problems = resp.objects;
        console.log(problems);

        const sorted = problems.sort((a, b) => {
            if (a.url < b.url)
                return -1;
            else
                return 1;
        });
    
        const fields = sorted.map(prob => {
            const rating = Math.round(prob.rating / 100) * 100;
            const probRating = Math.max(800, rating);
            const name = prob.url.match("\/problem\/([A-Z]\\d?)$")[1];
            return {
                name: name + " ".repeat(21 - name.length) + (probRating || "-"),
                value: " "
            }
        });

        console.log(fields);

        const embed = new EmbedBuilder()
            .setTitle(`${contestId} Problems Rating`)
            .setColor('Blurple')
            .addFields(fields)

        await msg.reply({
            embeds: [embed]
        });
    },
}