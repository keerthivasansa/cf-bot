import { db } from "$db/index";
import { InsertResult, UpdateResult } from "kysely";
import { CFApi, CFApiFactory } from "./client";

export class CFCacher {
    private readonly INTERVAL = 1800_000 // every hour;
    private readonly TASKS = [
        ["problems", () => this.cacheProblems()],
        ["users", () => this.cacheUsers()],
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
        if (prevRun + this.INTERVAL < now) {
            console.log('Running cache job:', taskName);
            taskFn();
            await db.updateTable("cache_status").set({
                last_executed: new Date()
            }).where("cache_key", "=", taskName).execute();
            setInterval(taskFn, this.INTERVAL);
        } else
            setTimeout(() => taskFn(), this.INTERVAL + prevRun - now);
    }

    async cacheProblems() {
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

    async cacheUsers() {
        const users = await db.selectFrom('users').selectAll().where('handle', 'is not', null).execute();
        const handles = users.map(usr => usr.handle);
        console.log("Caching user info");
        console.log(handles);
        const info = await this.cfApi.getUsersInfo(handles);
        console.time("caching users");
        await db.transaction().execute(tdb => {
            let promises: Promise<any>[] = [];
            info.forEach(usr => {
                promises.push(
                    tdb.updateTable('users')
                        .set({
                            rating: usr.rating,
                            max_rating: usr.maxRating
                        })
                        .where('handle', '=', usr.handle)
                        .execute()
                )
            });
            return Promise.all(promises);
        });
        console.timeEnd("caching users");
        console.log("Cached!");
    }
}