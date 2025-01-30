import { QueuedTasker } from "$src/common/queue";
import axios from "axios";
import { setupCache } from 'axios-cache-interceptor';
import { CFApiUnavailable } from "./error";
import AxiosLogger from 'axios-logger';

class CodeforcesApi {
    private readonly INTERVAL = 150; // 2_000;
    private readonly DEFAULT_CACHE_EXPIRY = 36000 // 10 minutes
    private baseUrl = 'https://codeforces.com/api/';
    private client: Axios.AxiosInstance;
    private tasker: QueuedTasker;

    constructor() {
        this.tasker = new QueuedTasker(this.INTERVAL);
        this.client = axios.create({
            baseURL: this.baseUrl,
        });

        this.client.interceptors.request.use(AxiosLogger.requestLogger);

        setupCache(this.client);
    }

    async getUserSubmissions(handle: string, count: number = 5) {
        await this.tasker.waitForRelease();
        const resp = await this.client.get('user.status', {
            params: {
                handle,
                from: 1,
                count
            }
        });
        const data = resp.data as CfResult<Submission[]>;
        this.isCfDown(data);
        if (data.status != 'OK')
            return [];
        return data.result;
    }

    async getAllProblems() {
        await this.tasker.waitForRelease();
        const resp = await this.client.get('problemset.problems');
        const data = resp.data as CfResult<{ problems: Problem[] }>;
        this.isCfDown(data);
        if (data.status != 'OK')
            return [];
        return data.result.problems;
    }

    async getUsersInfo(handles: string[]) {
        await this.tasker.waitForRelease();
        const resp = await this.client.get('user.info', {
            params: {
                checkHistoricHandles: false,
                handles: handles.join(';')
            }
        });
        const data = resp.data as CfResult<User[]>;
        this.isCfDown(data);
        if (data.status != 'OK')
            return [];
        return data.result;
    }

    async getUserSolvedProblems(handle: string, contestId: number) {
        await this.tasker.waitForRelease();

        const resp = await this.client.get('contest.status', {
            params: {
                contestId,
                handle,
                count: 250
            }
        });
        const data = resp.data as CfResult<Submission[]>;
        this.isCfDown(data);
        if (data.status != 'OK')
            return new Set<string>();
        const solvedProbs: Set<string> = new Set();
        const submissions = data.result;
        for (let i = 0; i < submissions.length; i++) {
            if (submissions[i].verdict == 'OK' && submissions[i].testset === 'TESTS')
                solvedProbs.add(submissions[i].problem.index);
        }
        return solvedProbs;
    }

    async getUserRatings(handle: string) {
        await this.tasker.waitForRelease();

        const resp = await this.client.get('user.rating', {
            params: {
                handle,
            }
        });

        const data = resp.data as CfResult<RatingChange[]>;

        this.isCfDown(data);
        if (data.status != 'OK')
            return [];

        return data.result;
    }

    async getRatedUsers() {
        await this.tasker.waitForRelease();
        try {
            const resp = await this.client.get('user.ratedList', {
                params: {
                    includeRetired: false,
                    activeOnly: false,
                },
            });

            const data = resp.data as CfResult<User[]>;
            this.isCfDown(data);
            if (data.status != 'OK')
                return [];
            return data.result;
        } catch (err) {
            console.log(err);
            return [];
        }
    }

    async getContestStandings(contestId: number, handles: string) {
        await this.tasker.waitForRelease();
        const resp = await this.client.get('contest.standings', {
            params: {
                contestId,
                handles
            }
        });
        const data = resp.data as CfResult<{ rows: RanklistRow[], problems: Problem[] }>;
        console.log({ respStatus: resp.status, dataStatus: data.status, resp: data })
        this.isCfDown(data);
        if (data.status != 'OK')
            throw new Error(data.comment || 'Error fetching contest standings');
        return data.result;
    }

    async getContestInfo(contestId: number) {
        await this.tasker.waitForRelease();
        const resp = await this.client.get('contest.standings', {
            params: {
                contestId,
                count: 1
            }
        });
        const data = resp.data as CfResult<{ contest: Contest, problems: Problem[] }>;
        this.isCfDown(data);
        if (data.status != 'OK')
            throw new Error(data.comment || 'Error fetching contest standings');
        return data.result.contest;
    }

    async getContestRatingChanges(contestId: number) {
        await this.tasker.waitForRelease();
        const resp = await this.client.get('contest.ratingChanges', {
            params: {
                contestId,
            }
        });
        const data = resp.data as CfResult<RatingChange[]>;
        this.isCfDown(data);
        if (data.status != 'OK')
            throw new Error(data.comment || 'Error fetching contest standings');
        return data.result;
    }

    private isCfDown(responseData: unknown) {
        const UNAVAILABLE_MESSAGE = 'Codeforces is temporarily unavailable';

        if ((typeof responseData === 'string' || responseData instanceof String) && responseData.includes(UNAVAILABLE_MESSAGE))
            throw new CFApiUnavailable("Codeforces API is temporarily unavaiable - please check back later!");
    }
}

export type CFApi = CodeforcesApi;

export class CFApiFactory {
    private static instance: CodeforcesApi;

    static get() {
        if (!CFApiFactory.instance)
            CFApiFactory.instance = new CodeforcesApi();

        return CFApiFactory.instance;
    }
}