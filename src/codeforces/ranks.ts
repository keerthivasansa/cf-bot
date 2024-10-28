
export enum CFRank {
    NEWBIE,
    PUPIL,
    SPECIALIST,
    EXPERT,
    CM,
    MASTER,
    IM,
    GM,
    IGM,
    LGM,
    TOURIST
};

const ranks = [
    [0, CFRank.NEWBIE],
    [1200, CFRank.PUPIL],
    [1400, CFRank.SPECIALIST],
    [1600, CFRank.EXPERT],
    [1900, CFRank.CM],
    [2100, CFRank.MASTER],
    [2300, CFRank.IM],
    [2400, CFRank.GM],
    [2600, CFRank.IGM],
    [3000, CFRank.LGM],
    [4000, CFRank.TOURIST],
] as const;

export function getCfRank(rating: number) {
    let rank = CFRank.NEWBIE;
    for (let i = 0; i < ranks.length; i++) {
        if (rating > ranks[i][0])
            rank = ranks[i][1]
    };
    return rank;
}