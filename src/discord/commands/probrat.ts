import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { ClistsApi } from "$src/clists/client";
import { db } from "$db/index";
import CliTable3 from "cli-table3";

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

        const cachedProb = await db.selectFrom('problems').selectAll().where('contestId', '=', contestId).orderBy('index asc').execute();

        if (!cachedProb[0].predicted_rating) {
            const resp = await api.getContestRatings(contestId);
            const problems = resp.objects;

            db.transaction().execute(async (tdb) => {
                for (const p of problems) {
                    const rating = Math.round(p.rating / 100) * 100;
                    const probRating = Math.max(800, rating);
                    const index = p.url.match("\/problem\/([A-Z]\\d?)$")[1];

                    // update for short time.
                    for (let i = 0; i < cachedProb.length; i++) {
                        if (cachedProb[i].index == index)
                            cachedProb[i].predicted_rating = probRating;
                    }

                    // cache for later use.
                    await tdb.updateTable("problems").set({
                        predicted_rating: probRating
                    }).where(
                        eb => eb.and([
                            eb('contestId', '=', contestId),
                            eb('index', '=', index)
                        ])
                    ).execute();
                }
            });
        }

        let table = new CliTable3({
            head: ['#', 'Actual', 'Predicted'],
            style: {
                head: [], //disable colors in header cells
                border: [], //disable colors for the border
            },
            colAligns: ['center', 'center', 'center'],
            colWidths: [3, 8, 8], //set the widths of each column (optional)
        });

        for (const prob of cachedProb)
            table.push([prob.index, prob.official_rating || '-', prob.predicted_rating || '-']);

        const tableMsg = table.toString();

        await msg.reply({
            content: `\`\`\`Contest ${contestId} Ratings\n\n${tableMsg}\`\`\``
        });
    },
}