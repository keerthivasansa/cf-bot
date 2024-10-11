import 'reflect-metadata';
import { Bot } from "$src/discord/bot";
import { CFCacher } from '$src/codeforces/cacher';
import { CFPercentileFactory } from '$src/codeforces/perc_store';

const application = {
    entry: [Bot, CFCacher],
    init: [CFPercentileFactory.init]
}

async function main() {
    // construct classes
    application.entry.forEach(cls => new cls());

    // init functions
    application.init.forEach(fn => fn());
}

main();
