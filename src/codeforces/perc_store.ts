
import Redis from 'ioredis';
import { CFApiFactory } from "./client";
import { CFApiUnavailable } from './error';
import { readFileSync } from 'fs';

export type PercentileType = 'max' | 'current';

class CFPercentileStore {
    private redis: Redis;
    private MIN_RATING = 0;
    private MAX_RATING = 4000;
    private INTERVAL = 6 * 3600 * 1000 // 6 hours
    private currRatingMap: Map<number, number>;
    private maxRatingMap: Map<number, number>;

    constructor() {
        this.redis = new Redis(Bun.env.REDIS_URL);
        this.runCache();

        this.maxRatingMap = new Map();
        this.currRatingMap = new Map();

        const perc2024File = readFileSync("src/codeforces/data/perc_data.txt", "utf-8");
        const lines = perc2024File.split("\n");
        for (let i = 101; i < lines.length; i++) {
            const parts = lines[i].trim().split("\t");
            console.log(parts);
            const rating = parseInt(parts[0]);
            const percentile = parseInt(parts[1] || '0');
            console.log({ rating, percentile });
            this.currRatingMap.set(rating, percentile);
            this.maxRatingMap.set(rating, percentile);
        }

        console.log("Rating for 1504", this.currRatingMap.get(1504));


        setInterval(() => this.runCache(), this.INTERVAL);
    }

    async runCache() {
        try {
            console.log('running perc cache')
            await this.cache();
        } catch (err) {
            if (err instanceof CFApiUnavailable)
                console.log('Skipping perc cache - cf api down');
            else
                throw err;
        }
    }

    async cache() {
        console.time("store percentile");
        const cfApi = CFApiFactory.get();
        const users = await cfApi.getRatedUsers();
        if (users.length < 1){
            console.log("Skipping refresh of percentile - api not available");
            return;
        }

        const promises: Promise<any>[] = [];

        users.sort((a, b) => {
            if (a.maxRating < b.maxRating)
                return -1;
            else if (a.maxRating > b.maxRating)
                return 1;
            else
                return 0;
        });

        for (let i = this.MIN_RATING; i <= this.MAX_RATING; i++) {
            const perc = parseFloat(this.getPercentile(i, users, 'maxRating').toFixed(2));
            promises.push(this.redis.set(`max_${i}`, perc, (cb) => null));
            this.maxRatingMap.set(i, perc);
        }

        users.sort((a, b) => {
            if (a.rating < b.rating)
                return -1;
            else if (a.rating > b.rating)
                return 1;
            else
                return 0;
        });

        for (let i = this.MIN_RATING; i <= this.MAX_RATING; i++) {
            const perc = parseFloat(this.getPercentile(i, users, 'rating').toFixed(2))
            promises.push(this.redis.set(`current_${i}`, perc, (cb) => null));
            this.currRatingMap.set(i, perc);
        }

        await Promise.all(promises);
        console.timeEnd("store percentile");
    }

    private getPercentile(rating: number, users: User[], field: 'maxRating' | 'rating') {
        let low = 0, high = users.length - 1;
        while (low <= high) {
            let mid = Math.floor((low + high) / 2);
            if (users[mid][field] > rating)
                high = mid - 1;
            else
                low = mid + 1;
        }
        return Math.max(high, 0) * 100 / users.length;
    }

    get(rating: number, type: PercentileType) {
        const map = this.getMap(type);

        if (map.has(rating))
            return map.get(rating);
        return this.redis.get(`${type}_${rating}`);
    }

    getMap(type: PercentileType) {
        return type === 'max' ? this.maxRatingMap : this.currRatingMap;
    }
};

export class CFPercentileFactory {
    static instance: CFPercentileStore;

    static get() {
        const _this = CFPercentileFactory;
        if (!_this.instance)
            _this.instance = new CFPercentileStore();

        return _this.instance;
    }

    static init() {
        const _this = CFPercentileFactory;
        if (_this.instance)
            return;
        _this.instance = new CFPercentileStore();
    }
}