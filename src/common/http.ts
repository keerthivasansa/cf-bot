import Redis from "ioredis";


function createCachedAxios(baseUrl: string) {
    const client = axios.create({ baseURL: baseUrl });
    const redis = new Redis(Bun.env.REDIS_URL);

    client.interceptors.request.use((config) => {
        const serialized = config.paramsSerializer(config.params)
        const url = config.url;
        const final = `${url}__${serialized}`;
        
        console.log({ url, serialized, final });
        return config;
    });

    client.interceptors.response.use((resp) => {
        const serialized = resp.config.paramsSerializer(resp.config.params)
        const url = resp.config.url;
        const final = `${url}__${serialized}`;

        redis.set(final, JSON.stringify(resp.data))
        return resp;
    })

    return client;
}