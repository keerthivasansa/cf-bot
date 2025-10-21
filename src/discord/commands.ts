import { dailyCmd } from "./commands/daily";
import { infoCmd } from "./commands/info";
import { leaderboardCmd } from "./commands/leaderboard";
import { percentileCmd } from "./commands/percentile";
import { perfCmd } from "./commands/perf";
import { probRatCmd } from "./commands/probrat";
import { ratingCmd } from "./commands/rating";
import { ratingChangeCmd } from "./commands/ratingchange";
import { verifyCmd } from "./commands/verify";
import { ranklistCmd } from "./commands/ranklist";
import { speedCmd } from "./commands/speed";
import { stalkCmd } from "./commands/stalk";
import { helpCmd } from "./commands/help";

export const registeredCommands = [
    helpCmd,
    verifyCmd,
    infoCmd,
    probRatCmd,
    dailyCmd,
    ratingCmd,
    ratingChangeCmd,
    perfCmd,
    percentileCmd,
    leaderboardCmd,
    ranklistCmd,
    speedCmd,
    stalkCmd
];
