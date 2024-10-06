import { SlashCommandBuilder } from "discord.js";
import { Command } from "../type";
import { db } from "$db/index";
import { randomInt } from "crypto";
import { CFApiFactory } from "$src/codeforces/client";
import { Problems } from "kysely-codegen";
import { genProblemLink } from "$src/codeforces/utils";

const DAILY_POINTS = 50;

export const dailyCmd: Command = {
    info: new SlashCommandBuilder()
        .setName('daily')
        .setDescription('Finish your daily problem'),

    async execute(msg) {
        const user = await db.selectFrom('users').selectAll().where('discordId', '=', msg.user.id).executeTakeFirst();
        const daily = await db.selectFrom('daily_problem').selectAll().where('discord_id', '=', msg.user.id).executeTakeFirst();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.log(daily, { today })

        if (!user)
            return msg.reply("Register your handle using `/verify` first to complete daily problems.");

        const cfApi = CFApiFactory.get();

        if (daily && daily.last_updated.getTime() == today.getTime()) {
            if (daily.solved) // finished
                return msg.reply("You have already completed today's daily problem, come back tomorrow! :rocket:")

            // check submission
            const submissions = await cfApi.getUserSolvedProblems(user.handle, daily.problem_contest);
            const probLink = genProblemLink(daily.problem_contest, daily.problem_index);

            if (!submissions.has(daily.problem_index))
                return msg.reply(`You have not submitted a solution to the problem! The problem link: ${probLink}`)

            await msg.reply(`Congratulations! \`+${DAILY_POINTS}\`, come back tomorrow! :tada:`)

            await db
                .updateTable('users')
                .set(eb => ({
                    score: eb("score", '+', DAILY_POINTS.toString()),
                }))
                .where('discordId', '=', msg.user.id)
                .execute();

            await db
                .updateTable('daily_problem')
                .set({
                    solved: true
                })
                .where('discord_id', '=', msg.user.id)
                .execute();
        }
        else if (user.rating) {
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
                    .limit(40)
                    .offset(offset)
                    .execute();
                while (problems.length) {
                    const probIndex = randomInt(problems.length);
                    const randProb = problems[probIndex];

                    if (!probSet.has(randProb.contestId))
                        probSet.set(randProb.contestId, await cfApi.getUserSolvedProblems(user.handle, randProb.contestId));

                    const contest = probSet.get(randProb.contestId);

                    if (contest.has(randProb.index)) {
                        console.log('collision with', randProb.contestId, randProb.index);
                        problems.splice(probIndex, 1);
                    }
                    else {
                        problem = randProb;
                        break;
                    }
                }
                offset += 20;
            }

            console.log("scanned through ", offset, "problems")

            if (!problem)
                return msg.reply('You have solved all problems that have been cached till now! - Amazing!')

            const probId = `${problem.contestId}${problem.index}`;
            const probLink = genProblemLink(problem.contestId, problem.index);

            if (!daily) {
                await db
                    .insertInto('daily_problem')
                    .values({
                        discord_id: msg.user.id,
                        last_updated: today,
                        problem_contest: problem.contestId,
                        problem_index: problem.index,
                        solved: false,
                    }).execute();
            } else {
                await db
                    .updateTable('daily_problem')
                    .set({
                        last_updated: today,
                        problem_contest: problem.contestId,
                        problem_index: problem.index,
                        solved: false,
                    })
                    .where('discord_id', '=', msg.user.id)
                    .execute();
            }
            return msg.reply(`Your daily problem: \`${probId} (${problem.official_rating})\`.\nVisit: ${probLink}`)
        } else
            return msg.reply("Your rating has not been updated yet, please come back later!");
    },
};