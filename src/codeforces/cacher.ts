import { db } from "$db/index";
import { InsertResult, UpdateResult } from "kysely";
import { CFApi, CFApiFactory } from "./client";
import { UserProcesser } from "$src/discord/user";
import { CFApiUnavailable } from "./error";

export class CFCacher {
    private readonly INTERVAL = 1800_000 // every hour;
    private readonly TASKS = [
        ["problems", this.cacheProblems.bind(this)],
        ["users", this.cacheUsers.bind(this)],
    ] as const;
    private readonly cfApi: CFApi;
    private readonly lastExecuted: Record<string, number | null>;

    constructor() {
        this.cfApi = CFApiFactory.get();
        this.lastExecuted = {};
        this.init();
    }

    async init() {
        const cacheStatus = await db.selectFrom("cache_status").selectAll().execute();
        for (let row of cacheStatus) {
            this.lastExecuted[row.cache_key] = row.last_executed.getTime();
        }
        for (let tsk of this.TASKS)
            this.cacheCore(tsk[0], tsk[1]);
    }

    async cacheCore(taskName: string, taskFn: Function) {
        const prevRun = this.lastExecuted[taskName] || 0;
        const now = Date.now();
        try {
            if (prevRun + this.INTERVAL < now) {
                console.log('Running cache job:', taskName);
                await taskFn();
                await db.updateTable("cache_status").set({
                    last_executed: new Date()
                }).where("cache_key", "=", taskName).execute();
                setInterval(taskFn, this.INTERVAL);
            } else
                setTimeout(taskFn, this.INTERVAL + prevRun - now);
        } catch (err) {
            console.log('error handled')
            if (err instanceof CFApiUnavailable)
                console.log("Skipping cache job - CF API down");
            else
                throw err;
        }
    }

    async cacheProblems() {
        let rows = await db.selectFrom('problems').select(({ fn, val, ref }) => [
            'contestId',
            fn.sum('official_rating').as('rating')
        ]).groupBy('contestId').execute();

        const ratedContest = new Set<number>();
        const cachedContest = new Set<number>();

        rows.forEach(row => {
            if (row.rating)
                ratedContest.add(row.contestId);
            cachedContest.add(row.contestId);
        });

        const tx = db.transaction();

        console.time("fetch");
        const problems = await this.cfApi.getAllProblems();
        console.timeEnd("fetch");

        console.time("caching");
        console.log("total: ", problems.length);

        await tx.execute(async (tdb) => {
            const promises: Promise<(InsertResult[] | UpdateResult[])>[] = [];

            for (let i = 0; i < problems.length; i++) {
                const prob = problems[i];

                if (prob.rating && prob.contestId && !ratedContest.has(prob.contestId)) {
                    console.log('rating contest', prob.contestId);
                    const q = tdb.updateTable('problems').set({
                        official_rating: prob.rating
                    }).where(eb =>
                        eb.and([
                            eb('contestId', '=', prob.contestId),
                            eb('index', '=', prob.index)
                        ])
                    );
                    promises.push(q.execute());
                }

                else if (prob.contestId && !cachedContest.has(prob.contestId)) {
                    console.log('caching contest', prob.contestId);
                    const q = tdb.insertInto('problems').values({
                        contestId: prob.contestId,
                        index: prob.index,
                        official_rating: prob.rating
                    }).execute();
                    promises.push(q);
                }
            }
            await Promise.all(promises);
        });
        console.timeEnd("caching");
    }

    async cacheUsers() {
        const users = await db.selectFrom('users').selectAll().where('handle', 'is not', null).execute();

        const ratingMap = new Map<string, [number, string, string]>();
        users.forEach(usr => ratingMap.set(usr.handle.toLowerCase(), [usr.rating, usr.discordId, usr.handle]));

        const handles = users.map(usr => usr.handle);
        console.log("Caching user info");
        console.log({ handles });
        const info = await this.cfApi.getUsersInfo(handles);
        console.time("caching users");
        await db.transaction().execute(tdb => {
            let promises: Promise<any>[] = [];
            info.forEach(usr => {
                const handle = usr.handle?.toLowerCase();
                if (!handle || !ratingMap.get(handle)) {
                    console.log("missing info for", usr.handle)
                    return;
                }
                const [oldRating, discordId, ogHandle] = ratingMap.get(handle);
                console.log(handle, oldRating, usr.rating);
                UserProcesser.processRatingChange(discordId, oldRating, usr.rating);

                promises.push(
                    tdb.updateTable('users')
                        .set({
                            rating: usr.rating,
                            max_rating: usr.maxRating
                        })
                        .where('handle', '=', ogHandle)
                        .execute()
                )
            });
            return Promise.all(promises);
        });
        console.timeEnd("caching users");
        console.log("Cached!");
    }
}