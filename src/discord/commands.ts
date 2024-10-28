import { dailyCmd } from "./commands/daily";
import { infoCmd } from "./commands/info";
import { leaderboardCmd } from "./commands/leaderboard";
import { percentileCmd } from "./commands/percentile";
import { perfCmd } from "./commands/perf";
import { probRatCmd } from "./commands/probrat";
import { ratingCmd } from "./commands/rating";
import { verifyCmd } from "./commands/verify";
import { ranklistCmd } from "./commands/ranklist";
import { speedCmd } from "./commands/speed";
import { stalkCmd } from "./commands/stalk";

export const registeredCommands = [
    verifyCmd,
    infoCmd,
    probRatCmd,
    dailyCmd,
    ratingCmd,
    perfCmd,
    percentileCmd,
    leaderboardCmd,
    ranklistCmd,
    speedCmd,
    stalkCmd,
]
