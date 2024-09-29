import axios from "axios";

export class CodeforcesApi {
    private baseUrl = 'https://codeforces.com/api/';
    private client: Axios.AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: this.baseUrl
        });
    }

    async getUserSubmissions(handle: string, count: number = 5) {
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
}