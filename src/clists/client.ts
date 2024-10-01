import axios from "axios";
import { ClistProblem, ClistResponse } from "./types";


export class ClistsApi {
    private readonly API_USERNAME: string;
    private readonly API_KEY: string;
    private readonly client: Axios.AxiosInstance;
    private readonly BASE_URL = 'https://clist.by/api/v4/';

    constructor() {
        this.API_USERNAME = Bun.env.CLIST_USERNAME;
        this.API_KEY = Bun.env.CLIST_KEY;
        
        this.client = axios.create({
            baseURL: this.BASE_URL,
            headers: {
                "Authorization": `ApiKey ${this.API_USERNAME}:${this.API_KEY}`,
            }
        });
    }

    async getContestRatings(contestId: number) {
        const resp = await this.client.get("/problem", {
            params: {
                limit: 10,
                resource: 'codeforces.com',
                url__regex: `${contestId}\/problem\/[A-Z]\\d?$`
            }
        });
        if (resp.status != 200)
            throw new Error("Failed to fetch problem list from Clists.");
        
        return resp.data as ClistResponse<ClistProblem[]>
    }
}