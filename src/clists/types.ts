
export interface ClistProblem {
    name: string,
    rating: number,
    short: string,
    url: string,
    contest_ids: string[],
    divisions: string[]
}

export interface ClistResponse<T> {
    meta: {
        estimated_count?: number,
        limit: number,
        next: string,
        offset: number,
        total?: number
    },
    objects: T
}