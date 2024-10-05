import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { randomInt } from "crypto";
import { CFApiFactory } from "$src/codeforces/client";
import { Problems } from "kysely-codegen";

const DAILY_POINTS = 50;

export const dailyCmd: Command = {
    info: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Finish your daily problem'),

    async execute(msg) {
        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();

        if (!user)
            return msg.reply("Register your handle using `/verify` first to complete daily problems.");

        const cfApi = CFApiFactory.get();

        // if (user.daily) {
        //     // check submission
        // } else 
        if (user.rating) {
            // generate random problem.
            const start = Math.floor(user.rating / 100) * 100;
            const end = start + 200;

            let offset = 0;
            const probSet: Map<number, Set<string>> = new Map();


            let problem: Problems;
            // improve this algorithm -- maybe save daily questions and check if they are solved.
            while (!problem) {
                const problems = await db
                    .selectFrom('problems')
                    .selectAll()
                    .orderBy(['contestId desc'])
                    .where(wh => wh.and([
                        wh('official_rating', '>=', start),
                        wh('official_rating', '<=', end),
                    ]))
                    .limit(50)
                    .offset(offset)
                    .execute();
                while (problems.length) {
                    const probIndex = randomInt(problems.length);
                    const randProb = problems[probIndex];

                    if (!probSet.has(randProb.contestId))
                        probSet.set(randProb.contestId, await cfApi.getUserSolvedProblems(user.handle, randProb.contestId));

                    const contest = probSet.get(randProb.contestId);

                    if (contest.has(randProb.index)){
                        console.log('collision with', randProb.contestId, randProb.index);
                        problems.splice(probIndex, 1);
                    }
                    else {
                        problem = randProb;
                        break;
                    }
                }

                offset += 50;
            }

            console.log("scanned through ", offset, "problems")

            if (!problem)
                return msg.reply('You have solved all problems that have been cached till now! - Amazing!')

            const probId = `${problem.contestId}${problem.index}`;

            await db.updateTable('users').set({
                daily: probId
            }).where('discordId', '=', msg.user.id).execute();

            return msg.reply(`Your daily problem: \`${probId} (${problem.official_rating})\`.\nVisit: https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}`)
        } else
            return msg.reply("Your rating has not been updated yet, please come back later!");
    },
};