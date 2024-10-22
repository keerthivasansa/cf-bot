import { dailyCmd } from "./commands/daily";
import { infoCmd } from "./commands/info";
import { percentileCmd } from "./commands/percentile";
import { perfCmd } from "./commands/perf";
import { probRatCmd } from "./commands/probrat";
import { ratingCmd } from "./commands/rating";
import { verifyCmd } from "./commands/verify";
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
    speedCmd,
    stalkCmd,
]
