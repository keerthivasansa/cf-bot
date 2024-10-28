
export enum CFRank {
    SPECIALIST,
    EXPERT,
    NEWBIE,
    PUPIL
};

const ranks = [
    [0, CFRank.NEWBIE],
    [1200, CFRank.PUPIL],
    [1400, CFRank.SPECIALIST],
    [1600, CFRank.EXPERT],
] as const;

export function getCfRank(rating: number) {
    let rank = CFRank.NEWBIE;
    for (let i = 0; i < ranks.length; i++) {
        if (rating > ranks[i][0])
            rank = ranks[i][1]
    };
    return rank;
}