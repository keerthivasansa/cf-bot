import { CFRank, getCfRank } from "$src/codeforces/ranks"

export const TEST_ROLES = {
    [CFRank.SPECIALIST]: '1297999660912218142',
    [CFRank.EXPERT]: '1297999720945422426',
    [CFRank.NEWBIE]: '1297999802445074533',
    [CFRank.PUPIL]: '1297999826578837597',
}

export const MAIN_ROLES = {
    [CFRank.NEWBIE]: '1300039347025739848',
    [CFRank.PUPIL]: '1300039479540584468',
    [CFRank.SPECIALIST]: '1300040608508936212',
    [CFRank.EXPERT]: '1300039547400360019',
    [CFRank.CM]: '1300039632242737175',
    [CFRank.MASTER]: '1300040901762220065',
    [CFRank.IM]: '1300039738136334428',
    [CFRank.GM]: '1300064350920245279',
    [CFRank.IGM]: '1300065479402192948',
    [CFRank.LGM]: '1300066332024246322',
    [CFRank.TOURIST]: '1300509089885065261',
}

export const TEST_SERVER_ID = '1289271676001062972';
export const MAIN_SERVER_ID = '757874105780535318';

export const roleServerMap = {
    [TEST_SERVER_ID]: TEST_ROLES,
    [MAIN_SERVER_ID]: MAIN_ROLES
};

export function getRole(rating: number, serverId: string) {
    const rank = getCfRank(rating);
    const roles = serverId === TEST_SERVER_ID ? TEST_ROLES : MAIN_ROLES;
    return roles[rank];
}