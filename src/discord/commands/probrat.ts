import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { ClistsApi } from "$src/clists/client";
import { db } from "$db/index";
import CliTable3 from "cli-table3";
import { CFApiFactory } from "$src/codeforces/client";
import { formatRating } from "$src/lib/utils";

export const probRatCmd: Command = {
    info: new SlashCommandBuilder()
        .setName("probrat")
        .setDescription("Get the official / predicted rating of problems for a given contest")
        .addNumberOption((option) =>
            option.setName("contest_id")
                .setDescription("ID of the contest")
                .setRequired(true)
        ),

    async execute(msg) {
        const api = new ClistsApi();
        const cfApi = CFApiFactory.get();

        const contestId = msg.options.getNumber('contest_id', true);
        const contestInfo = await cfApi.getContestInfo(contestId);

        const cachedProb = await db.selectFrom('problems').selectAll().where('contestId', '=', contestId).orderBy('index asc').execute();

        if (cachedProb.length < 1)
            return msg.reply('Contest doesn\'t exist or hasn\'t finished yet!');

        if (!cachedProb[0].predicted_rating) {
            const resp = await api.getContestRatings(contestId);
            const problems = resp.objects;
            // clist weird behaviour if it hasnt predicted yet
            const hasPrediction = problems.some((prob) => prob.rating !== 800)

            if (hasPrediction)
                await db.transaction().execute(async (tdb) => {
                    for (const p of problems) {
                        const rating = Math.round(p.rating / 100) * 100;
                        const probRating = Math.max(800, rating);
                        const index = p.url.match("\/problem\/([A-Z]\\d?)$")[1];
                        // update for short time.
                        for (let i = 0; i < cachedProb.length; i++) {
                            if (cachedProb[i].index == index) {
                                cachedProb[i].predicted_rating = probRating;
                                console.log(index, probRating);
                            }
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
            else
                console.log("Clists has no prediction yet")
        }
        console.log(cachedProb);

        const predictedRatingWidth = 15;
        let table = new CliTable3({
            head: ['#', 'Actual', 'Predicted'],
            style: {
                head: [],
                border: [],
            },
            colAligns: ['center', 'center', 'center'],
            colWidths: [5, 10, 15],
        });

        for (const prob of cachedProb)
            table.push([prob.index, prob.official_rating || '-', formatRating(prob.predicted_rating, predictedRatingWidth) || '-']);

        const tableMsg = table.toString();

        await msg.reply({
            content: `\`\`\`${contestInfo.name} Ratings\n\n${tableMsg}\`\`\``
        });
    },
}