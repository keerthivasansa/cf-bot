import { db } from "$db/index";
import { InsertResult, UpdateResult } from "kysely";
import { CodeforcesApi } from "./client";


export class CFCacher {
    private readonly INTERVAL = 3600_000 // every hour;
    private readonly TASKS = [
        ["problems", this.cacheProblems],
    ];
    private readonly cfApi: CodeforcesApi;
    private readonly lastExecuted: Record<string, number | null>;

    constructor() {
        this.cfApi = new CodeforcesApi();
        this.init();
    }

    async init() {
        const cacheStatus = await db.selectFrom("cache_status").selectAll().execute();
        for (let row of cacheStatus) {
            this.lastExecuted[row.cache_key] = row.last_executed.getTime();
        }
    }

    async cacheCore(taskName: string, taskFn: Function) {
        const prevRun = this.lastExecuted[taskName] || 0;
        if (!prevRun) {
            taskFn();
            await db.updateTable("cache_status").set({
                last_executed: new Date()
            }).where("cache_key", "=", taskName).execute();
        }
        const now = Date.now();
        setTimeout(() => taskFn(), this.INTERVAL + prevRun - now);
    }

    async cacheProblems() {
        const name = "problems";

        let { cached_contest } = await db.selectFrom("problems").select(({ fn, val, ref }) => [
            fn.max('contestId').as('cached_contest')
        ]).executeTakeFirst();

        if (!cached_contest)
            cached_contest = 0;

        let { rated_contest } = await db.selectFrom('problems').select(({ fn, val, ref }) => [
            fn.max('contestId').as('rated_contest')
        ]).where('official_rating', 'is not', null).executeTakeFirst();

        if (!rated_contest)
            rated_contest = 0;

        const tx = db.transaction();

        console.log({ cached_contest, rated_contest });

        console.time("fetch");
        const problems = await this.cfApi.getAllProblems();
        console.timeEnd("fetch");

        console.time("caching");
        console.log("total: ", problems.length);

        await tx.execute(async (tdb) => {
            const promises: Promise<(InsertResult[] | UpdateResult[])>[] = [];

            for (let i = 0; i < problems.length; i++) {
                const prob = problems[i];
                if (i % 500 == 0)
                    console.log("Finished", i);

                // if it's greater than cached contest -> insert new problems.
                if (prob.contestId > cached_contest && prob.contestId) {
                    const q = tdb.insertInto('problems').values({
                        contestId: prob.contestId,
                        index: prob.index,
                        official_rating: prob.rating
                    }).execute();
                    promises.push(q);
                }

                // if it's greater than rated contest and has problem rating -> update official rating.
                else if (prob.contestId > rated_contest && prob.rating && prob.contestId) {
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
            }

            await Promise.all(promises);
        });
        console.timeEnd("caching");
    }
}