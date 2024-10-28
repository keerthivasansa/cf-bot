import { CFRank, getCfRank } from "$src/codeforces/ranks"

export const ROLES = {
    [CFRank.SPECIALIST]: '1297999660912218142',
    [CFRank.EXPERT]: '1297999720945422426',
    [CFRank.NEWBIE]: '1297999802445074533',
    [CFRank.PUPIL]: '1297999826578837597',
}

export function getRole(rating: number) {
    const rank = getCfRank(rating);
    return ROLES[rank];
}