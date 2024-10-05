import { dailyCmd } from "./commands/daily";
import { infoCmd } from "./commands/info";
import { probRatCmd } from "./commands/probrat";
import { verifyCmd } from "./commands/verify";

export const registeredCommands = [
    verifyCmd,
    infoCmd,
    probRatCmd,
    dailyCmd
]
