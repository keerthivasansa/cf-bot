import { QueuedTasker } from "$src/common/queue";
import axios from "axios";

class CodeforcesApi {
    private readonly INTERVAL = 2_000;
    private baseUrl = 'https://codeforces.com/api/';
    private client: Axios.AxiosInstance;
    private tasker: QueuedTasker;

    constructor() {
        this.tasker = new QueuedTasker(this.INTERVAL);
        this.client = axios.create({
            baseURL: this.baseUrl
        });
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
        if (data.status != 'OK')
            return [];
        return data.result;
    }

    async getAllProblems() {
        await this.tasker.waitForRelease();
        const resp = await this.client.get('problemset.problems');
        const data = resp.data as CfResult<{ problems: Problem[] }>;
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
        if (data.status != 'OK')
            return [];
        return data.result;
    }

    async getUserSolvedProblems(handle: string, contestId: number) {
        await this.tasker.waitForRelease();
        // https://codeforces.com/api/contest.status?contestId=2008&handle=sakeerthi23&count=100
        const resp = await this.client.get('contest.status', {
            params: {
                contestId,
                handle,
                count: 250
            }
        });
        const data = resp.data as CfResult<Submission[]>;
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