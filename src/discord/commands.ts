import { dailyCmd } from "./commands/daily";
import { infoCmd } from "./commands/info";
import { perfCmd } from "./commands/perf";
import { probRatCmd } from "./commands/probrat";
import { ratingCmd } from "./commands/rating";
import { verifyCmd } from "./commands/verify";

export const registeredCommands = [
    verifyCmd,
    infoCmd,
    probRatCmd,
    dailyCmd,
    ratingCmd,
    perfCmd
]
