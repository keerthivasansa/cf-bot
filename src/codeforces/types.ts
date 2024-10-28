interface User {
    handle: string;
    email?: string;
    vkId?: string;
    openId?: string;
    firstName?: string;
    lastName?: string;
    country?: string;
    city?: string;
    organization?: string;
    contribution: number;
    rank: string;
    rating: number;
    maxRank: string;
    maxRating: number;
    lastOnlineTimeSeconds: number;
    registrationTimeSeconds: number;
    friendOfCount: number;
    avatar: string;
    titlePhoto: string;
}

interface BlogEntry {
    id: number;
    originalLocale: string;
    creationTimeSeconds: number;
    authorHandle: string;
    title: string;
    content?: string;
    locale: string;
    modificationTimeSeconds: number;
    allowViewHistory: boolean;
    tags: string[];
    rating: number;
}

interface Comment {
    id: number;
    creationTimeSeconds: number;
    commentatorHandle: string;
    locale: string;
    text: string;
    parentCommentId?: number;
    rating: number;
}

interface RecentAction {
    timeSeconds: number;
    blogEntry?: BlogEntry;
    comment?: Comment;
}

interface RatingChange {
    contestId: number;
    contestName: string;
    handle: string;
    rank: number;
    ratingUpdateTimeSeconds: number;
    oldRating: number;
    newRating: number;
}

interface Contest {
    id: number;
    name: string;
    type: 'CF' | 'IOI' | 'ICPC';
    phase: 'BEFORE' | 'CODING' | 'PENDING_SYSTEM_TEST' | 'SYSTEM_TEST' | 'FINISHED';
    frozen: boolean;
    durationSeconds: number;
    startTimeSeconds?: number;
    relativeTimeSeconds?: number;
    preparedBy?: string;
    websiteUrl?: string;
    description?: string;
    difficulty?: number;
    kind?: string;
    icpcRegion?: string;
    country?: string;
    city?: string;
    season?: string;
}

interface Party {
    contestId?: number;
    members: Member[];
    participantType: 'CONTESTANT' | 'PRACTICE' | 'VIRTUAL' | 'MANAGER' | 'OUT_OF_COMPETITION';
    teamId?: number;
    teamName?: string;
    ghost: boolean;
    room?: number;
    startTimeSeconds?: number;
}

interface Member {
    handle: string;
    name?: string;
}

interface Problem {
    contestId?: number;
    problemsetName?: string;
    index: string;
    name: string;
    type: 'PROGRAMMING' | 'QUESTION';
    points?: number;
    rating?: number;
    tags: string[];
}

interface ProblemStatistics {
    contestId?: number;
    index: string;
    solvedCount: number;
}

interface Submission {
    id: number;
    contestId?: number;
    creationTimeSeconds: number;
    relativeTimeSeconds: number;
    problem: Problem;
    author: Party;
    programmingLanguage: string;
    verdict?: 'FAILED' | 'OK' | 'PARTIAL' | 'COMPILATION_ERROR' | 'RUNTIME_ERROR' | 'WRONG_ANSWER' | 'PRESENTATION_ERROR' | 'TIME_LIMIT_EXCEEDED' | 'MEMORY_LIMIT_EXCEEDED' | 'IDLENESS_LIMIT_EXCEEDED' | 'SECURITY_VIOLATED' | 'CRASHED' | 'INPUT_PREPARATION_CRASHED' | 'CHALLENGED' | 'SKIPPED' | 'TESTING' | 'REJECTED';
    testset: 'SAMPLES' | 'PRETESTS' | 'TESTS' | 'CHALLENGES' | 'TESTS1' | 'TESTS2' | 'TESTS3' | 'TESTS4' | 'TESTS5' | 'TESTS6' | 'TESTS7' | 'TESTS8' | 'TESTS9' | 'TESTS10';
    passedTestCount: number;
    timeConsumedMillis: number;
    memoryConsumedBytes: number;
    points?: number;
}

interface Hack {
    id: number;
    creationTimeSeconds: number;
    hacker: Party;
    defender: Party;
    verdict?: 'HACK_SUCCESSFUL' | 'HACK_UNSUCCESSFUL' | 'INVALID_INPUT' | 'GENERATOR_INCOMPILABLE' | 'GENERATOR_CRASHED' | 'IGNORED' | 'TESTING' | 'OTHER';
    problem: Problem;
    test?: string;
    judgeProtocol?: {
        manual: boolean;
        protocol: string;
        verdict: string;
    };
}

interface RanklistRow {
    party: Party;
    rank: number;
    points: number;
    penalty: number;
    successfulHackCount: number;
    unsuccessfulHackCount: number;
    problemResults: ProblemResult[];
    lastSubmissionTimeSeconds?: number;
}

interface ProblemResult {
    points: number;
    penalty?: number;
    rejectedAttemptCount: number;
    type: 'PRELIMINARY' | 'FINAL';
    bestSubmissionTimeSeconds?: number;
}

type CfResult<T> = {
    status: 'OK' | 'FAILED';
    result: T
}  